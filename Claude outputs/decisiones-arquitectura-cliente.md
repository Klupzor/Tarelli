# Tarelli — Decisiones de arquitectura

**Documento preparado para el cliente del proyecto.** Resume las decisiones
técnicas más relevantes tomadas durante el desarrollo de Tarelli y explica el
razonamiento detrás de cada una: qué alternativas se consideraron, por qué se
descartaron y qué se gana con la opción elegida. No es un manual de uso ni una
referencia de API (para eso existen `README.md` y `docs/openapi.yaml`); es el
"por qué" detrás del "qué".

## Resumen

Tarelli es una aplicación de gestión personal de tareas construida como una
SPA en React que consume una API REST propia en Node.js/Express, respaldada
por PostgreSQL. La arquitectura prioriza tres cosas por encima de cualquier
otra consideración: simplicidad operativa (menos piezas que puedan fallar o
que haya que mantener), seguridad por defecto en todo lo relacionado con
sesión y acceso a datos, y una superficie de API mínima y predecible. Ninguna
decisión aquí documentada persigue impresionar con complejidad; todas buscan
lo contrario, resolver el problema real con el menor número de partes móviles
que eso permite.

## Arquitectura general: monolito modular en vez de microservicios

El backend se organiza como un **monolito modular**: un único proceso y un
único despliegue, pero con el código dividido internamente por dominio
(`auth`, `tareas`, `categorias`, `etiquetas`, `usuarios`), cada uno con sus
propias capas de rutas, controlador, servicio y repositorio.

Se descartó una arquitectura de microservicios porque, para el volumen de
funcionalidad y de usuarios de este producto, habría introducido costos reales
sin beneficios correspondientes: transacciones distribuidas donde hoy basta
una transacción de base de datos local, redes internas y balanceo entre
servicios donde hoy basta una llamada de función, y una superficie operativa
(varios contenedores, colas, descubrimiento de servicios) que multiplica el
trabajo de despliegue y observabilidad sin que exista todavía una razón de
negocio — como escalar un dominio de forma independiente de los demás, o que
equipos distintos trabajen en paralelo sobre servicios distintos — que lo
justifique. Adoptar microservicios en esta etapa habría sido pagar por
flexibilidad organizativa que el proyecto no necesita, a costa de velocidad de
desarrollo y de superficie de fallo.

La separación por dominios dentro del monolito no es cosmética: cada módulo
solo puede acceder a su propia tabla a través de su propio repositorio, y la
capa de controlador nunca toca la base de datos directamente. Esto conserva
la propiedad más valiosa de una arquitectura de microservicios — límites
claros entre dominios — sin pagar su costo operativo, y deja abierta la
puerta a extraer un módulo como servicio independiente el día que una razón
de negocio concreta lo justifique, sin tener que rediseñar el dominio desde
cero.

## Modelo de autorización: ownership puro, sin roles ni seguridad a nivel de fila en la base de datos

No existen roles ni administradores en el sistema. Cada usuario autenticado
únicamente puede ver y modificar los recursos que le pertenecen, y esa regla
se aplica en la capa de aplicación: toda consulta y toda mutación de tareas,
categorías y etiquetas incluye el `usuario_id` extraído del token como parte
del filtro, nunca un valor que el cliente pueda enviar.

Se evaluó y se descartó usar **Row-Level Security (RLS)** de PostgreSQL para
resolver esto a nivel de base de datos. RLS es la herramienta correcta cuando
existen múltiples roles con reglas de acceso distintas entre sí, o cuando
varias aplicaciones distintas comparten la misma base de datos y no se puede
confiar en que todas apliquen el filtro correctamente. Aquí ninguna de las dos
condiciones se cumple: hay un solo rol (usuario dueño de sus datos) y una sola
aplicación con acceso a la base. Añadir RLS habría sumado una capa de
políticas SQL que replica, con otra sintaxis y en otro lugar, una regla que ya
se aplica de forma consistente en el código y que los tests de integración
verifican explícitamente con escenarios de dos usuarios cruzando accesos. El
riesgo real de un descuido de ownership no se elimina duplicando la regla en
dos capas; se elimina con disciplina en una sola capa y pruebas automatizadas
que la protejan, que es el enfoque adoptado.

Una consecuencia deliberada de este modelo: cuando un usuario intenta acceder
a un recurso que no le pertenece, la API responde **404 (no encontrado)** en
lugar de 403 (prohibido). Devolver 403 confirmaría, de forma indirecta, que el
recurso existe pero pertenece a otra persona — una fuga de información menor
pero evitable. Responder 404 no distingue entre "no existe" y "no es tuyo", y
esa ambigüedad es intencional.

## Autenticación y gestión de sesión

La sesión se sostiene con dos tokens de naturaleza distinta, cada uno resuelto
en el lugar donde su modelo de riesgo tiene más sentido:

El **token de acceso** es un JWT de corta duración que vive únicamente en
memoria en el frontend — nunca en `localStorage`, `sessionStorage` ni en una
cookie legible por JavaScript. Su payload es mínimo (`sub`, `iat`, `exp`)
para que, si en algún momento se filtrara, exponga la menor información
posible. Vivir solo en memoria significa que se pierde al recargar la página,
lo cual es una molestia aceptada a cambio de eliminar el vector de robo más
común contra JWTs guardados en almacenamiento persistente del navegador
(ataques de tipo XSS que leen `localStorage`).

Esa molestia se resuelve con el **token de refresco**: un valor opaco (no un
JWT, sin información legible dentro) con formato `<identificador>.<secreto>`,
del cual la base de datos solo almacena el hash HMAC-SHA256 del secreto —
nunca el valor en claro, de modo que ni siquiera un acceso directo a la base
de datos permite reconstruir un token válido. Viaja en una cookie
`HttpOnly` (invisible a JavaScript, por lo tanto inmune a robo vía XSS),
`Secure` en producción y `SameSite=Strict`. Al cargar la aplicación, el
frontend intenta automáticamente un refresco silencioso contra esa cookie
para recuperar la sesión sin pedir credenciales de nuevo.

Sobre ese token de refresco se implementaron dos protecciones que van más
allá de lo mínimo esperado en un reto técnico, porque son las que de verdad
importan en producción: **rotación** (cada uso del token de refresco lo
revoca y emite uno nuevo, en una sola transacción) y **detección de
reutilización** (si llega un token que ya fue revocado — señal de que alguien
más lo capturó y lo está usando en paralelo — se revoca automáticamente toda
la sesión del usuario, no solo ese token). Esto convierte el robo de un
token de refresco en un incidente detectable y contenible, en lugar de un
acceso indefinido y silencioso.

## Protección CSRF con patrón de doble envío

La mayor parte de la API se autentica con un `Authorization: Bearer <token>`
explícito en cada petición, lo cual ya es inmune a CSRF por diseño: un sitio
malicioso no puede forzar al navegador a añadir esa cabecera. El único punto
de fricción son los dos endpoints que, por necesidad, se autentican solo con
la cookie de refresco (`/auth/refresh` y `/auth/logout`), porque en ese
momento el frontend todavía no tiene un access token válido en memoria.

Para esos dos endpoints se aplicó el patrón de **doble envío de cookie**: una
segunda cookie, no `HttpOnly`, con un valor CSRF que el frontend lee y reenvía
como cabecera (`X-CSRF-Token`) en cada una de esas dos peticiones. Un sitio
externo puede hacer que el navegador envíe la cookie automáticamente, pero no
puede leer su valor para reproducirlo en la cabecera, así que la petición
falsificada queda sin la cabecera correcta y se rechaza. Es una solución
estándar, proporcional al problema puntual que resuelve, sin necesidad de
introducir un esquema de tokens CSRF para toda la API cuando el resto ya está
protegido por otro mecanismo.

## Acceso a datos: SQL parametrizado a mano, sin ORM

Todas las consultas se escriben como SQL parametrizado directo, usando el
driver `pg`, sin una capa de ORM encima. Es una decisión que se aparta de lo
que muchos equipos eligen por defecto, así que merece justificación explícita.

Un ORM aporta valor cuando el equipo necesita moverse rápido sobre un modelo
de datos simple y las consultas complejas son la excepción. Aquí ocurre lo
contrario: el valor de negocio del producto incluye diez consultas analíticas
con ventanas temporales, agregaciones y particiones que un ORM típicamente no
expresa bien y que terminan escribiéndose en SQL crudo de todas formas —
momento en el que mantener dos formas distintas de tocar la base de datos
(ORM para lo simple, SQL crudo para lo complejo) añade más complejidad
accidental que la que ahorra. Escribir todo en SQL parametrizado desde el
principio da control total sobre los índices que realmente se usan, evita la
capa de traducción objeto-relacional como fuente de bugs sutiles, y mantiene
una única forma de leer y escribir datos en todo el proyecto.

El precio de esta decisión — más código repetitivo, más responsabilidad del
desarrollador para no introducir una inyección SQL — se paga con dos
salvaguardas concretas: cada valor dinámico va como parámetro, nunca
interpolado en el texto de la consulta, y el único punto donde el SQL
necesita construirse dinámicamente (el `ORDER BY` de los listados, porque el
nombre de columna no se puede parametrizar como un valor) se resuelve contra
una whitelist fija de columnas y direcciones permitidas, nunca contra el
valor crudo que envía el cliente.

## Decisiones puntuales del modelo de datos

Algunas decisiones más pequeñas, pero que afectan directamente la
correctitud y el comportamiento observable de la aplicación:

Las claves primarias son **UUID** generados en la base de datos en lugar de
enteros autoincrementales. Esto evita que un identificador filtre información
de negocio (volumen total de registros, orden de creación) y elimina por
completo la posibilidad de que un cliente adivine o enumere identificadores
de otros usuarios probando números consecutivos.

Los usuarios se eliminan con **borrado suave** (`eliminado_en`), porque
perder de forma irreversible una cuenta y su historial es un riesgo
operativo mayor que el costo de mantener una columna de fecha. Las tareas, en
cambio, se eliminan con **borrado físico**: no tienen el mismo valor de
auditoría a largo plazo que una cuenta de usuario, y mantenerlas
indefinidamente solo acumularía datos sin utilidad, complicando además las
consultas analíticas que asumen que "existe" significa "vigente". Al borrar
una categoría, las tareas asociadas no se eliminan: quedan sin categoría
(`ON DELETE SET NULL`), porque una tarea sigue siendo información válida del
usuario aunque su categorización haya cambiado.

La búsqueda de texto usa **búsqueda de texto completo nativa de PostgreSQL**
(`tsvector` con un índice GIN), no `ILIKE`. `ILIKE` no puede usar un índice de
forma eficiente sobre texto libre y no entiende variaciones de una palabra
(singular/plural, conjugaciones); la búsqueda de texto completo sí, y con el
volumen de datos que maneja la aplicación evita tener que introducir más
adelante un motor de búsqueda externo solo para resolver un caso de uso que
PostgreSQL ya resuelve nativamente.

Por último, la tabla `activity_logs` — el historial de qué cambió en cada
tarea y cuándo — se implementa y se llena por completo (creación,
modificación con el detalle de qué campos cambiaron, completado y
descompletado), pero **no se expone como endpoint HTTP**. La especificación
del reto cierra explícitamente la lista de rutas permitidas y no incluye una
para este historial; en lugar de forzar un endpoint no contemplado, el
historial queda disponible para uso interno y auditoría, con cobertura de
tests de integración, listo para exponerse el día que exista un requisito de
producto que lo pida.

## Diseño de la API: superficie cerrada y contrato consistente

La API expone exactamente las rutas que la especificación del reto define,
más dos necesarias para el modelo de sesión (`/api/auth/refresh` y
`/api/auth/logout`), y ninguna más. No existe, por ejemplo, un
`GET /api/tareas/:id` aunque seguramente resultaría cómodo tenerlo: se decidió
respetar el contrato acordado en lugar de ampliarlo por conveniencia técnica,
porque un contrato de API que crece sin control es más difícil de mantener y
de documentar con precisión que uno deliberadamente acotado.

Toda respuesta exitosa sigue el mismo sobre (`{"data": ..., "meta": ...}`) y
todo error el mismo formato (`{"error": {"code", "message", "details"}}`), y
el frontend distingue los casos por el código de error, nunca por el texto
del mensaje — el texto puede cambiar de redacción sin romper nada del lado
del cliente. Las validaciones fallidas responden siempre `422`, con un código
`VALIDATION_ERROR` uniforme, en lugar de mezclar distintos códigos según el
campo que falló.

## Seguridad transversal

Más allá de sesión y autorización, un conjunto de decisiones aplica a toda la
API por igual: las contraseñas se almacenan con **Argon2id**, el algoritmo de
hashing de contraseñas recomendado actualmente por ser resistente tanto a
ataques por GPU como por hardware dedicado. Toda operación que afecta más de
una tabla (crear o actualizar una tarea junto con sus etiquetas y su registro
de actividad, eliminar una tarea con sus relaciones, rotar un token de
refresco) se ejecuta dentro de una **transacción**, para que un fallo a mitad
de camino nunca deje datos a medio escribir. Existe **límite de tasa de
peticiones** (rate limiting), más estricto en los endpoints de autenticación
que en el resto, como primera línea de defensa contra fuerza bruta y
relleno de credenciales; en producción se complementa con AWS WAF en el
perímetro. Las cabeceras de seguridad HTTP (CSP, HSTS, protección contra
sniffing de tipo MIME, política de referrer) se configuran con Helmet, y el
registro de logs (Pino) redacta automáticamente contraseñas, tokens,
cookies y cabeceras de autorización antes de escribir cualquier línea, para
que un log nunca se convierta en una segunda copia de credenciales. Ningún
secreto vive en el repositorio: todo se resuelve por variables de entorno, y
en producción por AWS Secrets Manager.

## Frontend: un único punto de salida hacia la API

Todas las llamadas HTTP del frontend pasan por un cliente centralizado, nunca
directamente por `fetch` desde un componente. Ese cliente es responsable de
adjuntar el token de acceso vigente, de reintentar automáticamente una
petición que falló por token expirado (disparando un único refresco
compartido aunque varias peticiones fallen al mismo tiempo, para no lanzar
refrescos duplicados) y de incluir el token CSRF en los dos endpoints que lo
requieren. Centralizar esto en un solo lugar evita que la lógica de sesión
—con todo lo delicado que tiene— se repita, o se olvide, en distintos
componentes.

Las operaciones que el usuario percibe como instantáneas, como completar una
tarea, aplican **actualización optimista**: la interfaz refleja el cambio de
inmediato y lo revierte automáticamente solo si el servidor rechaza la
operación. Es una decisión de experiencia de usuario con una contraparte
técnica clara: requiere que cada hook sepa cómo deshacer su propio cambio, lo
cual se aceptó porque la sensación de inmediatez en una acción tan frecuente
vale ese costo adicional.

## Funcionalidades añadidas sobre el alcance del reto

Tres funcionalidades — tema claro/oscuro/sistema, un panel de estadísticas
personales y exportación de tareas a CSV/JSON — no forman parte de la
especificación original del reto, que de hecho las lista como fuera de
alcance. Se añadieron a pedido del cliente como valor adicional, bajo una
restricción explícita y no negociable: **resolverse íntegramente en el
frontend, sin abrir ningún endpoint nuevo ni modificar el backend**. La razón
de esa restricción es doble: mantener cerrada la superficie de API que ya se
había definido y validado, y demostrar que el frontend puede construirse como
un consumidor desacoplado de una API estable, sin necesitar cambios en el
servidor cada vez que aparece un nuevo requisito de presentación de datos.

El panel de estadísticas y la exportación necesitan ver el conjunto completo
de tareas del usuario, no una página a la vez. En lugar de crear un endpoint
de agregación en el backend, se resolvió paginando del lado del cliente el
endpoint de listado que ya existía (`GET /api/tareas`), acumulando hasta 1000
tareas (10 páginas de 100) y mostrando un aviso explícito en la interfaz si el
resultado quedó truncado por encima de ese límite. Es una solución con un
techo conocido y comunicado, preferible a proyectar una necesidad de
agregación en el servidor que el alcance actual del proyecto no pedía.

La exportación a CSV incorpora dos detalles que no son opcionales: un BOM
UTF-8 al inicio del archivo, sin el cual Excel en Windows interpreta mal los
acentos y otros caracteres del español, y un escape de celdas que empiezan
con `=`, `+`, `-` o `@`, para que un título de tarea como `=1+1` no se
interprete como una fórmula al abrir el archivo en una hoja de cálculo — una
categoría de vulnerabilidad conocida como inyección de fórmulas CSV.

## Estrategia de pruebas

La suite de pruebas del backend corre contra una **base de datos PostgreSQL
real**, no contra mocks del acceso a datos. Se descartó mockear la capa de
persistencia porque buena parte de lo que hay que verificar — que las
transacciones sean atómicas, que las restricciones de la base (como la
coherencia entre `completada` y `completado_en`) se respeten, que el
ordenamiento dinámico realmente filtre por la whitelist — solo se puede
comprobar con una base de datos de verdad ejecutando SQL de verdad. El costo
es una suite más lenta y una dependencia de infraestructura para poder
ejecutar los tests; el beneficio es que las pruebas verifican comportamiento
real y no solo que el código llame a las funciones esperadas. La cobertura
incluye, de forma explícita, escenarios de dos usuarios distintos accediendo
a los recursos del otro, porque un fallo de ownership es exactamente el tipo
de error que una prueba unitaria aislada no detecta.

## Arquitectura de despliegue

El objetivo de producción es **contenedores en Amazon ECS con Fargate**,
**Amazon RDS para PostgreSQL**, **AWS Secrets Manager** para credenciales y
**AWS WAF** en el perímetro junto con HTTPS obligatorio. Se descartó
Kubernetes por la misma razón que se descartaron los microservicios: es una
plataforma diseñada para coordinar muchos servicios con necesidades de
escalado y despliegue independientes entre sí, y aquí hay un backend y un
frontend. Fargate da contenedores gestionados sin tener que operar clústeres
ni nodos, que es exactamente el nivel de infraestructura que este proyecto
necesita gestionar directamente.

Que el backend sea completamente **stateless respecto al token de acceso**
(la validez de un JWT no depende de que la petición llegue siempre a la misma
instancia) es lo que permite correr varias réplicas detrás de un balanceador
de carga sin necesidad de sesiones pegajosas ni de un almacén de sesión
compartido — una decisión que se pagó desde el diseño del modelo de
autenticación, no que se resolvió después a nivel de infraestructura.

## Fuera de alcance, de forma deliberada

Un conjunto de funcionalidades quedó explícitamente fuera de esta versión
porque la especificación del reto así lo definió: roles y administración,
arrastrar y soltar, atajos de teclado, WebSockets, operaciones masivas sobre
tareas, microservicios, un motor de búsqueda externo tipo Elasticsearch, un
data warehouse, notificaciones, una aplicación móvil nativa y observabilidad
avanzada (tracing distribuido, tableros de monitoreo, alertas, plan de
recuperación ante desastres). Esta última se documenta como recomendación
futura porque la arquitectura ya deja los puntos de extensión necesarios
(separación por capas, logging estructurado) para incorporarla sin tocar el
dominio de negocio el día que el proyecto lo requiera. Ninguna de estas
ausencias es un descuido: cada una fue una decisión consciente de no resolver
un problema que el alcance actual del producto no tiene.

---

Cualquier decisión de esta lista puede reconsiderarse si el contexto de
negocio cambia — por ejemplo, si el número de usuarios o la necesidad de
escalar un dominio de forma independiente crecen lo suficiente como para que
extraer un módulo del monolito, o introducir un rol adicional, deje de ser
una complejidad prematura y pase a ser una necesidad real. El diseño actual
se hizo, de forma deliberada, para que ese cambio sea posible sin una
reescritura completa.

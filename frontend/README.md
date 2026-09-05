# Tarelli — Frontend

React + TypeScript + Vite + Tailwind CSS. Ver el [README de la raíz del
repositorio](../README.md) para instrucciones completas de instalación,
Docker, variables de entorno y arquitectura.

## Scripts

```bash
npm install
npm run dev      # servidor de desarrollo (http://localhost:5173)
npm run build    # type-check (tsc -b) + build de producción a dist/
npm run preview  # sirve el build de producción localmente
npm run lint      # oxlint
```

Variables de entorno (`.env`, ver `.env.example`):

- `VITE_API_BASE_URL` — URL base de la API backend (por defecto `http://localhost:4000/api`).

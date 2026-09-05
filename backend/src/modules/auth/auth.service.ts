import argon2 from 'argon2';
import { withTransaction } from '../../shared/database/pool';
import { AppError } from '../../shared/errors/AppError';
import * as usuariosRepo from '../usuarios/usuarios.repository';
import * as authRepo from './auth.repository';
import {
  generateRefreshToken,
  parseRefreshCookie,
  secretMatchesHash,
  signAccessToken,
} from './token.service';
import type { RegistroInput, LoginInput } from './auth.validation';

export interface SesionResultado {
  usuario: PerfilPublico;
  accessToken: string;
  refreshTokenPlaintext: string;
  refreshExpiraEn: Date;
}

export interface PerfilPublico {
  id: string;
  nombre: string;
  email: string;
  timezone: string;
  ultimoLoginEn: Date | null;
  creadoEn: Date;
}

function toPerfilPublico(usuario: usuariosRepo.UsuarioRow): PerfilPublico {
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    timezone: usuario.timezone,
    ultimoLoginEn: usuario.ultimo_login_en,
    creadoEn: usuario.creado_en,
  };
}

async function emitirSesion(usuario: usuariosRepo.UsuarioRow): Promise<SesionResultado> {
  const accessToken = signAccessToken(usuario.id);
  const refresh = generateRefreshToken();
  await authRepo.insertRefreshToken({
    id: refresh.id,
    usuarioId: usuario.id,
    secretHash: refresh.secretHash,
    expiraEn: refresh.expiraEn,
  });

  return {
    usuario: toPerfilPublico(usuario),
    accessToken,
    refreshTokenPlaintext: refresh.plaintext,
    refreshExpiraEn: refresh.expiraEn,
  };
}

export async function registrar(input: RegistroInput): Promise<SesionResultado> {
  const existente = await usuariosRepo.findByEmail(input.email);
  if (existente) {
    throw AppError.conflict('Ya existe una cuenta registrada con este email.');
  }

  const passwordHash = await argon2.hash(input.password, { type: argon2.argon2id });

  let usuario: usuariosRepo.UsuarioRow;
  try {
    usuario = await usuariosRepo.createUsuario({
      nombre: input.nombre,
      email: input.email,
      passwordHash,
    });
  } catch (err) {
    // Condición de carrera: el índice único de email puede rechazar el insert
    // aunque el pre-chequeo anterior no haya encontrado nada.
    if (isUniqueViolation(err)) {
      throw AppError.conflict('Ya existe una cuenta registrada con este email.');
    }
    throw err;
  }

  return emitirSesion(usuario);
}

export async function iniciarSesion(input: LoginInput): Promise<SesionResultado> {
  const usuario = await usuariosRepo.findByEmail(input.email);
  if (!usuario) {
    throw AppError.invalidCredentials();
  }

  const valido = await argon2.verify(usuario.password_hash, input.password);
  if (!valido) {
    throw AppError.invalidCredentials();
  }

  await usuariosRepo.updateUltimoLogin(usuario.id);
  return emitirSesion(usuario);
}

/**
 * Rota el refresh token. Si el token no existe, expiró, o ya fue revocado
 * (reutilización de un token viejo tras rotación => posible robo), se
 * invalida toda la sesión del usuario y se exige un nuevo login.
 */
export async function refrescarSesion(cookieValue: string | undefined): Promise<SesionResultado> {
  const parsed = parseRefreshCookie(cookieValue);
  if (!parsed) {
    throw AppError.unauthorized('No hay una sesión activa.');
  }

  const tokenRow = await authRepo.findRefreshTokenById(parsed.id);
  if (!tokenRow || !secretMatchesHash(parsed.secret, tokenRow.token_hash)) {
    throw AppError.unauthorized('La sesión no es válida.');
  }

  if (tokenRow.revocado_en !== null) {
    // Reutilización de un refresh token ya rotado: se asume la cadena comprometida.
    await authRepo.revokeAllRefreshTokensForUser(tokenRow.usuario_id);
    throw AppError.unauthorized('Se detectó un uso inválido de la sesión; inicie sesión nuevamente.');
  }

  if (tokenRow.expira_en.getTime() < Date.now()) {
    throw AppError.unauthorized('La sesión ha expirado.');
  }

  const usuario = await usuariosRepo.findById(tokenRow.usuario_id);
  if (!usuario) {
    throw AppError.unauthorized('La sesión no es válida.');
  }

  const nuevoRefresh = generateRefreshToken();
  // Rotación atómica: la revocación del token viejo y la creación del nuevo
  // ocurren en la misma transacción (sección 18 de la especificación).
  await withTransaction(async (client) => {
    await authRepo.insertRefreshToken(
      {
        id: nuevoRefresh.id,
        usuarioId: usuario.id,
        secretHash: nuevoRefresh.secretHash,
        expiraEn: nuevoRefresh.expiraEn,
      },
      client,
    );
    await authRepo.revokeRefreshToken(tokenRow.id, nuevoRefresh.id, client);
  });

  return {
    usuario: toPerfilPublico(usuario),
    accessToken: signAccessToken(usuario.id),
    refreshTokenPlaintext: nuevoRefresh.plaintext,
    refreshExpiraEn: nuevoRefresh.expiraEn,
  };
}

export async function cerrarSesion(cookieValue: string | undefined): Promise<void> {
  const parsed = parseRefreshCookie(cookieValue);
  if (!parsed) return;

  const tokenRow = await authRepo.findRefreshTokenById(parsed.id);
  if (tokenRow && tokenRow.revocado_en === null) {
    await authRepo.revokeRefreshToken(tokenRow.id, null);
  }
}

export async function obtenerPerfil(usuarioId: string): Promise<PerfilPublico> {
  const usuario = await usuariosRepo.findById(usuarioId);
  if (!usuario) {
    throw AppError.unauthorized('El usuario ya no existe.');
  }
  return toPerfilPublico(usuario);
}

function isUniqueViolation(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: string }).code === '23505';
}

/**
 * "Hoy" depende de la zona horaria del usuario (`usuario.timezone`, viene en
 * el perfil), no de la del navegador ni del servidor. 'en-CA' formatea como
 * YYYY-MM-DD, que es justo lo que espera la API en los filtros de fecha.
 */
export function hoyEnZona(timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone }).format(new Date());
}

export function sumarDias(fechaISO: string, dias: number): string {
  const d = new Date(`${fechaISO}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

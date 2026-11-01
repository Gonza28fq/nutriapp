/**
 * Clave para firmar las sesiones (JWT).
 *
 * En producción (o en Railway) es OBLIGATORIA: si falta, el servidor no arranca.
 * Antes se usaba en silencio "fallback_secret", una clave publicada en el
 * repositorio con la que cualquiera podía fabricar sesiones válidas.
 */
const enServidor = process.env.NODE_ENV === "production" || !!process.env.RAILWAY_ENVIRONMENT;
const clave = process.env.JWT_SECRET;

if (!clave || clave.length < 32) {
  if (enServidor) {
    console.error("❌ Falta JWT_SECRET (o tiene menos de 32 caracteres). El servidor no arranca sin una clave segura.");
    process.exit(1);
  }
  console.warn("⚠ JWT_SECRET no configurada: se usa una clave SOLO para desarrollo local.");
}

export const JWT_SECRET: string = clave && clave.length >= 32 ? clave : "clave-solo-para-desarrollo-local-no-usar-en-produccion";

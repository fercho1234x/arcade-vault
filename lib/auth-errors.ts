// Los mensajes crudos de Supabase están en inglés y cambian entre versiones:
// se traduce por AuthError.code a textos fijos.

export const USERNAME_PATTERN = /^[A-Za-z0-9_]{3,10}$/;

export const USERNAME_TAKEN = "ESE USUARIO YA ESTÁ EN USO";
export const USERNAME_INVALID = "USUARIO: 3–10 CARACTERES, A-Z 0-9 _";
export const DEFAULT_AUTH_ERROR = "NO SE PUDO CONECTAR CON EL VAULT";

const MESSAGES: Record<string, string> = {
  invalid_credentials: "CORREO O CONTRASEÑA INCORRECTOS",
  user_already_exists: "ESE CORREO YA TIENE CUENTA",
  email_exists: "ESE CORREO YA TIENE CUENTA",
  weak_password: "CONTRASEÑA DEMASIADO DÉBIL (MÍN. 6)",
  over_request_rate_limit: "DEMASIADOS INTENTOS · ESPERA UNOS MINUTOS",
  validation_failed: "CORREO NO VÁLIDO",
  email_address_invalid: "CORREO NO VÁLIDO",
};

export function authErrorMessage(code?: string): string {
  return (code && MESSAGES[code]) || DEFAULT_AUTH_ERROR;
}

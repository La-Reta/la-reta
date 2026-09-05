/**
 * Mensajes de error de Clerk, en español.
 *
 * Clerk responde en inglés salvo que se localice la instancia, y "Password must
 * be 15 characters or more" en una app en español canta. Se traducen los
 * códigos que la gente se encuentra de verdad y el resto cae al mensaje
 * original, que es más útil que un "algo salió mal".
 */

const MESSAGES: Record<string, string> = {
  form_identifier_not_found: "No encontramos ninguna cuenta con ese correo.",
  form_password_incorrect: "Contraseña incorrecta.",
  form_identifier_exists: "Ya hay una cuenta con ese correo. Inicia sesión.",
  form_param_format_invalid: "Revisa el formato de ese dato.",
  form_param_nil: "Este campo no puede ir vacío.",
  form_password_length_too_short:
    "La contraseña es muy corta para esta cuenta.",
  form_password_pwned:
    "Esa contraseña apareció en una filtración conocida. Usa otra.",
  form_password_not_strong_enough: "Esa contraseña es fácil de adivinar.",
  form_code_incorrect: "El código no coincide. Revísalo.",
  verification_expired: "El código caducó. Pide uno nuevo.",
  verification_failed: "No pudimos verificar el código. Inténtalo otra vez.",
  client_state_invalid: "La sesión caducó. Vuelve a empezar.",
  captcha_invalid:
    "No pudimos comprobar que no eres un bot. Inténtalo de nuevo.",
  session_exists: "Ya hay una sesión abierta.",
  too_many_requests: "Demasiados intentos. Espera un momento.",
};

export interface ClerkFieldError {
  code: string;
  message: string;
  longMessage?: string;
}

/** Traduce un error de campo; si no lo conocemos, deja lo que dijo Clerk. */
export function authErrorMessage(
  error: ClerkFieldError | null | undefined
): string | undefined {
  if (!error) return undefined;

  return MESSAGES[error.code] ?? error.longMessage ?? error.message;
}

/**
 * Primer error que no pertenece a ningún campo (red caída, rate limit, sesión
 * inválida). Se enseña arriba del formulario porque no tiene dónde anclarse.
 */
export function globalErrorMessage(
  errors: readonly { code?: string; message?: string }[] | null | undefined
): string | undefined {
  const first = errors?.[0];
  if (!first) return undefined;

  return (
    (first.code ? MESSAGES[first.code] : undefined) ??
    first.message ??
    "No pudimos completar la operación."
  );
}

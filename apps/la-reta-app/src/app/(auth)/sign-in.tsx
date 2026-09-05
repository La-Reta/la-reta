import { AuthForm } from "@/components/auth-form";
import { AuthUnavailable } from "@/components/auth/auth-unavailable";
import { isClerkConfigured } from "@/components/auth-provider";

/**
 * La comprobación va aquí y no dentro de `AuthForm` porque ese componente llama
 * a los hooks de Clerk en su primera línea: ramificar dentro alteraría el orden
 * de los hooks.
 */
export default function SignInScreen() {
  return isClerkConfigured ? <AuthForm mode="sign-in" /> : <AuthUnavailable />;
}

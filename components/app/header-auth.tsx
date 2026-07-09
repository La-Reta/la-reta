import { ButtonVariant } from "@/shared/types";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { LogInIcon, UserRoundPlusIcon } from "lucide-react";
import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

/** One auth CTA: a Clerk modal trigger styled as a tooltip'd button. */
function AuthAction({
  wrapper: Wrapper,
  icon,
  label,
  variant,
  tooltip,
}: {
  wrapper: typeof SignInButton;
  icon: React.ReactNode;
  label: string;
  variant: ButtonVariant;
  tooltip: string;
}) {
  return (
    <Tooltip>
      <Wrapper mode="modal">
        <TooltipTrigger render={<Button variant={variant}></Button>}>
          {icon}
          <span className="hidden md:inline-flex">{label}</span>
        </TooltipTrigger>
      </Wrapper>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}

/** Header auth controls: sign-in / sign-up CTAs when signed out, avatar when in. */
export function HeaderAuth() {
  return (
    <>
      <Show when="signed-out">
        <AuthAction
          wrapper={SignInButton}
          icon={<LogInIcon />}
          label="Iniciar sesión"
          variant="secondary"
          tooltip="Inicia sesión para acceder a todas las funciones"
        />
        <AuthAction
          wrapper={SignUpButton}
          icon={<UserRoundPlusIcon />}
          label="Crear cuenta"
          variant="default"
          tooltip="Crea una cuenta para acceder a todas las funciones"
        />
      </Show>
      <Show when="signed-in">
        <UserButton />
      </Show>
    </>
  );
}

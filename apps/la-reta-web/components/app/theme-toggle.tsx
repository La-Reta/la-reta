"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";

const OPTIONS = [
  { value: "light", label: "Claro", Icon: SunIcon },
  { value: "dark", label: "Oscuro", Icon: MoonIcon },
  { value: "system", label: "Automático", Icon: MonitorIcon },
] as const;

/**
 * Claro / Oscuro / Automático.
 *
 * Era un interruptor de dos posiciones que hacía `setTheme("light" | "dark")`,
 * así que **no había forma de volver a "automático"**: al primer clic te
 * quedabas fijado para siempre y la web dejaba de seguir al sistema. Quien
 * cambia de claro a oscuro al anochecer en su Mac veía la web quedarse como
 * estaba y parecía que no detectábamos nada.
 *
 * Seguir al sistema en vivo ya lo hace `next-themes`: se suscribe a
 * `matchMedia("(prefers-color-scheme: dark)")` y vuelve a aplicar el tema
 * cuando cambia, siempre que el tema sea `system`. Lo que faltaba era poder
 * estar en `system`.
 *
 * El icono del disparador se resuelve con la variante `dark:` de Tailwind, no
 * con `resolvedTheme`: en el servidor no se conoce el tema y usarlo pintaba el
 * icono equivocado en el primer fotograma.
 */
export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button aria-label="Tema" size="icon-sm" variant="ghost">
            <SunIcon aria-hidden="true" className="dark:hidden" />
            <MoonIcon aria-hidden="true" className="hidden dark:block" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuRadioGroup onValueChange={setTheme} value={theme}>
          {OPTIONS.map(({ value, label, Icon }) => (
            <DropdownMenuRadioItem key={value} value={value}>
              <Icon aria-hidden="true" />
              {label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

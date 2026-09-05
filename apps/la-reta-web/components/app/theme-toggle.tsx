"use client";

import { Button } from "@/components/ui/button";
import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

/**
 * El tema resuelto no se conoce en el servidor, así que en vez de esperar a
 * `mounted` (lo que dejaba el icono equivocado en el primer pintado) se pintan
 * los dos iconos y los alterna la variante `dark:` de Tailwind. Sin parpadeo y
 * sin estado extra.
 */
export const ThemeToggle = () => {
  const { setTheme, resolvedTheme } = useTheme();

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Cambiar entre modo claro y oscuro"
            onClick={() =>
              setTheme(resolvedTheme === "dark" ? "light" : "dark")
            }
          />
        }
      >
        <MoonIcon className="dark:hidden" aria-hidden="true" />
        <SunIcon className="hidden dark:block" aria-hidden="true" />
      </TooltipTrigger>
      <TooltipContent>
        <span className="dark:hidden">Cambiar a modo oscuro</span>
        <span className="hidden dark:inline">Cambiar a modo claro</span>
      </TooltipContent>
    </Tooltip>
  );
};

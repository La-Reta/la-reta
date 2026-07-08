"use client";

import { Button } from "@/components/ui/button";
import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import * as React from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="secondary"
            size="icon"
            aria-label="Cambiar tema"
            onClick={() => setTheme(isDark ? "light" : "dark")}
          ></Button>
        }
      >
        {mounted && isDark ? <SunIcon /> : <MoonIcon />}
      </TooltipTrigger>
      <TooltipContent>
        Cambiar a {mounted && isDark ? "modo claro" : "modo oscuro"}
      </TooltipContent>
    </Tooltip>
  );
}

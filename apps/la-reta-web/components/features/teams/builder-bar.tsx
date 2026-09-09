"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { MAX_TEAMS } from "@/lib/teams";
import { cn } from "@/lib/utils";
import {
  ChartNoAxesColumnIcon,
  EllipsisVerticalIcon,
  RadioIcon,
  ShuffleIcon,
  UsersIcon,
} from "lucide-react";

/**
 * La barra de acción de "Armar equipos", pegada a la pantalla.
 *
 * Antes vivía como una tarjeta más arriba del todo: se elegía a la gente
 * abajo, se subía a generar y se bajaba a ver el resultado. Ese vaivén era la
 * mayor parte de lo tedioso. Ahora acompaña el scroll —abajo en el teléfono,
 * donde cae el pulgar; bajo el encabezado en escritorio— y lleva **solo** las
 * tres cosas que se tocan a cada rato: cuántos van, en cuántos equipos y
 * generar. Lo demás (registros, preferencias) pasa a un menú.
 */
export const BuilderBar = ({
  selectedCount,
  teamCount,
  maxTeams,
  hasResult,
  canGenerate,
  resetOnEdit,
  onResetOnEditChange,
  onTeamCountChange,
  onGenerate,
  onGoLive,
  onRegistro,
}: {
  readonly selectedCount: number;
  readonly teamCount: number;
  /** Tope real: no puede haber más equipos que convocados. */
  readonly maxTeams: number;
  readonly hasResult: boolean;
  readonly canGenerate: boolean;
  readonly resetOnEdit: boolean;
  readonly onResetOnEditChange: (value: boolean) => void;
  readonly onTeamCountChange: (count: number) => void;
  readonly onGenerate: () => void;
  readonly onGoLive: () => void;
  readonly onRegistro: () => void;
}) => {
  const perTeam = Math.floor(selectedCount / Math.max(1, teamCount));

  return (
    <div
      className={cn(
        // En móvil va **fija** abajo, donde cae el pulgar. `sticky bottom-0`
        // no sirve aquí: pega el elemento al borde inferior solo mientras su
        // posición natural sigue por debajo, y esta barra vive arriba del
        // contenido, así que se iba con el scroll. En escritorio sí es
        // pegajosa por arriba, bajo el header fijo (h-12).
        "fixed inset-x-0 bottom-0 z-30 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]",
        "md:sticky md:inset-x-auto md:top-16 md:bottom-auto md:px-0 md:pb-0"
      )}
    >
      <div
        className={cn(
          // El velo deja ver que hay contenido pasando por debajo sin que se
          // mezcle con los controles.
          "bg-background/85 supports-[backdrop-filter]:bg-background/70 backdrop-blur-md",
          "ring-foreground/10 rounded-xl shadow-lg ring-1",
          "flex items-center gap-2 p-2 sm:gap-3 sm:p-3"
        )}
      >
        <div className="flex min-w-0 shrink items-center gap-2">
          <span className="bg-primary/10 text-primary grid size-9 shrink-0 place-items-center rounded-lg">
            <UsersIcon className="size-4.5" />
          </span>
          <div className="min-w-0 leading-none">
            <p className="font-mono text-xl font-bold tabular-nums">
              {selectedCount}
            </p>
            {/* El reparto previsto es lo que de verdad quiere saber quien
                convoca: "¿me alcanza para tres equipos?". */}
            <p className="text-muted-foreground truncate text-xs">
              {selectedCount < 2 ? "convocados" : `≈ ${perTeam} por equipo`}
            </p>
          </div>
        </div>

        <TeamCountPicker
          max={maxTeams}
          onChange={onTeamCountChange}
          value={teamCount}
        />

        <div className="ml-auto flex items-center gap-2">
          {hasResult ? (
            <Button
              aria-label="Ir al marcador en vivo"
              onClick={onGoLive}
              size="icon"
              variant="destructive"
            >
              <RadioIcon />
            </Button>
          ) : null}
          <Button
            className="min-w-0"
            disabled={!canGenerate}
            onClick={onGenerate}
          >
            <ShuffleIcon />
            <span className="truncate">
              {hasResult ? "Regenerar" : "Generar"}
            </span>
          </Button>
          <MoreMenu
            onRegistro={onRegistro}
            onResetOnEditChange={onResetOnEditChange}
            resetOnEdit={resetOnEdit}
          />
        </div>
      </div>
    </div>
  );
};

/**
 * Cuántos equipos generar. Los números que no alcanzan con los convocados
 * actuales se quedan deshabilitados en vez de desaparecer: que la opción baile
 * al convocar a alguien más despista más que verla apagada.
 */
const TeamCountPicker = ({
  value,
  max,
  onChange,
}: {
  readonly value: number;
  readonly max: number;
  readonly onChange: (count: number) => void;
}) => {
  const options = Array.from({ length: MAX_TEAMS - 1 }, (_, i) => i + 2);

  return (
    <fieldset
      aria-label="Número de equipos"
      className="bg-muted flex shrink-0 items-center gap-0.5 overflow-x-auto rounded-xl border-0 p-0.5"
    >
      {options.map((n) => {
        const disabled = n > max;
        return (
          <button
            aria-pressed={value === n}
            className={cn(
              "rounded-[10px] px-2.5 py-1.5 font-mono text-xs font-bold tabular-nums",
              "transition-[background-color,color,scale] motion-safe:active:scale-95",
              value === n && "bg-background text-foreground shadow-sm",
              value !== n &&
                !disabled &&
                "text-muted-foreground hover:text-foreground",
              disabled && "text-muted-foreground/35 cursor-not-allowed"
            )}
            disabled={disabled}
            key={n}
            onClick={() => onChange(n)}
            title={disabled ? `Necesitas ${n} convocados` : `${n} equipos`}
            type="button"
          >
            {n}
          </button>
        );
      })}
    </fieldset>
  );
};

const MoreMenu = ({
  resetOnEdit,
  onResetOnEditChange,
  onRegistro,
}: {
  readonly resetOnEdit: boolean;
  readonly onResetOnEditChange: (value: boolean) => void;
  readonly onRegistro: () => void;
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button aria-label="Más opciones" size="icon" variant="ghost" />
        }
      >
        <EllipsisVerticalIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuItem onClick={onRegistro}>
          <ChartNoAxesColumnIcon />
          Registro de retas
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {/* El <DropdownMenuGroup> no es decorativo: `DropdownMenuLabel` es
            `Menu.GroupLabel` de Base UI y revienta con "MenuGroupContext is
            missing" si no cuelga de un `Menu.Group`. El de Radix que trae la
            documentación de shadcn no lo pide, así que copiar de ahí tira la
            vista entera al abrir el menú. */}
        <DropdownMenuGroup>
          <DropdownMenuLabel>Preferencias</DropdownMenuLabel>
          {/* `closeOnClick={false}`: el interruptor se alterna dentro del menú y
            cerrarlo al primer toque impedía ver qué quedó puesto. */}
          <DropdownMenuItem
            closeOnClick={false}
            onClick={() => onResetOnEditChange(!resetOnEdit)}
          >
            <div className="flex w-full items-start justify-between gap-3">
              <div className="min-w-0">
                {/* Un <span>, no un <Label>: el control es el propio ítem del
                  menú y una etiqueta sin `htmlFor` no apunta a nada. */}
                <span className="text-sm font-medium">Reiniciar al editar</span>
                <p className="text-muted-foreground mt-1 text-xs leading-snug">
                  Encendido, cambiar la convocatoria vuelve a repartir todo.
                  Apagado, el tablero se conserva y quien entra queda por
                  asignar.
                </p>
              </div>
              <Switch
                checked={resetOnEdit}
                className="pointer-events-none shrink-0"
                tabIndex={-1}
              />
            </div>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

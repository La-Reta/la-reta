import type { TeamKey } from "@repo/reta/teams";
import { useCallback, useEffect, useState } from "react";

import {
  cleanTeamName,
  loadTeamNames,
  saveTeamNames,
  teamNameOf,
  type TeamNames,
} from "@/lib/team-names";

export interface TeamNamesState {
  nameOf: (key: TeamKey) => string;
  rename: (key: TeamKey, value: string) => void;
}

/**
 * Los nombres de equipo, leídos una vez y guardados solo al confirmar.
 *
 * El disco se toca al abrir la pantalla y al pulsar "Guardar", no en cada
 * tecla: escribir en cada pulsación son veinte escrituras para renombrar un
 * equipo, y `AsyncStorage` serializa todo el almacén en cada una.
 */
export function useTeamNames(): TeamNamesState {
  const [names, setNames] = useState<TeamNames>({});

  useEffect(() => {
    let alive = true;
    loadTeamNames().then((stored) => {
      if (alive) setNames(stored);
    });
    return () => {
      alive = false;
    };
  }, []);

  const nameOf = useCallback((key: TeamKey) => teamNameOf(names, key), [names]);

  const rename = useCallback((key: TeamKey, value: string) => {
    setNames((previous) => {
      const name = cleanTeamName(key, value);
      const next = { ...previous };

      if (name === undefined) {
        delete next[key];
      } else {
        next[key] = name;
      }

      saveTeamNames(next);
      return next;
    });
  }, []);

  return { nameOf, rename };
}

"use client";

import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
} from "@/components/ui/combobox";
import {
  GROUP_COLOR,
  GROUP_LABEL,
  POSITION_NAME,
  POSITIONS,
  positionGroup,
  type Position,
  type PositionGroup,
} from "@/lib/constants";
import * as React from "react";

/**
 * El selector de posición, compartido por el registro y el alta.
 *
 * Sustituye a un `<select>` nativo con quince opciones en una lista plana: en
 * el teléfono eso es una rueda que hay que recorrer a ciegas, y en escritorio un
 * desplegable donde "MC" y "MCD" se confunden. Aquí se busca escribiendo, las
 * opciones van **agrupadas por línea** y cada una lleva el color de su línea —
 * el mismo `GROUP_COLOR` que la cancha y la leyenda, para que quien ya conoce la
 * pizarra reconozca el sitio antes de leer el nombre.
 *
 * Es un envoltorio de dominio sobre `Combobox` (shadcn + Base UI), igual que
 * `CountrySelect`. Esa es la pieza reutilizable; meter una capa genérica entre
 * las dos solo añadiría un sitio más donde mirar.
 */

/** Base UI espera los grupos como `{ value, items }`. */
type PositionOption = { group: PositionGroup; position: Position };
type OptionGroup = { value: PositionGroup; items: PositionOption[] };

/**
 * Nadie teclea "contención" con tilde en el teléfono, y sin esto la búsqueda
 * parece rota. Se compara sin acentos y sin mayúsculas.
 */
function searchKey(text: string) {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function labelOf(option: PositionOption) {
  return `${option.position} · ${POSITION_NAME[option.position]}`;
}

/**
 * Busca por código **y** por nombre: quien sabe qué es un "CDM" lo teclea, y
 * quien no, escribe "contencion" y lo encuentra igual.
 */
function matches(option: PositionOption, query: string) {
  const q = searchKey(query.trim());
  if (!q) return true;
  return (
    searchKey(option.position).includes(q) ||
    searchKey(POSITION_NAME[option.position]).includes(q) ||
    searchKey(GROUP_LABEL[option.group]).includes(q)
  );
}

function buildGroups(exclude?: string): OptionGroup[] {
  const byGroup = new Map<PositionGroup, PositionOption[]>();
  for (const position of POSITIONS) {
    if (position === exclude) continue;
    const group = positionGroup(position);
    const bucket = byGroup.get(group);
    if (bucket) bucket.push({ group, position });
    else byGroup.set(group, [{ group, position }]);
  }
  const groups: OptionGroup[] = [];
  // Recorre `GROUP_LABEL` y no el Map: el orden de las líneas es portero →
  // delantero, no el orden en que aparecieron en la tabla de posiciones.
  for (const key of Object.keys(GROUP_LABEL) as PositionGroup[]) {
    const items = byGroup.get(key);
    if (items) groups.push({ value: key, items });
  }
  return groups;
}

export const PositionSelect = ({
  value,
  onChange,
  exclude,
  placeholder = "Busca tu posición…",
  id,
}: {
  readonly value: string;
  readonly onChange: (position: string) => void;
  /** La principal no puede repetirse como secundaria. */
  readonly exclude?: string;
  readonly placeholder?: string;
  readonly id?: string;
}) => {
  // El combobox indexa su colección por el array de `items`: rehacerlo en cada
  // pulsación tiraría la lista mientras se escribe. React Compiler no está
  // activado en este proyecto, así que quitarlo sí lo recrearía.
  // eslint-disable-next-line react-doctor/react-compiler-no-manual-memoization
  const groups = React.useMemo(() => buildGroups(exclude), [exclude]);

  // Sin memo a propósito: son dos campos, y la identidad del objeto da igual
  // porque la comparación la hace `isItemEqualToValue`.
  const selected = value
    ? { group: positionGroup(value as Position), position: value as Position }
    : null;

  return (
    <Combobox
      items={groups}
      value={selected}
      onValueChange={(next: PositionOption | null) =>
        onChange(next?.position ?? "")
      }
      itemToStringLabel={labelOf}
      isItemEqualToValue={(a: PositionOption, b: PositionOption) =>
        a.position === b.position
      }
      filter={(item: PositionOption, query: string) => matches(item, query)}
    >
      <ComboboxInput className="w-full" id={id} placeholder={placeholder} />
      <ComboboxContent>
        <ComboboxEmpty>Ninguna posición coincide</ComboboxEmpty>
        <ComboboxList>
          <ComboboxCollection>
            {(group: OptionGroup) => (
              <ComboboxGroup items={group.items} key={group.value}>
                <ComboboxLabel>{GROUP_LABEL[group.value]}</ComboboxLabel>
                <ComboboxCollection>
                  {(option: PositionOption) => (
                    <ComboboxItem key={option.position} value={option}>
                      <span
                        aria-hidden="true"
                        className="size-2 shrink-0 rounded-full"
                        style={{ backgroundColor: GROUP_COLOR[option.group] }}
                      />
                      <span className="w-9 shrink-0 font-semibold tabular-nums">
                        {option.position}
                      </span>
                      <span className="truncate">
                        {POSITION_NAME[option.position]}
                      </span>
                    </ComboboxItem>
                  )}
                </ComboboxCollection>
              </ComboboxGroup>
            )}
          </ComboboxCollection>
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
};

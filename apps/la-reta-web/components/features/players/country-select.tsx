"use client";

import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { COUNTRY_CODES } from "@/lib/countries";
import { flagEmoji } from "@/lib/format";
import * as React from "react";

/**
 * Searchable country picker. Stores the lowercase ISO 3166-1 alpha-2 code but
 * shows the flag + localized name, so people pick their country instead of
 * guessing a two-letter code.
 */
export const CountrySelect = ({
  value,
  onChange,
  placeholder = "Busca tu país…",
}: {
  readonly value: string;
  readonly onChange: (code: string) => void;
  readonly placeholder?: string;
}) => {
  // Los tres memos se quedan: React Compiler no está activado en este proyecto,
  // así que sin ellos `Intl.DisplayNames` se reconstruye y la lista entera se
  // reordena en cada pulsación del buscador.
  // eslint-disable-next-line react-doctor/react-compiler-no-manual-memoization -- sin compilador, el memo sí trabaja
  const displayNames = React.useMemo(
    () => new Intl.DisplayNames(["es"], { type: "region" }),
    []
  );
  // eslint-disable-next-line react-doctor/react-compiler-no-manual-memoization -- ídem
  const nameOf = React.useCallback(
    (code: string) => {
      try {
        return displayNames.of(code.toUpperCase()) ?? code.toUpperCase();
      } catch {
        return code.toUpperCase();
      }
    },
    [displayNames]
  );
  // eslint-disable-next-line react-doctor/react-compiler-no-manual-memoization -- ídem
  const items = React.useMemo(
    () =>
      COUNTRY_CODES.toSorted((a, b) =>
        nameOf(a).localeCompare(nameOf(b), "es")
      ),
    [nameOf]
  );

  return (
    <Combobox
      items={items}
      value={value || null}
      onValueChange={(next) => onChange(next ?? "")}
      itemToStringLabel={nameOf}
    >
      <ComboboxInput placeholder={placeholder} className="w-full" />
      <ComboboxContent>
        <ComboboxEmpty>Sin resultados</ComboboxEmpty>
        <ComboboxList>
          <ComboboxCollection>
            {(code: string) => (
              <ComboboxItem key={code} value={code}>
                <span className="text-base leading-none">
                  {flagEmoji(code)}
                </span>
                <span className="truncate">{nameOf(code)}</span>
              </ComboboxItem>
            )}
          </ComboboxCollection>
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
};

"use client";

import { useAtom } from "jotai";
import { CheckIcon, PlusIcon } from "lucide-react";
import { selectedIdsAtom } from "@/lib/state/atoms";
import { Button } from "@/components/ui/button";

export function SelectForTeamsButton({
  id,
  size = "sm",
}: {
  id: number;
  size?: "sm" | "default";
}) {
  const [selected, setSelected] = useAtom(selectedIdsAtom);
  const isSelected = selected.includes(id);

  return (
    <Button
      type="button"
      size={size}
      variant={isSelected ? "secondary" : "outline"}
      onClick={() =>
        setSelected(
          isSelected ? selected.filter((x) => x !== id) : [...selected, id],
        )
      }
    >
      {isSelected ? <CheckIcon /> : <PlusIcon />}
      {isSelected ? "En el pool" : "Añadir a equipos"}
    </Button>
  );
}

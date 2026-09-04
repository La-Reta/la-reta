"use client";

import { Button } from "@/components/ui/button";
import { selectedIdsAtom } from "@/lib/state/atoms";
import { useAtom } from "jotai";
import { CheckIcon, PlusIcon } from "lucide-react";

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
      {isSelected ? "En la reta" : "Añadir a la reta"}
    </Button>
  );
}

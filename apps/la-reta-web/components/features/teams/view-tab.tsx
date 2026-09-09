"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type * as React from "react";

export const ViewTab = ({
  active,
  onClick,
  icon,
  label,
}: {
  readonly active: boolean;
  readonly onClick: () => void;
  readonly icon: React.ReactNode;
  readonly label: string;
}) => {
  return (
    <Button
      type="button"
      variant={active ? "default" : "ghost"}
      onClick={onClick}
      aria-pressed={active}
      className={cn(!active && "text-muted-foreground")}
    >
      {icon}
      {label}
    </Button>
  );
};

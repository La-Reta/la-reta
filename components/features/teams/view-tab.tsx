"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type * as React from "react";

export function ViewTab({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
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
}

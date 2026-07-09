import { UsersIcon } from "lucide-react";

export function SelectedCountItem({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-1">
      <span className="bg-primary/10 text-primary grid size-9 shrink-0 place-items-center rounded-md">
        <UsersIcon className="size-4.5" />
      </span>
      <div className="leading-none">
        <p className="font-mono text-xl font-bold tabular-nums">
          {count}
        </p>
        <p className="text-muted-foreground text-xs">convocados</p>
      </div>
    </div>
  )
}

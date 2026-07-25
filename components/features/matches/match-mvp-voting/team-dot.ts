export function teamDot(team: string | null) {
  return team === "A"
    ? "bg-sky-500"
    : team === "B"
      ? "bg-rose-500"
      : "bg-muted-foreground";
}

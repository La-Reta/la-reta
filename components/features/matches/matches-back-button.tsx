import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

export function MatchesBackButton() {
  return (
    <Button variant="secondary" render={<Link href="/matches" />}>
      <ArrowLeftIcon />
      Partidos
    </Button>
  );
}

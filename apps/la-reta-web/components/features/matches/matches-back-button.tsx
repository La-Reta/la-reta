import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

export const MatchesBackButton = () => {
  return (
    <Button
      variant="secondary"
      render={<Link href="/matches" transitionTypes={["nav-back"]} />}
    >
      <ArrowLeftIcon />
      Partidos
    </Button>
  );
};

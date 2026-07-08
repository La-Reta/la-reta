import { RadioIcon, TrophyIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

export function ScorerNotFound() {
  return (
    <Card className="h-fit">
      <CardHeader className="border-b">
        <CardTitle className="font-display text-lg font-semibold tracking-wide uppercase">
          El goleador
        </CardTitle>
        <p className="text-muted-foreground text-[11px]">
          Máximo anotador de la reta
        </p>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-3 text-center">
        <TrophyIcon className="text-muted-foreground size-8" />
        <p className="text-muted-foreground text-sm">
          Aún no hay goles registrados. Anota goles en un partido para coronar
          al goleador.
        </p>
        <Button variant="default" render={<Link href="/live" />}>
          <RadioIcon />
          Marcador en vivo
        </Button>
      </CardContent>
    </Card>
  );
}

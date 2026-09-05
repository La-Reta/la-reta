import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
import { ArrowLeftIcon, HomeIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export const ErrorState = ({
  code,
  icon,
  title,
  description,
  details,
  actions,
}: {
  readonly code: string;
  readonly icon: ReactNode;
  readonly title: string;
  readonly description: string;
  readonly details?: ReactNode;
  readonly actions?: ReactNode;
}) => {
  return (
    <div className="mx-auto flex min-h-[calc(100svh-7rem)] w-full max-w-3xl items-center justify-center px-4 py-10">
      <Card className="w-full border-dashed">
        <CardContent className="p-0">
          <Empty className="border-0 px-5 py-10 sm:px-10 sm:py-14">
            <EmptyHeader>
              <Badge variant="outline" className="font-mono">
                {code}
              </Badge>
              <EmptyMedia
                variant="icon"
                className="bg-primary/10 text-primary size-12 rounded-xl"
              >
                {icon}
              </EmptyMedia>
              <EmptyTitle className="text-2xl font-black">{title}</EmptyTitle>
              <EmptyDescription className="max-w-md">
                {description}
              </EmptyDescription>
            </EmptyHeader>

            {details ? (
              <>
                <Separator className="max-w-sm" />
                <div className="text-muted-foreground max-w-md text-center text-xs">
                  {details}
                </div>
              </>
            ) : null}

            <EmptyContent>
              {/* La acción de recuperación (p. ej. "Reintentar") va primero y
                  es la única enfatizada: si existe, navegar a otra vista es la
                  salida secundaria, no la principal. */}
              <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
                {actions}
                <Button
                  variant={actions ? "outline" : "default"}
                  render={<Link href="/matches" />}
                >
                  <ArrowLeftIcon />
                  Partidos
                </Button>
                <Button
                  variant={actions ? "ghost" : "secondary"}
                  render={<Link href="/" />}
                >
                  <HomeIcon />
                  Inicio
                </Button>
              </div>
            </EmptyContent>
          </Empty>
        </CardContent>
      </Card>
    </div>
  );
};

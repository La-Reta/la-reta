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

export function ErrorState({
  code,
  icon,
  title,
  description,
  details,
  actions,
}: {
  code: string;
  icon: ReactNode;
  title: string;
  description: string;
  details?: ReactNode;
  actions?: ReactNode;
}) {
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
              <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-center">
                <Button variant="default" render={<Link href="/matches" />}>
                  <ArrowLeftIcon />
                  Partidos
                </Button>
                <Button variant="secondary" render={<Link href="/" />}>
                  <HomeIcon />
                  Inicio
                </Button>
                {actions}
              </div>
            </EmptyContent>
          </Empty>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { legalPages } from "./legal-content";

export function LegalNav() {
  const pathname = usePathname();

  return (
    <Card className="lg:sticky lg:top-16">
      <CardHeader>
        <CardTitle className="text-sm">Documentos</CardTitle>
        <CardDescription>
          Lectura simple para usuarios y admins.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {legalPages.map((page) => {
          const active = pathname === page.href;

          return (
            <Button
              key={page.href}
              variant="ghost"
              aria-current={active ? "page" : undefined}
              data-active={active}
              className={cn(
                "group/legal-nav h-auto w-full justify-start gap-3 px-2 py-2 text-left",
                "data-[active=true]:bg-primary/10 data-[active=true]:text-foreground data-[active=true]:shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--primary)_24%,transparent)]",
              )}
              render={<Link href={page.href} />}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "bg-primary size-1.5 shrink-0 rounded-full opacity-0 transition-opacity",
                  active && "opacity-100",
                )}
              />
              <page.icon
                className={cn(
                  "text-muted-foreground size-4 shrink-0",
                  active && "text-primary",
                )}
              />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">
                  {page.title}
                </span>
                <span
                  className={cn(
                    "text-muted-foreground line-clamp-2 text-xs font-normal text-wrap break-words",
                    active && "text-foreground/70",
                  )}
                >
                  {page.description}
                </span>
              </span>
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
}

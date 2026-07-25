import { IdeaRowActions } from "@/components/features/ideas/idea-row-actions";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  IDEA_CATEGORY_LABEL,
  IDEA_PRIORITY_CLASS,
  IDEA_PRIORITY_LABEL,
  IDEA_STATUS_CLASS,
  IDEA_STATUS_LABEL,
} from "@/lib/constants";
import { formatShortDate } from "@/lib/dates";
import type { getIdeas } from "@/lib/queries";
import { cn } from "@/lib/utils";

export type IdeaListItem = Awaited<ReturnType<typeof getIdeas>>[number];

/** Responsive list of ideas: stacked cards on mobile, a table on desktop. */
export function IdeasView({
  ideas,
  admin,
}: {
  ideas: IdeaListItem[];
  admin: boolean;
}) {
  return (
    <>
      <div className="grid gap-3 lg:hidden">
        {ideas.map((idea) => (
          <IdeaCard key={idea.id} idea={idea} admin={admin} />
        ))}
      </div>

      <div className="bg-card ring-foreground/10 hidden overflow-x-auto rounded-xl ring-1 lg:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-64">Idea</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Prioridad</TableHead>
              <TableHead>Tiempo</TableHead>
              <TableHead>Autor</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead className="text-right">Fecha</TableHead>
              {admin ? <TableHead className="w-10" /> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {ideas.map((idea) => (
              <TableRow key={idea.id}>
                <TableCell>
                  <p className="font-medium">{idea.title}</p>
                  <p className="text-muted-foreground line-clamp-2 max-w-md text-xs">
                    {idea.description}
                  </p>
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {IDEA_CATEGORY_LABEL[idea.category]}
                </TableCell>
                <TableCell>
                  <Pill className={IDEA_STATUS_CLASS[idea.status]}>
                    {IDEA_STATUS_LABEL[idea.status]}
                  </Pill>
                </TableCell>
                <TableCell>
                  {idea.priority ? (
                    <Pill className={IDEA_PRIORITY_CLASS[idea.priority]}>
                      {IDEA_PRIORITY_LABEL[idea.priority]}
                    </Pill>
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {idea.estimate ?? "—"}
                </TableCell>
                <TableCell className="text-xs">
                  {idea.author ?? "Anónimo"}
                </TableCell>
                <TableCell>
                  <ClientPills
                    language={idea.language}
                    timezone={idea.timezone}
                    screen={idea.screen}
                  />
                </TableCell>
                <TableCell className="text-muted-foreground text-right text-xs">
                  {formatShortDate(idea.createdAt)}
                </TableCell>
                {admin ? (
                  <TableCell className="text-right">
                    <IdeaRowActions id={idea.id} status={idea.status} />
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

function IdeaCard({ idea, admin }: { idea: IdeaListItem; admin: boolean }) {
  return (
    <Card size="sm">
      <CardHeader className="border-b">
        <CardTitle className="min-w-0">
          <span className="line-clamp-2">{idea.title}</span>
        </CardTitle>
        {admin ? (
          <CardAction>
            <IdeaRowActions id={idea.id} status={idea.status} />
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground line-clamp-4 text-sm leading-relaxed">
          {idea.description}
        </p>

        <div className="flex flex-wrap gap-1.5">
          <Pill className="bg-muted text-muted-foreground">
            {IDEA_CATEGORY_LABEL[idea.category]}
          </Pill>
          <Pill className={IDEA_STATUS_CLASS[idea.status]}>
            {IDEA_STATUS_LABEL[idea.status]}
          </Pill>
          {idea.priority ? (
            <Pill className={IDEA_PRIORITY_CLASS[idea.priority]}>
              {IDEA_PRIORITY_LABEL[idea.priority]}
            </Pill>
          ) : null}
        </div>

        <dl className="grid gap-3 text-xs sm:grid-cols-2">
          <InfoItem label="Tiempo" value={idea.estimate ?? "Sin estimar"} />
          <InfoItem label="Autor" value={idea.author ?? "Anónimo"} />
          <InfoItem label="Fecha" value={formatShortDate(idea.createdAt)} />
          <div className="min-w-0">
            <dt className="text-muted-foreground mb-1">Cliente</dt>
            <dd>
              <ClientPills
                language={idea.language}
                timezone={idea.timezone}
                screen={idea.screen}
              />
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="truncate font-medium">{value}</dd>
    </div>
  );
}

function ClientPills({
  language,
  timezone,
  screen,
}: {
  language: string | null;
  timezone: string | null;
  screen: string | null;
}) {
  const items = [language, timezone, screen].filter(Boolean);

  if (items.length === 0) {
    return <span className="text-muted-foreground text-xs">—</span>;
  }

  return (
    <div className="flex max-w-full flex-wrap gap-1 lg:max-w-48">
      {items.map((item) => (
        <Pill key={item} className="bg-muted text-muted-foreground">
          {item}
        </Pill>
      ))}
    </div>
  );
}

function Pill({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full rounded-sm px-1.5 py-0.5 text-[11px] font-medium break-all",
        className,
      )}
    >
      {children}
    </span>
  );
}

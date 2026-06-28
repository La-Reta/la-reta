import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, PencilIcon } from "lucide-react";
import {
  getPlayerById,
  getPlayerHistory,
  getPlayerComments,
  getPlayerGoalHistory,
} from "@/lib/queries";
import { isAdmin } from "@/lib/admin";
import { FifaCard } from "@/components/shared/fifa-card";
import { PlayerRadar } from "@/components/features/players/player-radar";
import { PlayerHistory } from "@/components/features/players/player-history";
import { PlayerComments } from "@/components/features/players/player-comments";
import { PlayerGoalHistory } from "@/components/features/players/player-goal-history";
import { Pitch } from "@/components/shared/pitch";
import { DeletePlayerButton } from "@/components/features/players/delete-player-button";
import { SelectForTeamsButton } from "@/components/features/players/select-for-teams-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  STAT_KEYS,
  STAT_LABEL,
  GROUP_LABEL,
  positionGroup,
  POSITION_NAME,
  GROUP_COLOR,
} from "@/lib/constants";
import { cardTier, TIER_LABEL } from "@/lib/ratings";
import { flagEmoji, playerPositions } from "@/lib/format";

const FOOT_LABEL: Record<string, string> = {
  left: "Izquierdo",
  right: "Derecho",
};

function statColor(v: number) {
  if (v >= 80) return "bg-emerald-500";
  if (v >= 65) return "bg-amber-500";
  return "bg-rose-500";
}

export const dynamic = "force-dynamic";

export default async function PlayerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numId = Number(id);
  const [player, history, comments, goalHistory, admin] = await Promise.all([
    getPlayerById(numId),
    getPlayerHistory(numId),
    getPlayerComments(numId),
    getPlayerGoalHistory(numId),
    isAdmin(),
  ]);
  if (!player) notFound();

  const group = positionGroup(player.position);
  const tier = cardTier(player.overall);

  const facts: { label: string; value: string }[] = [
    { label: "Edad", value: `${player.age} años` },
    { label: "Altura", value: `${player.heightCm} cm` },
    { label: "Peso", value: `${player.weightKg} kg` },
    { label: "Pie", value: FOOT_LABEL[player.preferredFoot] },
    {
      label: "País",
      value: `${flagEmoji(player.nationality)} ${player.nationality.toUpperCase()}`,
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Button variant="ghost" size="sm" render={<Link href="/players" />}>
        <ArrowLeftIcon />
        Jugadores
      </Button>

      <div className="grid gap-8 md:grid-cols-[260px_1fr] md:items-start">
        <div className="mx-auto w-full max-w-[260px] md:sticky md:top-16">
          <FifaCard player={player} />
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{player.position}</Badge>
              {player.position2 ? (
                <Badge variant="outline">{player.position2}</Badge>
              ) : null}
              <Badge variant="secondary">{GROUP_LABEL[group]}</Badge>
              <Badge variant="outline">{TIER_LABEL[tier]}</Badge>
            </div>
            <h1 className="mt-2 text-3xl font-black tracking-tight">
              {player.name}
            </h1>
            <p className="text-muted-foreground text-sm">
              Overall{" "}
              <span className="text-foreground font-bold">
                {player.overall}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {admin ? (
              <Button
                size="sm"
                render={<Link href={`/players/${player.id}/edit`} />}
              >
                <PencilIcon />
                Editar
              </Button>
            ) : null}
            <SelectForTeamsButton id={player.id} />
            {admin && <DeletePlayerButton id={player.id} name={player.name} />}
          </div>

          {/* Datos */}
          <div className="bg-foreground/10 ring-foreground/10 grid grid-cols-2 gap-px overflow-hidden rounded-lg ring-1 sm:grid-cols-3">
            {facts.map((f) => (
              <div key={f.label} className="bg-card p-3">
                <p className="text-muted-foreground text-[10px] uppercase">
                  {f.label}
                </p>
                <p className="mt-0.5 text-sm font-semibold">{f.value}</p>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="grid gap-6 sm:grid-cols-2">
            <Card>
              <CardHeader className="border-b">
                <CardTitle>Atributos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {STAT_KEYS.map((key) => (
                  <div key={key} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span>{STAT_LABEL[key]}</span>
                      <span className="font-mono font-bold tabular-nums">
                        {player[key]}
                      </span>
                    </div>
                    <div className="bg-muted h-1.5 overflow-hidden">
                      <div
                        className={`h-full ${statColor(player[key])}`}
                        style={{ width: `${player[key]}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="border-b">
                <CardTitle>Radar</CardTitle>
              </CardHeader>
              <CardContent>
                <PlayerRadar player={player} />
              </CardContent>
            </Card>
          </div>

          {/* Posición en cancha + historial */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader className="border-b">
                <CardTitle>Posición en la cancha</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <Pitch highlight={playerPositions(player)} />
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <div
                      className="mt-1 size-2 shrink-0 rounded-full"
                      style={{
                        backgroundColor: GROUP_COLOR[group],
                      }}
                    />
                    <div>
                      <p className="font-medium">
                        {POSITION_NAME[player.position]}
                      </p>
                      <p className="text-muted-foreground">
                        Posición principal ({player.position})
                      </p>
                    </div>
                  </div>
                  {player.position2 ? (
                    <div className="flex items-start gap-3">
                      <div
                        className="mt-1 size-2 shrink-0 rounded-full"
                        style={{
                          backgroundColor:
                            GROUP_COLOR[positionGroup(player.position2)],
                        }}
                      />
                      <div>
                        <p className="font-medium">
                          {POSITION_NAME[player.position2]}
                        </p>
                        <p className="text-muted-foreground">
                          Posición secundaria ({player.position2})
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="border-b">
                <CardTitle>Historial de stats</CardTitle>
              </CardHeader>
              <CardContent>
                <PlayerHistory history={history} />
              </CardContent>
            </Card>
          </div>

          <PlayerGoalHistory history={goalHistory} />

          {/* Comentarios */}
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Reseñas · {comments.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <PlayerComments playerId={player.id} comments={comments} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

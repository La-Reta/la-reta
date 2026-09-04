"use client";

import { setMatchPhoto } from "@/app/actions/matches";
import { uploadImage } from "@/app/actions/uploads";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TEAM_COLORS_LIGHT, type MatchTeamRow } from "@/lib/teams";
import { ImagePlusIcon, Trash2Icon, TrophyIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

/**
 * Teams · marcador · Team names, shared by the photo and no-photo layouts.
 * Con 2 equipos es el duelo de siempre; con 3+ (una reta con rotación) se
 * convierte en una fila de marcadores, uno por equipo.
 */
function Scoreboard({
  teams,
  onPhoto,
}: {
  teams: MatchTeamRow[];
  onPhoto: boolean;
}) {
  if (teams.length === 2) {
    return (
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-6">
        <p className="truncate text-right text-sm font-bold sm:text-xl">
          {teams[0].name}
        </p>
        <div className="flex items-center gap-2 font-mono text-3xl leading-none font-black tabular-nums sm:gap-3 sm:text-5xl">
          <span>{teams[0].score}</span>
          <span className={onPhoto ? "text-white/60" : "text-muted-foreground"}>
            –
          </span>
          <span>{teams[1].score}</span>
        </div>
        <p className="truncate text-left text-sm font-bold sm:text-xl">
          {teams[1].name}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-end justify-center gap-x-6 gap-y-3 sm:gap-x-10">
      {teams.map((team) => (
        <div key={team.key} className="min-w-20 text-center">
          <p
            className="truncate text-xs font-bold tracking-wide uppercase sm:text-sm"
            style={{ color: TEAM_COLORS_LIGHT[team.key] }}
          >
            {team.name}
          </p>
          <p className="font-mono text-3xl leading-none font-black tabular-nums sm:text-5xl">
            {team.score}
          </p>
        </div>
      ))}
    </div>
  );
}

function ResultBadge({ winner }: { winner: string | null }) {
  return (
    <Badge variant="secondary">
      {winner ? (
        <>
          <TrophyIcon />
          Ganó {winner}
        </>
      ) : (
        "Empate"
      )}
    </Badge>
  );
}

/**
 * Match header. When there's a photo it becomes the card background with a
 * bottom scrim so the white scoreboard reads on any image (consistent in light
 * and dark). Without a photo it's a plain card in theme colors. Admin upload /
 * remove controls sit in the top corner.
 */
export function MatchHero({
  matchId,
  teams,
  dateLabel,
  winner,
  photoUrl,
  admin,
}: {
  matchId: number;
  /** Los equipos del partido con sus goles (2 … 6). */
  teams: MatchTeamRow[];
  dateLabel: string;
  winner: string | null;
  photoUrl: string | null;
  admin: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const hasPhoto = Boolean(photoUrl);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    const data = new FormData();
    data.set("file", file);
    const up = await uploadImage(data);
    if (!up.ok) {
      setBusy(false);
      toast.error(up.error);
      return;
    }
    const res = await setMatchPhoto(matchId, up.url);
    setBusy(false);
    if (res.ok) {
      toast.success("Foto guardada");
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  async function remove() {
    if (!confirm("¿Quitar la foto del partido?")) return;
    setBusy(true);
    const res = await setMatchPhoto(matchId, null);
    setBusy(false);
    if (res.ok) {
      toast.success("Foto quitada");
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  const hiddenInput = (
    <input
      ref={inputRef}
      type="file"
      accept="image/*"
      className="hidden"
      onChange={onPick}
    />
  );

  const dateBadge = (
    <Badge variant="secondary" className="uppercase">
      {dateLabel}
    </Badge>
  );

  const heroImageActions = (
    <>
      {admin ? (
        <div className="flex items-center justify-end gap-2">
          {hasPhoto ? (
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              <ImagePlusIcon />
              {busy ? "Subiendo…" : "Cambiar"}
            </Button>
          ) : (
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              <ImagePlusIcon />
              {busy ? "Subiendo…" : "Subir foto"}
            </Button>
          )}

          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button
                  variant="destructive"
                  size="icon"
                  disabled={busy}
                  aria-label="Quitar foto"
                />
              }
            >
              <Trash2Icon />
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Deseas eliminar la fotografia?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  No podrias recuperar la imagen, revisa que la imagen sea la
                  que realmente quieres eliminar.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={remove}>
                  Confirmar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ) : null}
    </>
  );

  if (hasPhoto) {
    return (
      <>
        <Card className="relative isolate mb-2 min-h-[200px] justify-end overflow-hidden pt-0 text-white sm:min-h-[260px]">
          {hiddenInput}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoUrl!}
            alt={teams.map((t) => t.name).join(" vs ")}
            className="absolute inset-0 -z-10 h-full w-full object-cover"
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />

          <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4 sm:p-5">
            {dateBadge}
          </div>

          <CardContent className="space-y-4">
            <Scoreboard teams={teams} onPhoto />
            <div className="flex justify-center">
              <ResultBadge winner={winner} />
            </div>
          </CardContent>
        </Card>
        {heroImageActions}
      </>
    );
  }

  return (
    <>
      <Card>
        {hiddenInput}
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            {dateBadge}
          </div>
          <Scoreboard teams={teams} onPhoto={false} />
          <div className="flex justify-center">
            <ResultBadge winner={winner} />
          </div>
        </CardContent>
      </Card>
      {heroImageActions}
    </>
  );
}

"use client";

import { setMatchPhoto } from "@/app/actions/matches";
import { uploadImage } from "@/app/actions/uploads";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ImagePlusIcon, TrophyIcon, Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

/** Teams · marcador · Team names, shared by the photo and no-photo layouts. */
function Scoreboard({
  teamAName,
  teamBName,
  scoreA,
  scoreB,
  onPhoto,
}: {
  teamAName: string;
  teamBName: string;
  scoreA: number;
  scoreB: number;
  onPhoto: boolean;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-6">
      <p className="truncate text-right text-sm font-bold sm:text-xl">
        {teamAName}
      </p>
      <div className="flex items-center gap-2 font-mono text-3xl leading-none font-black tabular-nums sm:gap-3 sm:text-5xl">
        <span>{scoreA}</span>
        <span className={onPhoto ? "text-white/60" : "text-muted-foreground"}>
          –
        </span>
        <span>{scoreB}</span>
      </div>
      <p className="truncate text-left text-sm font-bold sm:text-xl">
        {teamBName}
      </p>
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
  teamAName,
  teamBName,
  scoreA,
  scoreB,
  dateLabel,
  winner,
  photoUrl,
  admin,
}: {
  matchId: number;
  teamAName: string;
  teamBName: string;
  scoreA: number;
  scoreB: number;
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

  if (hasPhoto) {
    return (
      <Card className="relative isolate min-h-[200px] justify-end overflow-hidden pt-0 text-white sm:min-h-[260px]">
        {hiddenInput}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photoUrl!}
          alt={`${teamAName} vs ${teamBName}`}
          className="absolute inset-0 -z-10 h-full w-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />

        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4 sm:p-5">
          {dateBadge}
          {admin ? (
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={busy}
                onClick={() => inputRef.current?.click()}
              >
                <ImagePlusIcon />
                {busy ? "Subiendo…" : "Cambiar"}
              </Button>
              <Button
                variant="secondary"
                size="icon"
                disabled={busy}
                onClick={remove}
                aria-label="Quitar foto"
              >
                <Trash2Icon />
              </Button>
            </div>
          ) : null}
        </div>

        <CardContent className="space-y-4">
          <Scoreboard
            teamAName={teamAName}
            teamBName={teamBName}
            scoreA={scoreA}
            scoreB={scoreB}
            onPhoto
          />
          <div className="flex justify-center">
            <ResultBadge winner={winner} />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {hiddenInput}
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          {dateBadge}
          {admin ? (
            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              <ImagePlusIcon />
              {busy ? "Subiendo…" : "Subir foto"}
            </Button>
          ) : null}
        </div>
        <Scoreboard
          teamAName={teamAName}
          teamBName={teamBName}
          scoreA={scoreA}
          scoreB={scoreB}
          onPhoto={false}
        />
        <div className="flex justify-center">
          <ResultBadge winner={winner} />
        </div>
      </CardContent>
    </Card>
  );
}

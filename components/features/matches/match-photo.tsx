"use client";

import { setMatchPhoto } from "@/app/actions/matches";
import { uploadImage } from "@/app/actions/uploads";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImagePlusIcon, Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

export function MatchPhoto({
  matchId,
  photoUrl,
  admin,
}: {
  matchId: number;
  photoUrl: string | null;
  admin: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Sin foto y sin permisos: no ocupamos espacio.
  if (!photoUrl && !admin) return null;

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

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between gap-3">
          <CardTitle>Foto del partido</CardTitle>
          {admin ? (
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onPick}
              />
              <Button
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => inputRef.current?.click()}
              >
                <ImagePlusIcon />
                {busy ? "Subiendo…" : photoUrl ? "Cambiar" : "Subir foto"}
              </Button>
              {photoUrl ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive"
                  disabled={busy}
                  onClick={remove}
                  aria-label="Quitar foto"
                >
                  <Trash2Icon />
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt="Foto del partido"
            className="max-h-[28rem] w-full rounded-lg object-contain"
          />
        ) : (
          <p className="text-muted-foreground py-8 text-center text-sm">
            Aún no hay foto. Sube una para recordar la reta.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

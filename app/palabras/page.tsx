import { getRetaWords } from "@/lib/queries";
import { WordForm } from "@/components/word-form";

export const metadata = { title: "La Reta ____ · Reta Fútbol" };
export const dynamic = "force-dynamic";

const fmt = (d: Date | string) =>
  new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "short" }).format(
    new Date(d),
  );

export default async function PalabrasPage() {
  const words = await getRetaWords();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">La Reta ____</h1>
        <p className="text-sm text-muted-foreground">
          ¿Cómo es tu reta? Completa la frase y tu palabra rotará en el banner
          del inicio para toda la banda.
        </p>
      </div>

      <WordForm />

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase text-muted-foreground">
          <span className="h-4 w-1 rounded-full bg-primary" />
          Aportes · {words.length}
        </h2>

        {words.length === 0 ? (
          <p className="rounded-lg bg-card p-8 text-center text-sm text-muted-foreground ring-1 ring-foreground/10">
            Aún no hay aportes. ¡Sé el primero en completar la frase!
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {words.map((w) => (
              <div
                key={w.id}
                className="rounded-lg bg-card p-4 ring-1 ring-foreground/10"
              >
                <p className="font-display text-lg font-semibold uppercase tracking-wide">
                  La Reta <span className="text-emerald-600 dark:text-emerald-400">{w.word}</span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  — {w.author ?? "Anónimo"} · {fmt(w.createdAt)}
                </p>
                {(w.language || w.timezone || w.screen) && (
                  <p className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground">
                    {w.language && <span>🌐 {w.language}</span>}
                    {w.timezone && <span>🕐 {w.timezone}</span>}
                    {w.screen && <span>📱 {w.screen}</span>}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

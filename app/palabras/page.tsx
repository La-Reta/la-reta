import { getRetaWords } from "@/lib/queries";
import { WordForm } from "@/components/features/words/word-form";

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
        <p className="text-muted-foreground text-sm">
          ¿Cómo es tu reta? Completa la frase y tu palabra rotará en el banner
          del inicio para toda la banda.
        </p>
      </div>

      <WordForm />

      <section className="space-y-3">
        <h2 className="text-muted-foreground flex items-center gap-2 text-sm font-semibold uppercase">
          <span className="bg-primary h-4 w-1 rounded-full" />
          Aportes · {words.length}
        </h2>

        {words.length === 0 ? (
          <p className="bg-card text-muted-foreground ring-foreground/10 rounded-lg p-8 text-center text-sm ring-1">
            Aún no hay aportes. ¡Sé el primero en completar la frase!
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {words.map((w) => (
              <div
                key={w.id}
                className="bg-card ring-foreground/10 rounded-lg p-4 ring-1"
              >
                <p className="font-display text-lg font-semibold tracking-wide uppercase">
                  La Reta{" "}
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {w.word}
                  </span>
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  — {w.author ?? "Anónimo"} · {fmt(w.createdAt)}
                </p>
                {(w.language || w.timezone || w.screen) && (
                  <p className="text-muted-foreground mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px]">
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

import { WordForm } from "@/components/features/words/word-form";
import { WordItem } from "@/components/features/words/word-item";
import { getRetaWords } from "@/lib/queries";

export const metadata = { title: "La Reta ____ · Reta Fútbol" };
export const dynamic = "force-dynamic";

export default async function PalabrasPage() {
  const words = await getRetaWords();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
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
              <WordItem key={w.id} word={w} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

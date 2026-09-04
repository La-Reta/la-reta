import { WordForm } from "@/components/features/words/word-form";
import { WordItem } from "@/components/features/words/word-item";
import { PageHeader } from "@/components/shared/page-header";
import { SectionHeading } from "@/components/shared/section-heading";
import { Card } from "@/components/ui/card";
import { getRetaWords } from "@/lib/queries";
import { Metadata } from "next";

export const metadata: Metadata = { title: "La Reta ____ · Reta Fútbol" };
export const dynamic = "force-dynamic";

export default async function PalabrasPage() {
  const words = await getRetaWords();

  return (
    <div className="container mx-auto space-y-6">
      <PageHeader
        title="La Reta ____"
        description="¿Cómo es tu reta? Completa la frase y tu palabra rotará en el banner del inicio para toda la banda."
      />

      <WordForm />

      <section className="space-y-3">
        <SectionHeading title="Aportes" count={words.length} />

        {words.length === 0 ? (
          <Card size="sm" className="border-dotted p-0">
            <p className="text-muted-foreground p-8 text-center">
              Aún no hay aportes. ¡Sé el primero en completar la frase!
            </p>
          </Card>
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

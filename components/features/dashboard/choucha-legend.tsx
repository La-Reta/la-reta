import {
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { FlameIcon, SparklesIcon, StarIcon, TrophyIcon } from "lucide-react";
import { LegendVideo } from "./legend-video";

/** Quick real-life profile chips. */
const PROFILE: { label: string; value: string }[] = [
  { label: "Real", value: "Zaki Khellaf" },
  { label: "Origen", value: "🇩🇿 Oum El Bouaghi" },
  { label: "Edad", value: "~40" },
  { label: "Dorsal", value: "10 / 3" },
];

/** Non-official, meme-culture "attributes" — for the fun of it. */
const ATTRS: { key: string; value: number }[] = [
  { key: "SIU", value: 99 },
  { key: "PASE", value: 12 },
  { key: "DRI", value: 88 },
  { key: "CARISMA", value: 99 },
  { key: "MEME", value: 99 },
];

/** Real internet-lore about Choucha, kept in his meme-culture tone. */
const FACTS: { icon: typeof StarIcon; text: string }[] = [
  {
    icon: SparklesIcon,
    text: "Futbolista amateur argelino vuelto fenómeno viral: sus videos suman cientos de millones de reproducciones en TikTok e Instagram.",
  },
  {
    icon: FlameIcon,
    text: "Fan absoluto de Cristiano: recrea el «Siu» y se inventó sus propias señas (el «shhh» y los cuernitos).",
  },
  {
    icon: TrophyIcon,
    text: "Las finales de barrio en Argelia se llenan de miles de personas que pagan entrada solo para verlo jugar y celebrar.",
  },
  {
    icon: StarIcon,
    text: "La comunidad lo trata como el verdadero GOAT: «sus fallos son asistencias a otra dimensión» y «Pep no sabría cómo marcarlo».",
  },
];

/**
 * Dialog body for the Player Legend: the Choucha video on the left (driving the
 * height) and his real internet lore on the right. Drop inside a <Dialog>.
 */
export function ChouchaLegend() {
  return (
    <DialogContent className="overflow-hidden p-0 sm:max-w-3xl lg:max-w-4xl 2xl:max-w-5xl">
      {/* Fixed responsive row height drives both the video and the info panel,
          so the video grows on larger/taller desktops while staying aligned. */}
      <div className="flex flex-col sm:h-[34rem] sm:flex-row lg:h-[40rem] 2xl:h-[46rem]">
        {/* ── Video (drives the height) ─────────────────────────────── */}
        <div className="relative shrink-0 bg-black">
          <LegendVideo
            src="/choucha-video.webm"
            className="mx-auto h-72 w-auto object-contain sm:h-full"
          />
        </div>

        {/* ── Info ──────────────────────────────────────────────────── */}
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-6">
          <span className="font-display inline-flex w-fit items-center gap-1.5 rounded-full bg-amber-400/15 px-2.5 py-1 text-[11px] font-semibold tracking-[0.18em] text-amber-500 uppercase ring-1 ring-amber-400/30 dark:text-amber-300">
            <StarIcon className="size-3.5 fill-amber-400 text-amber-400" />
            El GOAT del fútbol de barrio
          </span>

          <div>
            <DialogTitle className="font-display text-3xl leading-none font-bold tracking-tight uppercase">
              Choucha
            </DialogTitle>
            <p className="text-muted-foreground mt-1 text-sm">
              Zaki Khellaf · «Choucha 3» · 🇩🇿 Argelia
            </p>
          </div>

          <DialogDescription className="leading-relaxed">
            Futbolista amateur y creador de contenido argelino convertido en
            fenómeno viral. No juega en ninguna liga profesional, pero su pasión
            desbordante y su comedia involuntaria lo hicieron un símbolo de
            inclusión y el «mejor del mundo» según internet. 🐐⚽🔥
          </DialogDescription>

          {/* Real profile chips */}
          <div className="grid grid-cols-2 gap-2">
            {PROFILE.map((p) => (
              <div
                key={p.label}
                className="bg-muted/50 rounded-md px-2.5 py-1.5"
              >
                <p className="text-muted-foreground text-[9px] font-semibold tracking-wide uppercase">
                  {p.label}
                </p>
                <p className="text-sm font-semibold">{p.value}</p>
              </div>
            ))}
          </div>

          {/* Non-official meme attributes */}
          <div>
            <p className="text-muted-foreground mb-1.5 text-[11px] font-semibold tracking-[0.14em] uppercase">
              Atributos (no oficiales 😅)
            </p>
            <div className="grid grid-cols-5 gap-1">
              {ATTRS.map((a, i) => (
                <div
                  key={`${a.key}-${i}`}
                  className="bg-muted/50 rounded-md py-1 text-center"
                >
                  <p className="font-mono text-sm leading-none font-bold tabular-nums">
                    {a.value}
                  </p>
                  <p className="text-muted-foreground mt-0.5 text-[9px] font-semibold">
                    {a.key}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Real internet lore */}
          <div>
            <p className="text-muted-foreground mb-2 text-[11px] font-semibold tracking-[0.14em] uppercase">
              Por qué es leyenda
            </p>
            <ul className="space-y-2">
              {FACTS.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-2.5 text-sm">
                  <Icon className="mt-0.5 size-4 shrink-0 text-amber-500 dark:text-amber-400" />
                  <span className="leading-snug">{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </DialogContent>
  );
}

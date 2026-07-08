import leo from "leo-profanity";

// leo-profanity ships no Spanish dictionary (only en/fr/ru), so we seed
// common ES profanity on top of the default list. Runs once at module load.
// ponytail: hand-list; swap for a real ES dictionary package if it gets noisy.
const ES_WORDS = [
  "puta",
  "puto",
  "putas",
  "putos",
  "puta madre",
  "mierda",
  "cabron",
  "cabrón",
  "cabrones",
  "pendejo",
  "pendeja",
  "pendejos",
  "pendejas",
  "verga",
  "vergas",
  "chinga",
  "chingar",
  "chingada",
  "chingado",
  "chingada madre",
  "chingatumadre",
  "coño",
  "cono",
  "joto",
  "jotos",
  "maricon",
  "maricón",
  "maricones",
  "culero",
  "culeros",
  "culera",
  "pinche",
  "pinches",
  "mamada",
  "mamadas",
  "mamon",
  "mamón",
  "pito",
  "pitos",
  "polla",
  "gilipollas",
  "carajo",
  "cagada",
  "cagar",
  "zorra",
  "perra",
  "estupido",
  "estúpido",
  "imbecil",
  "imbécil",
  "idiota",
  "tonto",
];

leo.add(ES_WORDS);

/** Censor profanity, keeping the first letter of each bad word (`p***`). */
export function cleanText(text: string): string {
  return leo.clean(text, "*", 1);
}

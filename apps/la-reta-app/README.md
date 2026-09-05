# ⚽ Reta Fútbol — mobile app

The [Expo](https://expo.dev) / React Native client (SDK 57). It reads and writes through the web app's `/api/v1`, so the [web app](../la-reta-web/README.md) needs to be reachable for anything data-driven.

> Project overview, install steps and contribution guide live at the [monorepo root](../../README.md).

## Stack

- **[Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/)** with the New Architecture
- **[Expo Router](https://docs.expo.dev/router/introduction/)** — file-based routes in `src/app`
- **[Oswald](https://fonts.google.com/specimen/Oswald)** (`@expo-google-fonts/oswald`) — the condensed face the web uses for scoreboards
- **[Clerk](https://clerk.com)** (`@clerk/expo` v4) for authentication — same instance as the web
- **[@expo/ui](https://docs.expo.dev/versions/latest/sdk/ui/)** for native SwiftUI / Jetpack Compose controls
- **[Reanimated](https://docs.swmansion.com/react-native-reanimated/)** for animation
- **[react-native-svg](https://github.com/software-mansion/react-native-svg)** for the icon set and the FIFA card gradients
- **[`expo-glass-effect`](https://docs.expo.dev/versions/v57.0.0/sdk/glass-effect/)** — liquid glass on iOS 26, with a solid fallback everywhere else

## Running it

From the monorepo root (`npm install` there first — never inside this folder):

```bash
npm run dev:app        # expo start — press i (iOS), a (Android), w (web)
```

Or from this workspace: `npm run ios` / `npm run android` / `npm run web`.

| Script | What it does |
| --- | --- |
| `npm run dev` | `expo start` |
| `npm run ios` | Start and open the iOS simulator |
| `npm run android` | Start and open the Android emulator |
| `npm run web` | Start the web target |
| `npm run lint` | `expo lint` (this app is outside the root Ultracite ESLint) |
| `npm run check-types` | `tsc --noEmit` |

## Layout

```bash
src/
  app/
    _layout.tsx            Root stack: Clerk, theme and the welcome layer
    index.tsx              "/" — signed-out landing (proof + promise + sign in / sign up)
    (auth)/                sign-in and sign-up, presented as a modal
    calendario.tsx         "/calendario" — reta calendar, presented as a form sheet
    (tabs)/
      _layout.tsx          The five tabs (NativeTabs on native, a top bar on web)
      (inicio)/            "/inicio" — dashboard
      (plantilla)/         "/plantilla" — roster gallery
      (reta)/              "/reta"      — team builder
      (partidos)/          "/partidos" — match history
      (inicio,plantilla)/            "/jugador/[id]" — player sheet, shared
      (inicio,plantilla,partidos)/   "/partido/[id]" — match sheet, shared
      (perfil)/            "/perfil" and "/diagnostico"
  components/
    ui/                    Primitives: Text, Surface, Button, Field, Row, Icon, Figure,
                           Section, Segmented, GlassSurface
    ...                    Domain pieces: FifaCard, PlayerAvatar, PitchLineup, StatRadar,
                           RetaMonth, QuickActions, CrackCard, MatchCard, PlayerRow,
                           StatStrip, MatchdayBanner, PlayerSheet, MatchSheet,
                           MatchHero, ScorerBoard, VoteResults
  constants/theme.ts       Palette, type scale, spacing, radii and motion
  hooks/                   Data (use-api, use-reta) and font loading
  lib/                     API client, types and derived stats
assets/                    App icons
```

Each tab is a group with its own `Stack` (`components/tab-stack.tsx`) so it can push detail screens without touching the bar. Groups add no URL segment, so the file inside is named after its route (`(inicio)/inicio.tsx` → `/inicio`) rather than `index.tsx`, which would collide with the landing.

Detail screens that more than one tab can open live in **array route groups** — `(inicio,plantilla)/jugador/[id].tsx` is one file mounted into both stacks, so each tab keeps its own history: tapping the crack on the dashboard opens the sheet _inside Inicio_, and back returns where you came from. This replaced an earlier workaround with two files under two different URLs (`/ficha` and `/jugador`) for the same screen. Verified end to end: Plantilla → player → match keeps the Plantilla tab active the whole way.

Imports use the `@/*` alias for `src/*` and `@/assets/*` for `assets/*`.

## Styling

One theme, light and editorial, with the tokens in `src/constants/theme.ts`. The accent and the ink are an exact conversion of the web's `oklch` tokens, so both clients use literally the same green.

Style with `StyleSheet` / inline styles on top of those tokens, not classes:

```tsx
import { Text } from "@/components/ui/text";
import { Palette, Spacing } from "@/constants/theme";

<View style={{ gap: Spacing.three, backgroundColor: Palette.paper }}>
  <Text variant="title">Plantilla</Text>
</View>;
```

Before inventing a `fontSize` or a colour, find the step in `Type` and the token in `Palette` — that is what keeps the screens looking like each other.

NativeWind v5 is still wired up (`metro.config.js`, `postcss.config.mjs`, `src/global.css`) and `src/global.css` supplies the web font variables, but no screen uses `className` yet. `nativewind-env.d.ts` is generated by `react-native-css` — commit it, don't edit it.

## Auth

Both clients talk to the **same Clerk instance**, so an account made on the phone works on the web and the other way round. Put its publishable key in `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` (see `.env.example`); without it the app still runs in public mode and the auth screens say what is missing.

The screens are custom (`components/auth-form.tsx`), not Clerk's prebuilt `AuthView`: the prebuilt components need a development build and don't render on web, and this app is developed in Expo Go. That also keeps the editorial look.

What the flows do, driven by what the instance actually has enabled:

- **Email + password.** Sign-up needs a 6-digit email code, so it is a two-step screen; the code step reuses the same view.
- **Google**, via browser SSO (`useSSO`) — the only social path that works in Expo Go. The fully native Google sheet (`useSignInWithGoogle`) needs a dev build; swap it in there if you ever want it.
- **New-device verification** (`needs_client_trust`) reuses the code step.

Notes for whoever touches this next:

- `@clerk/expo` v4 uses the **signal API**: `useSignIn()` returns `{ signIn, errors, fetchStatus }` and the factor methods (`signIn.password()`, `signUp.verifications.verifyEmailCode()`) **resolve with `{ error }` instead of throwing** — check the returned error, don't wrap in try/catch. The old `create()` + `prepareFirstFactor()` + `setActive()` chain lives in `@clerk/expo/legacy` and is not for new code. SSO is the exception: it still uses `setActive({ session: createdSessionId })`.
- Bot protection is on for this instance, so any screen that can create a sign-up must render `<View nativeID="clerk-captcha" />` or sign-up fails with `captcha_invalid`.
- Clerk answers in English; `lib/auth-errors.ts` maps the codes people actually hit to Spanish and falls back to Clerk's own message.
- To test on a development instance without a real inbox, sign up with an address like `tunombre+clerk_test@example.com` and use the code `424242`.

## Design notes

- **The landing shows proof, not content.** Aggregate numbers say the squad is real and alive; the crack's card, the top scorer and the last score live inside, because they are what you open the app for. While the landing showed them, signing in bought you nothing.
- **Glass.** `components/ui/glass-surface.tsx` uses `GlassView` on iOS 26 and falls back to a white hairline card where the material doesn't exist. The primary action never goes in glass: its contrast depends on what is behind it, so it stays solid and the alternative takes the glass.
- **Welcome.** `components/splash-overlay.tsx` covers the font download. Its loading rule stops at 70% until something has actually finished.
- **Figures.** Always Oswald with `tabular-nums`; a scoreboard that changes width as the number changes reads as a bug.
- **Not everything is a rectangle.** The shapes that carry meaning are drawn, not boxed: `pitch-lineup.tsx` is a real pitch (lines to scale, portrait, faces on the grass), `stat-radar.tsx` is the six-attribute hexagon — its _silhouette_ says what six bars cannot, and the axes follow FIFA's order so it is comparable with any other app — and `reta-calendar.tsx` is a row of date pills. `lib/lineup.ts` is the web's 4-3-3 with the coordinates turned portrait; the same component will draw generated teams when the native team builder lands.
- **The matchday banner is the loudest thing on screen, on purpose.** It is the only solid-accent block in the app because it holds the only fact that expires. It carries a gradient and the pitch's centre circle bleeding off the right edge, and the countdown is set at 72 pt — the text stays in the left half so the motif never fights it.
- **The calendar is a month grid, not a strip.** A horizontal row of dates repeated what the banner already said; a grid shows the _cadence_ — Thursdays marked every other week. It travels three months back and five forward (`MIN_MONTH_OFFSET` / `MAX_MONTH_OFFSET`) — past retas belong in Partidos, and an unbounded calendar is a scroll into nothing. The month lives in the screen, not the grid, so "Hoy" can sit in the header where iOS puts it; it only appears once you have actually left the current month.
- **Quick actions carry labels.** `quick-actions.tsx` is the row of rounded tiles under the banner; the calendar lives there rather than as an unlabelled icon in the banner's corner. Only destinations the tab bar cannot reach in one tap belong in it — repeating tabs would make it decoration. The first tile is solid accent so the row has an obvious entry point instead of four equals.
- **The player sheet has a sticky header, and the face never leaves.** The card owns the screen when it opens; as you scroll it shrinks and hands over to a compact row — portrait, name, positions, OVR — that parks at `HEADER_MIN` and stays. An earlier version let the header scroll away entirely, which defeats the pattern: once the photo is gone you stop knowing whose numbers you are reading. The interpolation runs on the UI thread off the real scroll offset.
- **The most recent match is the loud one.** In a list of five identical white cards, the match people open the app to see looked like one from three months ago; it now comes in solid accent with an "Último" badge.
- **Never read `scoreA`/`scoreB` directly.** A reta can be played with three to six teams and stores the full scoreboard in `teams`; `matchTeams()` in `lib/teams.ts` returns the list either way. Team colours match the web's, so the same match reads the same on both clients. The match list was hiding the third team until this landed.
- **One accent, still.** The match sheet was briefly a dark gradient card, a rainbow goal bar and three pastel vote cards. It looked like every generated template, because eight colours had quietly replaced the single accent the app was built on. It is back in the house language — paper, hairlines, Oswald figures, faces — and the team colours survive only as 3 pt rules, where they identify rather than decorate.
- **Boxes are not free.** Rows of content use hairlines, not cards. Boxing every item in a list adds borders without adding information; the scorer list and the vote list read the same way as the ranking on the dashboard.
- **The radar draws the squad average behind the player.** A 68 for pace means nothing until you see it against the reta's 52. Both silhouettes overlap, so where someone gains and where they give ground reads without a single number. Everything on the sheet — goal history, rank, averages — is derived from the two payloads already in memory; the sheet makes no request of its own.
- **The card scrim is black, not tinted.** It was briefly tinted with the tier colour so photo and no-photo cards felt like one family; on gold that laid a yellow wash over every face. The tier already reads from the no-photo background, the edge and the OVR — no need to dirty the portraits.
- **Cards.** `components/fifa-card.tsx` mirrors the web's tiered card. Roughly half the roster has no `photoUrl`, so the no-photo case is a first-class state, not an afterthought: initials in a disc over the tier gradient. The bottom scrim is tinted with the tier colour so a card with a photo and one without still read as the same family.
- **Photos.** `photoUrl` arrives in two shapes — absolute (Vercel Blob) and relative to the web app's `public/`. `lib/photos.ts` resolves both; a bare relative path never loads on a device, since there is no origin to resolve against.

### Two traps worth knowing about

Both cost real debugging time, and neither fails loudly.

- **Oswald `lineHeight` has a floor: ~1.2 em.** Below it iOS clips the glyph and eats accents — "TOÑO" rendered as "TONO". There is no ceiling; a note here once claimed one at ~52 pt, but that was the font-before-mount bug below wearing a disguise, and it is fixed. `constants/theme.ts` has the numbers.
- **`headerLargeTitle` reserves the space and draws nothing** in this setup. It cost ~100 pt of blank at the top of every screen. The tab stacks use the compact bar instead (`components/tab-stack.tsx`).
- **A native text view resolves its font family once, when it is created.** Any text mounted before `useFonts` resolves keeps the system face forever, even after a re-render — and a Reanimated-only update never re-renders at all. The root layout therefore waits for `fontsReady` before mounting the tree, and the splash mounts its wordmark only once the font is in. This one wears disguises: it first looked like a `lineHeight` ceiling on Oswald, which does not exist.
- **Pushed screens label their back button.** `headerBackButtonDisplayMode` is `"default"`, so a detail screen says "‹ Partidos" instead of a bare chevron — worth the pixels, because knowing where back goes saves a glance at the tab bar to work out where you are.
- **`router.back()` on a screen that is first in the stack does nothing** and logs "The action 'GO_BACK' was not handled by any navigator". Any overlay reachable by deep link (`/calendario`, `/sign-in`) can be that first screen, and its close button would be dead exactly when nothing else is on screen. Close them with `closeOverlay()` from `lib/navigation.ts`, which falls back to a real destination.
- **`<Svg style={StyleSheet.absoluteFill}>` has no size on web.** It fills on native but collapses to its default box in a browser, so a background gradient only paints one corner. Always pass `width="100%" height="100%"` as well.
- **Fast Refresh does not re-apply `Stack.Screen` options.** A sheet that renders blank after you edited its `presentation` is showing you the previous options, not a bug in the sheet. Reload the app before believing what you see.

> ⚠️ Expo has changed a lot: read the versioned docs at <https://docs.expo.dev/versions/v57.0.0/> before writing code (see [`AGENTS.md`](./AGENTS.md)).

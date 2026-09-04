# La Reta

Monorepo turbo: `apps/la-reta-app` (Expo), `apps/la-reta-web` (Next.js), `packages/*`.

## Agent skills

### Issue tracker

Issues and specs live as local markdown under `.scratch/<feature-slug>/` at the monorepo root (this repo has no git remote). See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical triage roles, each label string equal to its name. See `docs/agents/triage-labels.md`.

### Domain docs

Multi-context: `CONTEXT-MAP.md` at the root pointing at one `CONTEXT.md` per workspace. See `docs/agents/domain.md`.

### Code standards

Lint and formatting are Ultracite (ESLint + Prettier + Stylelint), configured at the repo root. Its rules for agents live in `.claude/CLAUDE.md` — read it before writing code. Run `npm run check` to verify and `npm run fix` to autofix.

`apps/la-reta-app` is deliberately outside Ultracite: React Native is linted by `expo lint` (eslint-config-expo) from that workspace.

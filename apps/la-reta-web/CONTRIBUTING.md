# Contributing to Reta Fútbol

Thanks for your interest in contributing! This is a small, just-for-fun project,
so contributions of any size are welcome — bug fixes, features, docs, or ideas.

By participating, you agree to follow our
[Code of Conduct](./CODE_OF_CONDUCT.md).

## Getting set up

1. **Fork** the repo and clone your fork.
2. Install dependencies: `npm install` (Node.js **20+**).
3. Copy `.env.example` to `.env.local` and add your [Neon](https://neon.tech)
   `DATABASE_URL`.
4. Create the schema and sample data:

   ```bash
   npm run db:push
   npm run db:seed
   ```

5. Start the dev server: `npm run dev`.

See the [README](./README.md) for more setup detail.

## Ground rules

### ⚠️ Data safety (hard rule)

- `db:seed` **deletes** the `players` table (cascading to `match_goals`). **Never**
  run it — or any destructive DML — against real/production data.
- All schema changes must be **additive** (new columns/tables + `db:push`). Never
  rewrite or drop existing user data.

### This is Next.js 16

Several framework APIs differ from older versions and from what you may expect.
**Before writing framework code, read the relevant guide in
`node_modules/next/dist/docs/`** (see [`AGENTS.md`](./AGENTS.md)). Prefer Server
Components and Server Actions; TanStack Query is used only in the players gallery.

## Workflow

1. Create a branch from `main`:

   ```bash
   git checkout -b feat/short-description   # or fix/, docs/, chore/
   ```

2. Make focused changes — keep pull requests small and single-purpose.
3. Before you push, make sure the project is clean:

   ```bash
   npm run lint      # ESLint
   npm run format    # Prettier
   npm run build     # must compile (source of truth for CSS)
   ```

   > There is no test runner configured. Verify your change by exercising the
   > affected flow in the running app.

4. Push and open a pull request against `main`, filling out the PR template.

## Commit messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
feat: add emoji reactions to player comments
fix: survive Neon cold starts in the db retry loop
docs: rewrite the README in English
chore: bump dependencies
```

Common types: `feat`, `fix`, `docs`, `refactor`, `chore`, `style`, `perf`.

## Code style

- **TypeScript** everywhere; match the style of the surrounding code.
- **Tailwind CSS v4** for styling (`prettier-plugin-tailwindcss` orders classes).
- Components live under `components/ui`, `components/app`,
  `components/features/<domain>`, and `components/shared`.
- Server Actions live in `app/actions/*.ts`, one file per domain.
- Run `npm run format` before committing — it settles almost every style nit.

## Reporting bugs & requesting features

Use the [issue templates](https://github.com/mrluisfer/la-reta/issues/new/choose).
For security issues, please read [SECURITY.md](./SECURITY.md) instead of opening a
public issue.

Happy hacking, and enjoy the reta! ⚽

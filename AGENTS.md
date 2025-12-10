# Repository Guidelines

## Project Structure & Module Organization
- `src/main.tsx` bootstraps Vite/React; `src/App.tsx` renders the dashboard.
- Components in `src/components` (tables, modals, dashboard) with barrel export `index.ts`.
- Pure calculations/utilities in `src/lib` (`calculations.ts`, `uk-tax.ts`, `date-utils.ts`); keep side-effect free.
- Zustand store in `src/store/index.ts` handles snapshots, derived tables, and persistence.
- Types and defaults in `src/types`; styling via Tailwind (`src/index.css`, `tailwind.config.js`).

## Build, Test, and Development Commands
- `npm install`
- `npm run dev` – Vite dev server on 5173 with HMR.
- `npm run build` – type-checks with `tsc`, then builds.
- `npm run preview` – serve the production build.
- `npm test` or `npm run test:watch` – Vitest suite.

## Coding Style & Naming Conventions
- TypeScript + React function components; prefer small, prop-driven pieces.
- 2-space indentation, single quotes, and trailing semicolons to match current files.
- Components/files use `PascalCase`; hooks use `useX`; helper modules in `src/lib` use `camelCase`.
- Rely on Tailwind utilities; extend shared tokens in `tailwind.config.js` instead of duplicating colors/spacings.
- Keep view components dumb: calculate/format data in `src/lib` or selectors before passing to JSX.

## Testing Guidelines
- Stack: Vitest + React Testing Library + jsdom.
- Co-locate `*.test.ts(x)` near sources; cover `src/lib` calculations, store actions/selectors, and critical component flows.
- Use realistic fixtures for snapshots (sample snapshots/configs) and exercise edge cases (date boundaries, empty history).
- Run `npm test` before PRs; prefer behavior assertions over snapshot-only tests.

## Commit & Pull Request Guidelines
- History uses short, imperative subjects (e.g., "license"); keep one focused change per commit, subject <=72 chars.
- PRs: brief summary + motivation, linked issue (`Fixes #123`), tests executed, and screenshots/GIFs for UI changes (desktop + mobile).
- Call out data-shape changes to the persisted store or defaults so reviewers can check migration impact.

## Security & Configuration Tips
- Never commit secrets; keep env-specific values outside the repo.
- Persistence uses browser storage; add backward-safe guards/migrations when changing stored types.
- Run `npm run build` before release branches to catch type/bundle regressions.

## Design Guidelines
- The look should be minimal and modern. Think linear/notion.

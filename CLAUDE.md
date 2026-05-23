# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Fortress is a personal Financial Independence (FI) planning application built with React and TypeScript. It's organized as a tabbed monthly report driven by a single editable config: live simulation tables for minimum required income and earliest stop-work age, year-by-year wealth trajectory charts, and scenario presets that snap all sliders to coherent assumption sets.

## Commands

- `npm run dev` - Start Vite dev server (`/fortress-app/` base path)
- `npm run build` - TypeScript compile + Vite production build
- `npm run preview` - Preview production build
- `npm test` / `npm run test:watch` - Vitest suite

## Architecture

### Tech Stack
- React 18 + TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Recharts for charts
- Zustand (with localStorage persistence) for the editable config

### Layout

**`src/App.tsx`** — Shell. Holds tab state and the scenario-slider state hook; renders the six tabs.

**Tabs (`src/components/tabs/`)**
- `OverviewTab` — net-worth headline cards, 12-month trajectory, asset breakdown pie + table
- `IncomeExpensesTab` — fiscal-year revenue chart, YTD expense run-rate, client roster
- `MinIncomeTab` — sliders for growth/windfalls/family/lifestyle; live tables of minimum required revenue and FI numbers across lifestyle × windfall combinations; margin analysis
- `StopAgeTab` — inverse: at a sustained revenue, what's the earliest stop age? Plus a year-by-year wealth trajectory chart
- `DecisionsTab` — current run-rate vs no-windfall thresholds
- `AssumptionsTab` — parameter dump

**UI primitives (`src/components/ui/`)** — `Card`, `Stat`, `Pill`, `TabBar`, `Slider`, `NumInput`.

**Settings (`src/components/SettingsPage.tsx`)** — modal form bound to the zustand store; edits personalization, ages, income, expenses, wealth, windfalls, house/university.

### Simulation engine (`src/lib/simulation.ts`)

All values in real (today's £) terms. The engine is a pure function of `SimOptions`.

- `simulate(opts)` — year-by-year loop from `primaryPartnerAge` → `terminalAge`. Returns terminal liquid wealth (`-Infinity` if ran out).
- `simulateTrajectory(opts)` — same loop, returns the year-by-year `TrajectoryPoint[]` for charting.
- `findMinIncome(opts)` — binary search the minimum revenue/salary that keeps the run solvent.
- `findStopAge(opts)` — sweep stop ages, find the earliest solvent one.
- `findFINumber(opts)` — binary search the total wealth (liquid + pensions) required today to retire now.
- `equityNetForPricePerShare(pps, table)` — linear interpolation across an equity exit price table (with linear extrapolation above the top point).
- `annualSpend(...)` — household spend at a given primary-partner age across baseline, schools (per-child age windows), house upgrade window, and university stacks.

### Tax (`src/lib/uk-tax.ts`)

- `payeNet(salary, t)` — PAYE net including PA taper above £100k and NI bands.
- `distributeBusiness(revenue, expenses, partner1, partner2, t)` — owner-managed Ltd extraction: each partner draws salary up to NI threshold, dividends up to basic rate, employer pension contribution, then retained profit. CT and dividend tax netted out.
- `DEFAULT_TAX` — UK 2024/25 rates exposed as `TaxParams`.

### Config & store (`src/types.ts`, `src/data/demoConfig.ts`, `src/store.ts`)

`FortressConfig` is the single source of truth. `DEMO_CONFIG` ships anonymized defaults. Zustand persists `config` to localStorage (`fortress-config-v1`). Tabs read config via `useFortressStore`. Slider state for the live tabs lives in `useScenarioState` (`src/lib/useScenarioState.ts`) — not persisted; it resets on reload.

### Scenario presets (`src/lib/presets.ts`)

`PRESETS` snap all sliders at once: Stress (2% real, no windfalls), Central (3% real, modest windfalls), Optimistic (5% real, equity upside, partner 2 returns). Touching any slider switches the active preset to `null` ("Custom").

### Path Aliases
`@/*` maps to `src/*` (configured in tsconfig.json and vite.config.ts).

## Domain Context

The app models a two-partner UK household with:
- Each partner: business (owner-managed Ltd) or PAYE
- Children: per-child school fee bands (primary → secondary) keyed off each child's age in the simulation year
- Pension lockup until configured unlock age, then merged into liquid
- Optional lifestyle upgrades: house upgrade (lump + ongoing) and university (per child)
- Windfalls: equity exit (interpolated from PPS table), inheritance (lump), alternate exit (dividend stream + PAYE salary + lump)

## Design Guidelines

Minimal and modern. Think Linear / Notion. Stone neutrals, cyan/violet/emerald accents. No emojis. Tabular numerals for all monetary values.

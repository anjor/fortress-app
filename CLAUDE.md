# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Fortress is a personal Financial Independence (FI) planning application built with React and TypeScript. It provides scenario-based financial projections with UK-specific tax calculations, designed for modeling paths to financial independence.

## Commands

- `npm run dev` - Start Vite dev server
- `npm run build` - TypeScript compile + Vite production build
- `npm run preview` - Preview production build

## Architecture

### Tech Stack
- React 18 + TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Recharts for data visualization

### Key Files

**`src/App.tsx`** - Main application component containing:
- Dashboard view with net worth cards and projections
- Scenario comparison interface
- Tax calculator UI
- Scenario presets (Current Path, Conservative, With Inheritance, etc.)

**`src/lib/scenario-engine.ts`** - Financial projection engine:
- `runScenario()` - Main projection function that models year-by-year finances from age 40-100
- `createBaseScenario()` - Factory for creating scenario configurations
- Types: `Scenario`, `ScenarioResult`, `YearlyProjection`, `FinancialSnapshot`
- Handles: income (salary/business), expenses, school fees, mortgage, pension contributions, investment growth

**`src/lib/uk-tax.ts`** - UK tax calculations (2024/25 rates):
- `calculateOptimalExtraction()` - Salary/dividend split optimization for company directors
- `grossForNet()` - Reverse calculation: gross revenue needed for target net income
- Income tax, NI, dividend tax, and corporation tax calculations
- Handles personal allowance taper at £100k+

### Path Aliases
`@/*` maps to `src/*` (configured in tsconfig.json and vite.config.ts)

## Domain Context

The app models financial independence planning scenarios with support for:
- Flexible income configurations (employed salary or contractor/business revenue)
- Multiple children with private school fees (0-4 children)
- UK tax-advantaged accounts: Pensions, ISAs, taxable accounts, and business assets
- Customizable FI target (default: 25x annual expenses = 4% safe withdrawal rate)
- UK-specific tax calculations (income tax, NI, dividends, corporation tax)
- Scenario planning: career breaks, house upgrades, inheritance, investment exits

## Design Guidelines

The design should look minimal and modern. Think linear / notion.

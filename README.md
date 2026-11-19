# Tayi

**Local transport guide for Nigerian cities.** Tayi helps people plan journeys using everyday landmarks, informal transport connections and community-reported fares.

> People move better when local knowledge is shared.

## Current build

This first working version starts with a Port Harcourt demonstration network. It includes landmark/place search with common aliases, multi-leg route discovery over a stop graph, route instructions, four vehicle categories, fare estimates for priced legs, visible missing-price legs, a fare checker, a quick fare-report form and locally saved trips.

**Important:** The Port Harcourt routes, journey times and fare values currently included in the app are sample placeholders and have not been field-verified. Do not rely on them as current fares or verified travel advice.

## Run locally

Requirements: Node.js 22+ and npm.

- npm install
- npm run dev
- npm run build

## Backend

The supabase folder contains the initial relational schema and seed. This build runs in preview mode: saved trips and fare reports remain in this browser until the Supabase project is connected. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.local when ready. Never expose a service-role key in browser code.

## Vehicle categories

| Vehicle | Typical capacity |
| --- | ---: |
| Keke (tricycle) | 4–5 |
| Keke Bus | 8 |
| Normal Bus | 14–18 |
| Coaster Bus | 23–30 |

## Principles

- Search places and landmarks, not only stop names.
- Route search must not depend on every fare being known.
- A missing fare is different from a missing connection.
- Community reports stay pending until approved.
- Never show exact addresses or raw coordinates to riders.
- Keep city datasets separate from app logic.

Application source: MIT. Community transport dataset: intended for ODbL 1.0; see DATA-LICENSE.md.
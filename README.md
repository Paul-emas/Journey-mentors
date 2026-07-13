# Travel Mentor — Flight Search

A single-page flight-search application built on the [Duffel](https://duffel.com/docs) flight API. Users search by origin, destination, dates, cabin class, and passenger count, then filter and sort the resulting offers, expand any offer for full segment/layover/fare detail, and browse nearby dates without starting a new search.

**Live app:** https://journey-mentors.vercel.app
**Repository:** <add your repo URL>

---

## Quick Start

### Prerequisites

- Node.js 18+
- [Bun](https://bun.sh) (preferred) — or npm/yarn

### Setup

```bash
git clone <your-repo-url>
cd travel-mentor

bun install
bun dev            # dev server with HMR
```

Visit http://localhost:5173.

The frontend calls `/api/*`, which in development is proxied to the deployed Vercel edge functions (see `vite.config.ts`). This means **you can run the frontend locally without any local environment variables** — the Duffel token lives only on the server. See "Supplying the Duffel token" below if you want to run the edge functions locally instead.

### Build & lint

```bash
bun run build      # type-check (vue-tsc) + production build
bun lint           # oxlint + eslint
bun run format     # prettier
```

---

## Supplying the Duffel token

The Duffel token is a server-side secret and is **never committed or shipped to the browser**.

- **In production (Vercel):** set `DUFFEL_TOKEN` as an environment variable in the project settings. The edge functions read it from `process.env.DUFFEL_TOKEN`.
- **Locally (only if running the edge functions yourself):** copy `.env.example` to `.env` and set your sandbox token (`duffel_test_...`). By default local dev proxies to the deployed functions and needs nothing.

| Variable         | Where       | Purpose                                                                         |
| ---------------- | ----------- | ------------------------------------------------------------------------------- |
| `DUFFEL_TOKEN`   | server only | Bearer token for the Duffel API                                                 |
| `DUFFEL_API_URL` | server only | Optional override of the Duffel base URL (defaults to `https://api.duffel.com`) |

---

## Tech Stack

| Layer           | Technology                                                |
| --------------- | --------------------------------------------------------- |
| UI framework    | Vue 3 (Composition API, `<script setup>`)                 |
| Language        | TypeScript (strict)                                       |
| Build tool      | Vite                                                      |
| Styling         | Tailwind CSS v4 (Vite plugin, config in CSS via `@theme`) |
| HTTP client     | `ofetch`                                                  |
| Form validation | Vuelidate                                                 |
| Dates           | Day.js                                                    |
| Icons           | `lucide-vue-next`                                         |
| Package manager | Bun                                                       |
| Lint / format   | oxlint + ESLint, Prettier                                 |

---

## Project Structure

```
/
├── api/duffel/                  # Vercel edge functions (proxy Duffel, hold the token)
│   ├── offer_requests.ts        # POST /api/duffel/offer_requests
│   └── place_suggestions.ts     # GET  /api/duffel/place_suggestions
└── src/
    ├── App.vue                  # Thin shell
    ├── views/HomeView.vue       # The single page: search + filters + results
    ├── components/
    │   ├── ui/                  # Primitives (Input, Select, DatePicker, Switch, SelectSearch…)
    │   ├── modules/             # Feature components (SearchForm, OfferList, OfferFilters, DaysStrip…)
    │   └── shared/              # State components (StateEmpty, StateError, ListSkeleton)
    ├── composables/             # Stateful logic (useFlightSearch, usePlaceSuggestions, useDebounce, useSearchUrlSync)
    ├── network/                 # The only place HTTP requests are made
    ├── utils/                   # Pure functions (payload builders, offer mappers, formatters)
    └── types/                   # Duffel wire types + app view-model types
```

Imports use the `@` alias mapping to `src/`.

---

## Technical Decisions

### CORS — a serverless proxy

Duffel blocks direct browser requests (CORS), and the API token must never reach the client. Both problems are solved by the same approach: a small **Vercel edge function per endpoint** under `api/duffel/`. The browser calls `/api/duffel/...` on its own origin (no CORS), and the function attaches `DUFFEL_TOKEN` server-side and forwards the request.

There is one file per endpoint (`offer_requests`, `place_suggestions`) rather than a single catch-all route. This makes the allow-list **structural** — the only routes that exist are the ones the app uses, so the deployed URL can't be abused as an open relay for the token. Each function also enforces its own method (POST for offers, GET for suggestions).

In development, Vite proxies `/api/*` to the deployed functions, so local dev has production parity without a local token.

### State management — composables, not Pinia

Search state lives in a composable (`useFlightSearch`) whose refs are declared at **module level**, above the exported function. Every component that calls `useFlightSearch()` shares the same state — `SearchForm` triggers the search, `HomeView` reads the results — so it behaves as a singleton store without a store library. For a single page with one data flow, Pinia would add a dependency without adding anything. I'd introduce it the moment a second view needed to own this state.

By contrast, `usePlaceSuggestions` holds its state **inside** the function, so each autocomplete field gets an independent instance. That module-level vs function-level distinction is the deliberate rule for where state lives.

Exposed refs are wrapped in `readonly()` so only the composable can mutate them — data flow stays one-directional.

### Async handling

I implemented them by hand rather than reaching for a data-fetching library:

- **Race conditions:** each search aborts the previous in-flight request via `AbortController`; an aborted request is discarded and never writes to state (`if (signal.aborted) return`), so a slow older response can't overwrite a newer one.
- **Explicit states:** the UI renders distinct loading, success, empty (valid search, no results), and error states rather than a single loading boolean.
- **Autocomplete** debounces input (300ms) before hitting the network and uses the same abort pattern for its lookups.

The composable intentionally mirrors TanStack Query's shape (`status`, `isPending`, `isError`, `refetch`). In production I'd use TanStack Query itself; here the point was to show the mechanics.

### TypeScript & the type boundary

TypeScript is used throughout. `src/types/` holds two sets of types: **Duffel wire shapes** in `snake_case` mirroring the API, and **app view-models** in `camelCase` used by the UI. Pure mappers in `src/utils/flight.ts` (`mapOffer`, `buildSlices`, `buildPassengers`, `toPlaceSuggestion`) convert between them, so raw Duffel shapes never leak into templates. If the API changes, the mappers are the only thing that changes.

### Persistence

Search criteria are serialised into the URL query string (`useSearchUrlSync`, via `history.replaceState`). On load, criteria are read back from the URL and the search re-runs — so a reload restores the current search and its results, and searches are shareable/bookmarkable. I persist criteria rather than the offers themselves, since offers are large and go stale; re-fetching on load is the correct behaviour.

---

## What I skipped, and why

- **Airline filter** (bonus) — skipped to keep the filter set focused on the required stops + price. It would be a straightforward addition to the existing `computed` filter chain.
- **Sort/filter by departure time** (bonus) — skipped for the same reason; the sort is a strategy map, so it's a small addition.
  **Debounced airport autocomplete** (a listed bonus) _is_ implemented, backed by the place-suggestions endpoint.

---

## Data Flow

```
User fills SearchForm
  → Vuelidate validates
  → useFlightSearch().search(params)
    → buildSlices() + buildPassengers() build the payload
    → network layer POSTs /api/duffel/offer_requests
      → Vite proxy → Vercel edge function → Duffel (with token)
    → raw offers mapped via mapOffer() into typed FlightOffer[]
  → HomeView computes visibleOffers (filtered + sorted)
  → OfferList renders each offer; expanding one shows segments, layovers, fare detail
```

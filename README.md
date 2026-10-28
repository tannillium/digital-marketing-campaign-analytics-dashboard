# Marketing Analytics Dashboard

A professional, multi-page dashboard for exploring campaign and keyword performance. It uses React, Vite, React Router, and Recharts on the frontend, with FastAPI, SQLAlchemy, and SQLite by default on the backend. PostgreSQL can be selected by changing `DATABASE_URL`; no database code changes are needed.

The included records are generated sample data. This project does not connect to company databases, advertising platforms, or Medusa.

## Pages

- **Overview**: reporting KPIs, daily spend and conversions, top campaign spend, conversions by channel.
- **Performance**: selectable daily metric chart, campaign comparisons, CPL and ROAS charts, sortable campaign metrics.
- **Channels**: spend, conversions, CPL charts, and a sortable channel table.
- **Campaigns**: search, channel and status filters, create/edit/delete, budget pacing, and campaign detail trends.
- **Keywords**: search, match-type and campaign filters, create/delete, CTR and conversion rates.
- **Insights**: top keyword conversion rates with a click threshold, clicks/conversions scatter chart, CTR by match type, rule-based highlights.
- **Reports**: filtered CSV previews and exports for campaigns, keywords, and daily campaign metrics.
- **Metric definitions**: calculation definitions and zero-denominator behavior.

All analytics pages share a persisted date-range selector with 7, 30, 90-day presets and custom dates. KPI cards can compare the selected range to the immediately preceding range of equal length.

## Run locally

Requirements: Python 3.9+ and Node.js 20.19+ (or 22.12+).

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
npm install
```

Seed the local SQLite database with twelve campaigns, sixty keywords, and ninety days of daily sample metrics:

```bash
python3 -m backend.app.seed_cli
```

Start the API and frontend in separate terminals:

```bash
uvicorn backend.app.main:app --reload --port 8000
```

```bash
npm run dev
```

Open http://localhost:5173. The Vite development server proxies `/api` calls to FastAPI at port 8000. The API also serves the built frontend at http://localhost:8000 after `npm run build`.

To build and run the API, frontend, and persistent SQLite volume with Docker Compose:

```bash
docker compose up --build
```

Then open http://localhost:8000.

## Configuration

Copy either `.env.example` to `.env` at the project root or `backend/.env.example` to `backend/.env` for local configuration. `.env` files are ignored by Git.

| Variable | Default | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | `sqlite:///./marketing_analytics.db` | SQLAlchemy database URL. Set a PostgreSQL URL to use PostgreSQL. |
| `FRONTEND_ORIGIN` | `http://localhost:5173` | The only allowed cross-origin frontend origin. |
| `LOG_LEVEL` | `INFO` | Python logging level. |

SQLite is the default and needs no credentials. Do not put production credentials in this repository. Company API keys and databases are intentionally not used. The browser fallback stores generated sample data locally and displays an offline notice when the API cannot be reached.

## API

- `GET/POST /api/campaigns`, `GET/PUT/DELETE /api/campaigns/{id}`
- `GET/POST /api/keywords`, `PUT/DELETE /api/keywords/{id}`
- `GET /api/analytics/summary?start=YYYY-MM-DD&end=YYYY-MM-DD&compare=true`
- `GET /api/analytics/trends?start=&end=&campaign_id=`
- `GET /api/analytics/channels?start=&end=`
- `GET /api/analytics/campaigns?start=&end=`
- `GET /api/analytics/keywords?start=&end=&min_clicks=`
- `GET /api/reports/campaigns.csv`, `/api/reports/keywords.csv`, `/api/reports/daily-metrics.csv`
- `POST /api/metrics/import` (CSV with `campaign_id,date,impressions,clicks,spend,conversions,revenue` columns)

Invalid imports return row-level errors and do not import partial data. FastAPI validation errors use a consistent JSON response.

## Project structure

```text
frontend/src/
  api/          API client and offline fallback
  components/   Shared layout, tables, filters, cards, and states
  context/      Persisted reporting range and connection state
  pages/        Overview, performance, channels, campaigns, keywords, insights, reports
  styles/       Single global stylesheet
  utils/        Metrics and browser sample-data helpers
backend/app/
  routers/      Campaign, keyword, analytics, and report endpoints
  services/     Metric calculations and connector stubs
  models.py     Campaign and daily metric SQLAlchemy models
  seed.py       Sample data generator
```

## Metric definitions

- Spend: sum of daily cost in account currency.
- Impressions: number of ad displays; clicks: number of ad clicks.
- One recorded conversion event counts as one lead (`LEADS_PER_CONVERSION` in `backend/app/services/metrics.py`, currently `1`).
- CTR = clicks / impressions; CPC = spend / clicks.
- Conversion rate = conversions / clicks; CPL = spend / conversions.
- ROAS = revenue / spend.
- Ratios guard against zero denominators and display as `n/a` when they cannot be calculated.

## Checks

```bash
python3 -m pytest backend/tests
npm run build
```

## Next steps

- Add approved real data sources through server-side connector implementations in `backend/app/services/connectors`.
- Add authentication and role-based access before using the app with company data.
- Add scheduled exports and report delivery.
- Configure database backups and retention.
- Deploy the frontend/API and database with environment-specific secrets and monitoring.
- TODO: Consider Medusa only if commerce catalog or order data becomes part of the reporting requirements; no Medusa connection is included in this version.

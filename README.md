# PercentagePear

A complete, interactive student academic dashboard and grade simulator inspired by Grademelon workflows.

**Guest mode works fully offline** with realistic fictional data from *PercentagePear Demo High School*.  
StudentVUE (MCPS) integration is scaffolded but not live-verified in this environment.

## Features implemented

- **Guest mode** – no account, no credentials; populated demo gradebook
- **Interactive gradebook** – add / edit / delete hypothetical assignments; instant recalculation
- **Original vs projected grades** with delta display
- **Weighted-category and total-points** calculation engine
- **Target-grade calculator**
- **Scenarios** – create, switch, duplicate, delete; persisted in `localStorage`
- **Dashboard**, **Assignments**, **Schedule**, **Attendance**, **Documents**, **Analytics**, **Settings**
- **Light / dark theme**
- **Responsive layout** with sidebar + mobile drawer
- **Unit tests** for the grade engine (`vitest`)

## Quick start

```bash
cd percentagepear
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).  
Click **Continue as Guest** to use the full simulator.

```bash
npm test          # run grade-engine unit tests
npm run build     # production build
```

## Architecture

| Layer | Location |
|-------|----------|
| Grade calculation engine | `src/engine/gradeCalculator.ts` |
| Demo fixtures | `src/data/demoData.ts` |
| State (Pinia) | `src/stores/appStore.ts` |
| Types | `src/types/index.ts` |
| Views | `src/views/*` |

Official / demo / simulation data are kept separate. Hypothetical changes never mutate the baseline assignment list permanently and are never sent to any remote StudentVUE API.

## StudentVUE / MCPS research notes

- Official portal: `https://md-mcps-psv.edupoint.com/`
- Open-source candidates evaluated:
  - [StudentVue.js](https://github.com/StudentVue/StudentVue.js) (MIT) – SOAP client
  - [StudentVue.py](https://github.com/StudentVue/StudentVue.py)
  - [StudentVue/docs](https://github.com/StudentVue/docs) – SOAP + newer JSON mobile API notes
  - Community apps (grade-melon, bettervue) reverse-engineer the same public endpoints
- Newer Edupoint mobile apps use a JSON API with Bearer tokens in addition to legacy SOAP.
- **This build does not claim a working live MCPS login.** Real credentials and a verified client against the current Synergy environment are required before enabling production connection. The Connect page documents the limitation and routes users to Guest mode.

## Security & privacy

- No credentials are hard-coded or committed.
- Guest scenarios live only in browser `localStorage`.
- Simulated assignment edits stay local; they are never POSTed to StudentVUE.

## License

MIT (application code). StudentVUE / Edupoint / Synergy are trademarks of their respective owners. PercentagePear is an independent educational project and is not affiliated with MCPS or Edupoint.

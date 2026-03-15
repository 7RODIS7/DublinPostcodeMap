# DublinPostcodeMap

Interactive map of Dublin postal areas for comparing neighborhoods, sharing local references, and discussing where to live.

The app combines:
- classic Dublin postal districts such as `D1-D24` and `D6W`
- nearby suburban Eircode routing key areas such as `A94`, `A96`, `K36`
- a low-noise Leaflet map with adjustable polygon opacity
- sidebar navigation for districts, neighborhoods, streets, and other local places
- starter district ratings, lifestyle tags, and transport overlays

## Features
- Transparent district overlays that keep the basemap readable
- Toggleable district labels directly on the map
- Sidebar search, grade filters, lifestyle filters, and sorting
- Selection panel with summary, metrics, tags, and quick Google Maps handoff
- Transport overlays for rail, Luas, main bus corridors, and planned MetroLink
- Static local data loading with no paid map API dependency

## Stack
- React
- TypeScript
- Vite
- Leaflet + react-leaflet
- Node.js data prep scripts

## Local Development
```bash
npm install
npm run dev
```

Windows launch helpers:

```text
start-dev.cmd
start-prod.cmd
```

Build the production bundle:

```bash
npm run build
```

## Data Refresh
Postal areas, transport, and generated green-space scores are prepared offline and committed as static app data.

Refresh them when needed:

```bash
npm run fetch:districts
npm run fetch:transport
npm run fetch:green
```

Optional validations:

```bash
npm run validate:transport
npm run validate:subareas
```

## Testing
```bash
npm run test:e2e
```

Playwright covers the main user flows:
- loading the app
- selecting districts
- hiding and reopening the sidebar
- toggling labels and transport overlays
- filtering by grade and lifestyle tags
- opening Google Maps handoff links

## GitHub Pages
This project is a static Vite app and can be published directly on GitHub Pages.

The repository includes:

```text
.github/workflows/deploy-pages.yml
```

Setup steps:
1. Push the project to the `main` branch.
2. Open `Settings -> Pages` in GitHub.
3. Choose `Source -> GitHub Actions`.
4. GitHub will build the app and publish the generated `dist` output.

You do not need to point Pages at a specific `index.html` file. The workflow uploads the built site with `dist/index.html` at the root of the published artifact.

## Notes
- The app loads postal geometry from static files in `public/data`.
- `A/K` routing key boundaries are practical guide areas rather than strict official An Post polygons.
- `Green` scores are generated from public-access OSM green and outdoor spaces and try to avoid counting private club land as a benefit.
- Standard OSM tiles are fine for a low-traffic shared project. If the site grows, consider a more robust tile setup.

## Project Structure
```text
public/
  data/
    dublin-postal-areas.geojson
    dublin-transport.geojson

scripts/
  fetch-dublin-postal.js
  fetch-dublin-transport.js
  fetch-dublin-green.js
  validate-subareas.js
  validate-transport.js

src/
  components/
  data/
  lib/
  styles/
```

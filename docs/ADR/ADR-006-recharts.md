# ADR-006: Recharts for Data Visualization

| Field | Value |
|-------|-------|
| **Status** | Accepted |
| **Date** | 2026-02-09 |
| **Decision Makers** | Solutions Architect |
| **References** | [FRONTEND_ARCHITECTURE.md](../plans/FRONTEND_ARCHITECTURE.md), [PLAN.md](../plans/PLAN.md) |

---

## Context

Aura's dashboard needs interactive charts:
1. **Donut chart** — spending breakdown by category
2. **Progress bars** — budget vs actual per category
3. **Bar chart** — daily spending over time (V2)

The charting library must work with React 19 and integrate with shadcn/ui's design system.

---

## Decision

**Use Recharts for all data visualization, leveraging shadcn/ui's native `chart` component wrapper.**

---

## Options Considered

### Option A: Recharts — **CHOSEN**

**Pros:**
- **shadcn/ui integration** — shadcn provides a `chart.tsx` wrapper that applies design tokens to Recharts
- **React-native** — declarative JSX API (`<PieChart>`, `<Cell>`, `<Tooltip>`)
- **Lightweight** — ~40KB gzipped (smallest full-featured chart library)
- **Responsive** — `<ResponsiveContainer>` handles resize automatically
- **Well-documented** — extensive examples for every chart type
- **D3 under the hood** — battle-tested rendering

**Cons:**
- Limited to SVG rendering — may struggle with 10,000+ data points (not an issue for expense data)
- Less "modern" look compared to Chart.js or Nivo defaults (customizable with shadcn tokens)
- No built-in animation physics (simple CSS transitions only)

### Option B: Tremor Charts

**Pros:**
- Purpose-built for dashboards
- Pre-styled with Tailwind
- Simple API for common chart types

**Cons:**
- Recharts under the hood — adds an abstraction layer without added value
- Less customizable than raw Recharts
- Smaller community

### Option C: Chart.js (react-chartjs-2)

**Pros:**
- Canvas rendering — better performance for large datasets
- Huge community and plugin ecosystem

**Cons:**
- Canvas-based — harder to style with Tailwind/CSS
- `react-chartjs-2` wrapper can lag behind Chart.js updates
- No native shadcn/ui integration
- Extra bundle weight for canvas rendering engine

### Option D: Nivo

**Pros:**
- Beautiful default styling
- All chart types supported (chord, sunburst, etc.)
- Both SVG and Canvas renderers

**Cons:**
- Heavier bundle (~80KB gzipped)
- More complex API
- No shadcn/ui integration
- Overkill for 3 chart types

---

## Consequences

### Positive
- Zero extra dependencies beyond what shadcn/ui already provides
- Consistent design tokens between UI components and charts
- Simple, declarative API reduces development time
- Donut chart with center label is ~30 lines of JSX

### Negative
- Must use shadcn's `chart.tsx` wrapper for consistent theming (minor additional setup)
- Advanced chart types (heatmaps, treemaps) require more custom code

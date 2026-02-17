# MM Slot Priorities

A rule-based priority management tool for meeting slot scheduling. Built for the Grip platform, this tool allows event organizers to define priority rules that control which time slots get the best-ranked meetings.

## Features

- **Rule Builder** — Create priority rules based on four condition types:
  - **Day is...** — Target all slots on a specific day
  - **Day + Start time are...** — Target slots on a specific day and time
  - **Start time is between...** — Target slots within a time range across all or specific days
  - **Location on day...** — Target slots at a specific location
- **Live Preview** — Real-time sidebar showing how rules affect slot priorities with stats breakdown
- **Drag & Drop** — Reorder rules by dragging with grip handles
- **Inline Editing** — Click any rule to expand and edit in place
- **Priority System** — Values from 1 (highest) to 100 (lowest); rules are evaluated top to bottom, first match wins

## Tech Stack

- React 19 + Vite
- Single-file component with inline styles
- Grip design system (Lato font, custom color palette)
- Deployed on Vercel

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Build

```bash
npm run build
```

## Deployment

Automatically deployed to Vercel on push. Live at [mm-slot-priorities.vercel.app](https://mm-slot-priorities.vercel.app).

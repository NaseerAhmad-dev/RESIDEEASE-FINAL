# ResideEase — Hostel & Mess Management Platform

A production-grade Angular 17 SaaS application for hostel and mess management.
Themed after Hostaway's clean, warm light-mode aesthetic.

## What's included

### Admin module (new)
- **Sidebar layout** — collapsible nav with brand, icons, badges, user avatar
- **Overview dashboard** — KPI cards, check-in/check-out panels, room occupancy bars, mess stats, recent students
- **Add student** — 4-step onboarding wizard (info → room → mess → confirm) embedded inside the admin shell
- **Stub pages** — Students, Rooms, Mess, Payments, Notices, Settings (ready to build out)

### Onboarding flow (updated theme)
- All 5 steps rethemed from dark to the warm light SaaS palette
- Welcome → Profile → Room Selection → Mess Plan → Confirmation

## Tech stack
- Angular 17 standalone components + lazy loading
- Angular Reactive Forms with full validation
- Angular Router with nested routes
- SCSS with CSS custom properties (light theme)
- Plus Jakarta Sans + Instrument Serif fonts

## Color system

| Variable | Value | Usage |
|---|---|---|
| `--brand` | `#0ab4a8` | Primary CTA, active nav, progress |
| `--brand-dark` | `#089e93` | Hover states, text on light bg |
| `--brand-light` | `#e6faf9` | Selected states, banners |
| `--accent` | `#f97316` | Badges, notification dots |
| `--bg-page` | `#f5f4f0` | Page background (warm off-white) |
| `--bg-card` | `#ffffff` | Cards, sidebar, topbar |

## Routes

| Path | Component |
|---|---|
| `/admin/dashboard` | Overview dashboard |
| `/admin/students` | Students list |
| `/admin/students/add` | Add student (4-step wizard) |
| `/admin/rooms` | Rooms management |
| `/admin/mess` | Mess management |
| `/admin/payments` | Payments |
| `/admin/notices` | Notices |
| `/admin/settings` | Settings |
| `/onboarding/welcome` | Student onboarding welcome |
| `/onboarding/user-details` | Student profile form |
| `/onboarding/room-selection` | Room chooser |
| `/onboarding/mess-selection` | Meal plan |
| `/onboarding/confirmation` | Review & submit |

## Getting started

```bash
npm install
npm start
# Opens at http://localhost:4200 → redirects to /admin/dashboard
```

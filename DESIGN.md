# MRP Design System

Design decisions for the LA 2028 Media Registration Portal admin UI.
Update this file when a new pattern is introduced or an existing one changes.

---

## Color Palette

| Token          | Hex       | Usage                                      |
|----------------|-----------|--------------------------------------------|
| `brand-blue`   | `#0057A8` | IOC brand primary — headers, active tabs, primary CTAs, NOC admin accent |
| `brand-dark`   | `#004690` | Darker blue — previously used for sub-nav backgrounds |
| `ocog-orange`  | `orange-500` (`#f97316`) | OCOG admin accent — hover borders, badges, active milestone dot |
| `if-purple`    | `purple-600` (`#7c3aed`) | IF admin accent — ENR card icons |
| `ioc-green`    | `green-600` (`#16a34a`) | IOC admin accent — approved states |
| `pbn-indigo`   | `indigo-600` (`#4f46e5`) | PbN workflow icon backgrounds |
| `surface`      | `#f1f5f9` | Page background (slate-100) |
| `card`         | `white`   | Card/panel background |
| `border`       | `gray-200` | Default card border |
| `border-focus` | `brand-blue` | Active tab underline, input focus ring |

Status color conventions (consistent across all admin roles):

| State         | Background        | Text             |
|---------------|-------------------|------------------|
| Pending       | `yellow-100`      | `yellow-800`     |
| Resubmitted   | `blue-100`        | `blue-800`       |
| Approved      | `green-100`       | `green-700/800`  |
| Returned      | `orange-100`      | `orange-800`     |
| Rejected      | `red-100`         | `red-800`        |
| Draft         | `gray-100`        | `gray-600`       |
| Not started   | `gray-100`        | `gray-400`       |

---

## Typography

- **Font stack:** `Inter`, `-apple-system`, `BlinkMacSystemFont`, `sans-serif` (Tailwind default)
- **Page title:** `text-xl font-bold text-gray-900` (20px/700) — individual page h1
- **Section heading:** `text-sm font-semibold text-gray-700 uppercase tracking-wide` — card section labels
- **Card title:** `font-semibold text-gray-900 text-sm` or `text-base`
- **Body / table cell:** `text-sm text-gray-600`
- **Meta / label:** `text-xs text-gray-500`
- **Badge:** `text-xs font-semibold` or `text-xs font-medium`

---

## Spacing Scale

- **Page padding:** `p-6` (24px) on content areas
- **Max content width:** `max-w-5xl` for NOC/OCOG, `max-w-6xl` for IOC (wider tables)
- **Card padding:** `p-5` or `p-6`
- **Card gap (vertical stack):** `gap-5` (20px)
- **Card border radius:** `rounded-xl` (12px) for home cards, `rounded-lg` (8px) for inner panels
- **Card border width:** `border-2` on home/portal cards, `border` on inner panels

---

## Component Patterns

### AppHeader (shared)
Blue `#0057A8` header bar, full width. Contains:
- Left: rings logo mark + "Media Registration Portal" + "LA 2028"
- Right: display name (hidden on mobile), role badge (rounded pill), sign-out button

File: `src/components/AppHeader.tsx`

### Nav Tabs (per-role)
White bar with bottom border. Active tab: `border-[#0057A8] text-[#0057A8]`. Inactive: `border-transparent text-gray-500`.
Always include `aria-current="page"` on the active link.

Files: `NocNavTabs.tsx`, `OcogNavTabs.tsx`, `ioc/nav.tsx`

### Workflow Cards (home dashboards)
`bg-white rounded-xl border-2 border-gray-200 hover:border-[role-color] p-6 transition-all hover:shadow-sm`
Structure: icon (colored square, 8×8) + title + description left, status badge right, stats row below.

### Status Badges
`px-3 py-1 rounded-full text-sm font-medium` (or `font-bold` for action-required).
Use the status color table above consistently.

### Attention Banner
`p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-900`
Show only when user has actionable items. Message: `⚠ [Count] [things] need your action.`

### Role Portal Cards
`bg-white rounded-xl border-2 [role-color] p-5 hover:shadow-md transition-all group`
Distinct SVG icon per role (flag/NOC, buildings/OCOG, trophy/IF, globe/IOC) in a `bg-[role]-50` rounded square.

### Phase Timeline (home dashboards)
`bg-white rounded-xl border border-gray-200 p-5` at the bottom of home pages.
Dot states: `bg-green-500` (done), `bg-[#0057A8] ring-2 ring-blue-200` (active), `bg-gray-200` (upcoming).

### Empty States
`bg-white rounded-lg border border-gray-200 p-8 text-center text-sm text-gray-400`
Always explain why it's empty and what the user should do first.
Example: "No approved applications yet. Approve applications in the EoI Queue first."

### Forms / Inputs
`border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0057A8] focus:border-transparent`

### Primary Button
`bg-[#0057A8] text-white text-sm font-semibold rounded px-4 py-2 hover:bg-blue-800 transition-colors cursor-pointer`

### Secondary Button
`bg-white border border-gray-300 text-gray-700 text-sm font-semibold rounded px-4 py-2 hover:bg-gray-50 transition-colors cursor-pointer`

### Danger Button
`bg-red-600 text-white text-sm font-semibold rounded px-4 py-2 hover:bg-red-700 transition-colors cursor-pointer`

---

## Role Color Map

| Role       | Primary color  | Border class        | Icon bg       |
|------------|----------------|---------------------|---------------|
| NOC Admin  | `#0057A8`      | `border-[#0057A8]`  | `bg-blue-50`  |
| OCOG Admin | `orange-500`   | `border-orange-400` | `bg-orange-50`|
| IF Admin   | `purple-600`   | `border-purple-400` | `bg-purple-50`|
| IOC Admin  | `green-600`    | `border-green-400`  | `bg-green-50` |

---

## Accessibility

- `aria-current="page"` on active nav tab links (all three nav components)
- `aria-hidden="true"` on decorative SVG icons
- Status is communicated via text label in badge, not color alone
- Form inputs use `<label for="...">` with matching `id`
- Focus rings use `focus:ring-2 focus:ring-[#0057A8]`

---

## What's Not Here Yet (v1 targets)

- Responsive breakpoints — currently designed for desktop (1024px+)
- Dark mode
- Loading/skeleton states (server components handle this implicitly; add if client fetching is introduced)
- Toast notifications (currently using URL query param banners)
- IOC home page (currently redirects to EoI list — needs a home page matching NOC/OCOG pattern)

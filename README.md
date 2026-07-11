# Handoff: KnowDrive Enterprise Console

## Overview
The KnowDrive Enterprise Console is the admin surface for provisioning and governing **knowledge stores** (vector stores) across an organization: org overview, resource tables, a 6-step provisioning wizard with an agentic (MCP) layer, SSO/SCIM identity management, BYO storage connectors, Helm chart registry, governance/quotas, billing, naming policy, audit log, profile/account with security modals, and a public-status page.

## About the Design Files
The files in `site/` are **design references created in HTML** — working prototypes showing the intended look and behavior, not production code to ship directly. Your task is to **recreate these designs in the target codebase's existing environment** (React, Vue, etc.) using its established patterns and libraries. If no environment exists yet, choose the most appropriate framework and implement the designs there. That said, the prototypes are intentionally framework-free (plain HTML + one shared CSS file + small vanilla-JS files), so markup and CSS can be lifted nearly verbatim into components.

## Fidelity
**High-fidelity.** Colors, typography, spacing, copy, and interactions are final. Recreate pixel-perfectly.

## Architecture of the Prototype
- 14 standalone pages sharing `css/styles.css` (all visual tokens + components) and `js/shell.js` (topbar/sidebar behaviors shared by every page).
- Per-page `<script>` blocks add page-specific behavior (wizard state machine, connector flows, modals, filters).
- Navigation is plain `<a href>` links between pages. In a SPA, replace with client-side routes; the loading bar (see Interactions) then becomes your route-transition indicator.

## Screens / Views

| File | Screen | Purpose |
|---|---|---|
| index.html | Organization overview | KPIs, query-volume chart, health, recent activity |
| stores.html | Knowledge stores | Resource table of all stores, entry to detail/provision |
| store-detail.html | Store detail | Per-store KPIs + Indexes / Access / Activity tabs; hydrates from `?id=<store>` |
| provision.html | Provisioning wizard | 6 steps: Basics → Deployment → Capacity → Agents → Access → Review, then deploy progress → success |
| organization.html | Org & departments | Department cards w/ admins, quota bars, SCIM badges |
| sso.html | SSO & identity | IdP cards (test-connection banners), SCIM toggle, group→dept mapping table |
| connectors.html | Storage connectors | S3/GCS/Azure/VPC/on-prem cards with connect → validate → connected flow |
| helm.html | Helm charts | Repo-add command w/ copy button, 5 expandable chart cards (install cmd, values.yaml, version history) |
| governance.html | Governance | Compliance cert cards (SOC 2, HIPAA, ISO 27001, GDPR, FedRAMP), dept quota table |
| billing.html | Billing & pricing | Spend-by-dept bars, unit pricing, invoices |
| naming.html | Naming policy | `kd-{dept}-{env}-{name}` pattern block + rules list |
| audit.html | Audit log | Filterable event table (All/Provisioning/Access/Identity/Billing) |
| profile.html | Profile & account | Identity card, security rows, notifications, sessions, connected apps/tokens — with 5 modals |
| status.html | System status | status-page style: green banner, 5 components × 90-day uptime strips, past incidents |

Layout specifics (grid columns, spacing, exact copy) are in the HTML itself — each page is readable top-to-bottom and inline-commented by section.

## Shared Shell (every page)
- **Topbar (56px, white, 1px #ECE9F7 bottom border)**: logo+wordmark link → index.html; org switcher dropdown (3 orgs, persisted in `localStorage.kdcOrg`, updates all `[data-org-name]` elements); center search button opening the ⌘K palette; role switcher segmented control (Platform admin / IT-Security / Dept lead, persisted in `localStorage.kdcRole`, filters sidebar items via `data-roles` attr); avatar → profile.html.
- **Sidebar (224px, white, right border)**: 4 nav sections (Manage / Identity & infra / Govern / Account); active item = `#EFEEFC` bg + `#4B3FC4` text; bottom "All systems operational" card → status.html.
- **Command palette**: ⌘K/Ctrl-K or click search; type-ahead filtering across 3 categorized groups (Knowledge stores / Actions / Pages); Enter opens first result; Esc/backdrop closes.
- **Mobile (≤860px)**: sidebar becomes off-canvas drawer behind an injected hamburger + scrim; topbar condenses (icon-only logo/search, role switcher hidden); grids stack to 1 column; data tables scroll horizontally (`min-width:720px` rows); wizard steps wrap.

## Interactions & Behavior
- **Page-load progress bar**: on internal link click, 3px violet bar (`linear-gradient(90deg,#6C5CE7,#8E7CF0)`) grows from 0 easing toward 90% (`w += (90-w)*0.18` every 180ms) while content dims to 45%; on arrival the bar completes and content blocks fade in staggered 60ms apart (`kdFadeIn`, translateY(6px)→0, .3s). Handles bfcache via `pageshow`.
- **Provision wizard**: single-select chip groups (dept, env, region), single-select cards (target, tier), multi-select checkbox rows (SSO groups, agent capabilities), autoscale + agent toggles, live resource-ID slug `kd-{dept}-{env}-{slugified-name}`, review table assembled from state, deploy = striped animated progress bar with 4 stage messages (<25/<50/<75/≥75%), then success panel.
- **Agentic layer (wizard step 4)**: master toggle reveals MCP endpoint `mcp://agents.knowdrive.ai/{resourceId}` (dark code pill), 4 capability rows (Elasticity control, Index management, Query automation, Cost guardrails), approval mode chips (Human-in-the-loop recommended / Auto-approve within quota). Review row summarizes: "Enabled · N capabilities · human-in-the-loop".
- **Connectors**: idle → Connect reveals 2 mono inputs → "Validate & connect" shows amber spinner row 1.8s → Connected chip + meta pill "`<input>` · scoped access verified", button becomes ghost "Rotate credentials".
- **SSO**: Test connection shows green banner 3.5s ("Okta: metadata valid, assertion signed, 412 users resolvable. Round-trip 240 ms."); SCIM toggle swaps description to "Paused — grants are frozen until re-enabled."; + Add mapping appends a row.
- **Helm**: copy button (`navigator.clipboard`) flips to "✓ Copied" 1.8s; chart cards accordion (one open at a time, first open by default).
- **Audit**: chip filters show/hide rows by `data-type`.
- **Profile modals** (all close on Esc / backdrop): Edit profile (name updates header live; email locked "Managed by Okta"); Change password (validation: current required, ≥12 chars, match → success state, row reads "Last changed just now"); 2FA manage (view/hide/regenerate 8 backup codes `XXXX-XXXX`, disable → amber Disabled chip + policy warning, re-enable); Add passkey (intro → 1.5s spinner "Waiting for Touch ID…" → success, count increments); Revoke confirm (danger button, row removed on confirm).
- **Store detail**: reads `?id=`, hydrates title/chip/subtitle/KPIs from a data map; tab switching (Indexes/Access/Activity).

## State Management
- Persisted: `kdcRole`, `kdcOrg` (localStorage).
- Per-page transient state: wizard step + selections, modal open/closed, connector stage, audit filter, helm accordion, tab selection. All resettable on navigation; no server state in the prototype.
- Real implementation needs: stores list, store detail, departments/quotas, IdP status, connector status, charts registry, invoices, audit events, sessions/tokens — all shown with realistic mock data in the HTML.

## Design Tokens
Colors (CSS custom properties in styles.css `:root`):
- Ink `#15151F`, muted `#5A5A6E`, faint `#8C8C9E`, soft `#9A95B5`
- Brand violet `#6C5CE7`, dark `#4B3FC4`, bg `#EFEEFC`; page bg `#FBFAFF`; card `#fff`
- Lines `#ECE9F7` / `#F5F3FC`
- Green `#12A07A` (dark `#0E7C5F`, bg `#E7F6F1`); amber `#C9871F` (bg `#FCF3E3`); red `#C03A3A` (bg `#FBEDED`); blue `#2A6FDB` (bg `#E9F1FD`)
- Code blocks: bg `#15151F`, text `#B9AFFA` (accents `#7CE7C4`, `#F6BE4F`)

Typography:
- UI: **Plus Jakarta Sans** (400/500/600/700/800) — Google Fonts
- Code/IDs: **JetBrains Mono** (400/500/600)
- Page title 24px/800/-0.02em; card title 14px/800; body 13px/500; table cell 12.5–13px; section labels 10–11px/700 uppercase +0.07–0.1em; KPI value 25px/800

Radii: cards 14px, modals 18px, buttons 9–11px, chips 20px (pill), inputs 11px, code blocks 11px.
Shadows: modal `0 30px 80px rgba(20,10,60,.32)`; primary btn `0 6px 18px rgba(108,92,231,.28)`; dropdown `0 16px 44px rgba(20,20,50,.16)`.
Spacing: content max-width 1180px, padding 28px 32px; card padding 18–20px; grid gaps 12–14px.

## Assets
- `site/assets/logo.png` — KnowDrive logo (from the KnowDrive.ai brand system in this project).
- All icons are inline SVG (stroke-based, 2.4–2.8 stroke-width) — no icon font.

## Files
- `site/` — the complete prototype (14 HTML pages + `css/styles.css` + `js/shell.js` + `assets/logo.png`). Open `site/index.html` in a browser; everything works offline except Google Fonts.

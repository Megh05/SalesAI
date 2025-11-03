# Design Guidelines: AI-Powered Sales Automation Platform

## Design Approach

**Selected Approach**: Design System with Multi-Reference Inspiration

**Primary References**:
- **Linear**: Clean typography, minimal interface, sharp interactions
- **Notion**: Flexible layouts, hierarchy through spacing, elegant data presentation
- **HubSpot**: Professional dashboard patterns, clear data visualization

**Key Design Principles**:
1. Information density without clutter - maximize data visibility while maintaining breathing room
2. Hierarchy through typography and spacing, not decoration
3. Functional minimalism - every element serves a purpose
4. Professional polish for B2B sales teams

---

## Typography System

**Font Stack**: 
- Primary: Inter (Google Fonts) - body text, UI elements, data tables
- Monospace: JetBrains Mono (Google Fonts) - code snippets, technical data

**Type Scale**:
- Hero/Page Titles: text-4xl font-bold (36px)
- Section Headers: text-2xl font-semibold (24px)
- Card Headers: text-lg font-semibold (18px)
- Body Text: text-base font-normal (16px)
- Small Text/Meta: text-sm font-normal (14px)
- Micro Text: text-xs font-medium (12px)

**Hierarchy Rules**:
- Dashboard page titles: text-3xl with font-bold, mb-8
- Section dividers: text-xl with font-semibold, mb-6
- Card titles: text-lg with font-semibold, mb-4
- Data labels: text-sm with font-medium, uppercase tracking-wide
- Body content: text-base with leading-relaxed for readability

---

## Layout System

**Spacing Primitives**: Use Tailwind units of **2, 4, 6, 8, 12, 16**
- Micro spacing: p-2, gap-2 (8px) - tight element grouping
- Standard spacing: p-4, gap-4, mb-4 (16px) - default component padding
- Section spacing: p-6, mb-6 (24px) - card internal spacing
- Large spacing: p-8, mb-8 (32px) - page-level separation
- Extra large: p-12, mb-12 (48px) - major section breaks
- Mega spacing: p-16, mb-16 (64px) - dashboard page padding

**Grid System**:
- Dashboard Container: max-w-7xl mx-auto px-8
- Two-column layouts: grid grid-cols-12 gap-6
  - Sidebar: col-span-3
  - Main content: col-span-9
- Card grids: grid grid-cols-3 gap-4 (desktop), grid-cols-1 (mobile)
- Table layouts: w-full with fixed column widths

**Responsive Breakpoints**:
- Mobile: base (stack all columns)
- Tablet: md: (2-column layouts, simplified navigation)
- Desktop: lg: (full 3-column grids, extended sidebar)

---

## Component Library

### Navigation
**Top Navigation Bar**:
- Fixed at top, h-16, border-b with subtle shadow
- Logo left (h-8), navigation center, user profile right
- Search bar: w-96 with icon, rounded-lg, subtle border
- Icons: 20px from Heroicons (outline style)

**Sidebar Navigation**:
- w-64, fixed left, full height, border-r
- Section groups with uppercase text-xs labels
- Nav items: py-2 px-4, rounded-md hover states
- Active state: font-semibold with left border accent
- Collapsible: w-16 collapsed showing only icons

### Dashboard Cards
**Standard Card Pattern**:
- rounded-lg border with subtle shadow (shadow-sm)
- Padding: p-6
- Header: flex justify-between items-center mb-4
- Title: text-lg font-semibold
- Action button: text-sm with icon
- Content area: space-y-4

**Stat Cards** (for metrics):
- Compact: p-4
- Large number: text-3xl font-bold
- Label: text-sm with text-muted
- Trend indicator: inline-flex items-center gap-1 with arrow icon

### Data Tables
**Table Structure**:
- w-full with divide-y
- Header: bg-subtle, font-medium text-sm, py-3 px-4
- Rows: hover:bg-subtle transition, py-3 px-4
- Row actions: opacity-0 group-hover:opacity-100 transition
- Checkbox column: w-12
- Status badges: inline-flex px-2 py-1 rounded-full text-xs font-medium

**Smart Inbox Table** (specific):
- Email preview: truncate max-w-md
- AI summary badge: inline-flex items-center gap-1
- Timestamp: text-sm text-muted
- Confidence score: w-16 with mini progress bar

### Forms & Inputs
**Input Fields**:
- Standard: h-10, px-4, rounded-md, border
- Focus: ring-2 ring-offset-2 transition
- Label: text-sm font-medium mb-2 block
- Helper text: text-xs text-muted mt-1

**Buttons**:
- Primary: h-10 px-6 rounded-md font-medium
- Secondary: h-10 px-6 rounded-md border font-medium
- Icon buttons: h-10 w-10 rounded-md flex items-center justify-center
- Button groups: inline-flex rounded-md divide-x

### AI-Specific Components
**AI Summary Card**:
- Distinct visual treatment with subtle border-l-4
- Icon: 16px sparkle/stars icon top-right
- Summary text: text-sm leading-relaxed
- Confidence score: flex items-center gap-2, text-xs
- Action suggestions: mt-4, flex gap-2, text-sm buttons

**AI Copilot Panel**:
- Fixed right sidebar: w-96, border-l, full height
- Chat interface: flex flex-col h-full
- Messages: space-y-4, p-4, overflow-y-auto
- Input: sticky bottom-0, p-4, border-t
- AI avatar: h-8 w-8 rounded-full with gradient

**Workflow Builder Canvas**:
- Full viewport minus header: h-[calc(100vh-4rem)]
- Toolbar left: w-64, border-r, p-4
- Canvas center: flex-1, bg-subtle with grid pattern
- Properties right: w-80, border-l, p-4
- Node cards: rounded-lg shadow-md, p-4, min-w-[200px]

### Relationship Graph View
**Graph Container**:
- Full viewport canvas with zoom controls
- Toolbar: absolute top-4 right-4, flex gap-2
- Legend: absolute bottom-4 left-4, rounded-lg p-4 bg-surface shadow
- Node popup: absolute positioned, rounded-lg shadow-lg p-6, max-w-md

### Overlays & Modals
**Modal Structure**:
- Backdrop: fixed inset-0 bg-black/50
- Content: max-w-2xl mx-auto mt-24 rounded-xl shadow-2xl
- Header: p-6 border-b, flex justify-between items-center
- Body: p-6, max-h-[60vh] overflow-y-auto
- Footer: p-6 border-t, flex justify-end gap-3

**Toast Notifications**:
- Fixed bottom-4 right-4, max-w-md
- rounded-lg shadow-lg p-4
- Icon left: h-5 w-5
- Close button: absolute top-2 right-2

---

## Animations

**Minimal Animation Philosophy**: Use sparingly for functional feedback only

**Approved Animations**:
- Transitions: transition-colors duration-200 (hover states)
- Modal/Drawer entry: transition-opacity duration-300
- Loading spinners: animate-spin (16px icons)
- Real-time updates: subtle pulse animation on new items

**Forbidden**:
- Page transitions
- Scroll-triggered animations
- Decorative parallax effects
- Auto-playing carousels

---

## Images

**Logo & Brand Assets**:
- Platform logo: SVG, h-8, positioned top-left in navigation
- Company/contact avatars: h-10 w-10 rounded-full with fallback initials

**Illustrations** (use sparingly):
- Empty states only: max-w-xs mx-auto, simple line illustrations
- Error pages: max-w-md centered with clear messaging

**No hero images needed** - this is a dashboard application focused on data and functionality, not marketing content.

---

## Accessibility Implementation

- All interactive elements: min-h-10 (touch targets)
- Focus indicators: ring-2 ring-offset-2 on all focusable elements
- Skip links: sr-only positioned for keyboard navigation
- ARIA labels: comprehensive labeling for screen readers
- Form validation: inline error messages with text-sm text-destructive
- Icon-only buttons: always include aria-label attributes
- Keyboard shortcuts: document and implement for power users (Cmd+K for search, etc.)
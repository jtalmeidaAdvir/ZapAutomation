# Design Guidelines: WhatsApp Automation Dashboard

## Design Approach

**Selected Approach:** Design System - Material Design inspired with Linear's clean aesthetic
**Justification:** This is a utility-focused admin dashboard requiring clear information hierarchy, efficient workflows, and intuitive data management. The interface prioritizes functionality over visual flair while maintaining modern, professional aesthetics.

**Key Design Principles:**
- Clarity and efficiency in all interactions
- Clear visual hierarchy for status indicators and critical actions
- Scannable information architecture
- Immediate feedback for all system states

---

## Core Design Elements

### A. Typography

**Font Family:** Inter via Google Fonts CDN
- **Headings (H1):** 2rem (32px), font-semibold - Dashboard title, main sections
- **Headings (H2):** 1.5rem (24px), font-semibold - Section headers, card titles
- **Headings (H3):** 1.125rem (18px), font-medium - Subsections, card headers
- **Body Text:** 0.875rem (14px), font-normal - Table content, descriptions, labels
- **Small Text:** 0.75rem (12px), font-normal - Timestamps, helper text, badges
- **Monospace (Status/Numbers):** 'JetBrains Mono' via Google Fonts - Phone numbers, codes

### B. Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 6, and 8
- **Micro spacing:** p-2, gap-2 - Icon padding, tight groupings
- **Component spacing:** p-4, gap-4, m-4 - Card padding, form fields
- **Section spacing:** p-6, gap-6 - Between related groups
- **Major spacing:** p-8, gap-8, mb-8 - Section separators, page margins

**Grid Structure:**
- **Container:** max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
- **Dashboard Layout:** Two-column on desktop (sidebar + main), single column mobile
- **Content Areas:** Single column with max-w-4xl for focused content sections

### C. Component Library

#### Navigation & Header
**Top Navigation Bar:**
- Full-width, sticky header with shadow
- Left: Logo/App name (H2 weight)
- Center: Connection status badge with icon (Material Icons: check_circle/error)
- Right: User actions/settings icon button
- Height: h-16, px-6

#### Core Components

**1. QR Code Connection Card**
- Prominent placement at dashboard top when disconnected
- Centered container, max-w-md
- Card with elevated shadow
- QR code image: w-64 h-64, centered
- Instructions below QR: text-sm
- Loading state with animated spinner
- Success state transitions smoothly to status dashboard

**2. Connection Status Panel**
- Horizontal card layout, full-width
- Grid with 3-4 metric cards (grid-cols-1 md:grid-cols-3)
- Each metric: Icon (Material Icons) + Label + Value
- Metrics: Connection Status, Authorized Numbers Count, Messages Today, Last Activity
- Status indicators using badge components (pill shape, px-4 py-2)

**3. Authorized Numbers Management**
- Section with H2 header + "Add Number" action button (aligned right)
- Table layout for desktop (w-full):
  - Columns: Phone Number (monospace), Name/Label, Date Added, Actions
  - Row height: h-14, borders between rows
  - Action buttons: Edit (icon), Delete (icon-only, destructive)
- Card layout for mobile: Stacked cards with spacing gap-4
- Add Number Form: Modal overlay with form fields
  - Input fields: h-12, px-4
  - Two fields: Phone Number (with format helper), Label/Name
  - Actions: Cancel (ghost) + Add (primary) buttons

**4. Message Log/History**
- Scrollable container with max-h-96
- Message items as cards: rounded-lg, p-4, mb-2
- Message structure:
  - Top row: Phone number (monospace, font-medium) + Timestamp (text-xs, right-aligned)
  - Message content: text-sm, mt-2
  - Direction indicator: Icon left (Material Icons: arrow_downward/arrow_upward)
- Alternating subtle styling for sent vs received
- Filter dropdown above list (right-aligned): Filter by number, Filter by date

**5. Form Inputs**
- Consistent height: h-12
- Border radius: rounded-lg
- Padding: px-4
- Label above input: mb-2, text-sm, font-medium
- Focus state: ring-2 offset visual indicator
- Error state: red accent with error message below (text-xs)

**6. Buttons**
- **Primary:** px-6 py-3, rounded-lg, font-medium
- **Secondary/Ghost:** px-6 py-3, rounded-lg, font-medium, border
- **Icon-only:** p-2, rounded-md, icon centered
- Height consistency: h-12 for standard buttons
- Hover states: Native component behavior

**7. Modal/Overlay**
- Backdrop: Semi-transparent overlay
- Modal container: max-w-md, centered, rounded-xl, p-6
- Header: H3 + Close button (icon, top-right)
- Content area: py-4
- Footer actions: Right-aligned button group, gap-2

#### Icons
**Library:** Material Icons via CDN
- Status: check_circle, error, pending
- Actions: add, delete, edit, settings
- Messages: arrow_upward, arrow_downward, send
- QR: qr_code_scanner
- Size: text-xl (20px) for inline, text-2xl (24px) for prominent

---

## Page Layout Structure

### Dashboard View (Connected State)
1. **Top Navigation** (h-16)
2. **Connection Status Panel** (py-8)
3. **Two-Column Layout** (gap-8, py-8):
   - Left Column (2/3 width): Authorized Numbers Management
   - Right Column (1/3 width): Message Log sidebar
4. Mobile: Stacks to single column with tabs to switch views

### Initial Connection View (Disconnected State)
1. **Top Navigation** (minimal, just branding)
2. **Centered QR Code Card** (py-16)
   - Vertical stack: Icon, H2 heading, QR Code, Instructions
   - All centered, max-w-md container

---

## Responsive Behavior

**Breakpoints:**
- Mobile: Base (< 640px) - Single column, stacked cards
- Tablet: md (640px+) - Two columns where applicable
- Desktop: lg (1024px+) - Full multi-column layouts

**Key Adaptations:**
- Table → Card list on mobile
- Sidebar → Bottom tabs or accordion sections
- Horizontal status cards → Vertical stack on mobile
- Modal full-screen on mobile, centered card on desktop

---

## Animations & Interactions

**Minimal, Purposeful Animations:**
- QR code loading: Subtle pulse animation
- Connection status change: Smooth badge fade transition (200ms)
- Number addition: Slide-in animation for new table row (300ms)
- Modal: Fade-in backdrop + scale-up modal (200ms)
- Hover states: Native button/link behaviors only

---

## Images

No hero images required for this application. The only visual element is the functional QR code image, which is dynamically generated and displayed in the connection card.
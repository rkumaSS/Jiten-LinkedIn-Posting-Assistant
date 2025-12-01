# LinkedIn Posting Assistant - Design Guidelines

## Design Approach
**System**: Linear-inspired productivity design with Notion's content focus
**Rationale**: Utility-focused productivity tool requiring efficiency, clear information hierarchy, and content readability. Drawing from modern SaaS productivity applications that prioritize workflow over decoration.

## Core Design Principles
1. **Content-First**: Prioritize readability of scraped articles and generated posts
2. **Workflow Efficiency**: Minimize clicks between content discovery and publishing
3. **Visual Clarity**: Clean separation between content sources, drafts, and published posts
4. **Focused Attention**: Highlight AI-generated content that needs user review

---

## Typography
**Font Stack**: 
- Primary: Inter (headings, UI labels) - weights 400, 500, 600
- Content: Source Sans Pro (body text, post content) - weights 400, 600

**Hierarchy**:
- Page Titles: text-2xl, font-semibold
- Section Headers: text-lg, font-medium
- Card Titles: text-base, font-medium
- Body Text: text-sm, font-normal
- Metadata/Labels: text-xs, uppercase tracking-wide

---

## Layout System
**Spacing Primitives**: Use Tailwind units of 3, 4, 6, and 8 consistently
- Component padding: p-4 to p-6
- Section spacing: space-y-6 to space-y-8
- Card gaps: gap-4
- Inner content: p-3 to p-4

**Grid Structure**:
- Dashboard: Two-column (sidebar + main content area)
- Sidebar: Fixed width 280px
- Content cards: Grid of 1-2 columns depending on content density
- Form/editor areas: Single column, max-w-3xl

---

## Component Library

### Navigation
**Sidebar Navigation** (left, fixed):
- Logo/branding at top
- Main sections: Dashboard, Content Scout, AI Drafts, Published, Settings
- Each item with icon + label
- Active state with subtle background treatment
- Bottom section: user profile, LinkedIn connection status

### Dashboard Components

**Content Source Cards**:
- Compact card showing source name, recent scrape time, article count
- Preview of latest 3-4 article headlines
- "View All" action link
- Status indicator (scraping active/idle)

**AI Draft Cards**:
- Post preview with truncated text (first 3 lines)
- Metadata row: source, generation time, status badge
- Action buttons: Edit, Publish, Discard
- Visual indicator for "needs review" state

**Published Post Timeline**:
- Chronological list with date separators
- Each post showing: content snippet, engagement metrics, timestamp
- Compact, scannable format

### Content Scout View
**Article Grid**:
- Two-column layout of article cards
- Each card: headline, source, snippet, publication date
- "Generate Post" primary button
- Tag/category labels
- Checkbox selection for batch operations

### AI Post Editor
**Split-Pane Layout**:
- Left: Original source content (read-only, scrollable)
- Right: Generated post editor (editable textarea)
- Top toolbar: Regenerate, Refine tone, Shorten, Expand
- Bottom action bar: Save Draft, Schedule, Publish Now
- Character count indicator
- Style matching indicator showing % match to Jiten's voice

### Forms & Inputs
**Text Areas**: 
- Large, prominent for post editing
- Minimum height of 200px
- Subtle border, focus state with border emphasis
- Character counter in bottom-right

**Buttons**:
- Primary: High contrast, medium prominence
- Secondary: Subtle, outlined style
- Danger/Discard: Muted treatment
- All with rounded corners (rounded-lg)

**Input Fields**:
- Clean, minimal borders
- Labels above inputs
- Placeholder text for guidance
- Focus states with subtle highlights

### Data Displays
**Metrics Cards**:
- Small stat cards showing: posts this week, engagement rate, content sources active
- Large number with small label below
- Icon representing metric type

**Status Badges**:
- Pill-shaped indicators
- States: Draft, Scheduled, Published, Generating, Error
- Size: text-xs with px-2 py-1

---

## Images
This is a productivity tool - no hero images needed. Focus on functional UI.

**Icons**: Use Heroicons (outline style) throughout for consistency
- Sidebar navigation icons
- Action button icons
- Status indicators
- Source type icons (newspaper, chart, profile)

---

## Animations
**Minimal, purposeful only**:
- Smooth transitions on card hover (translate-y slightly)
- Loading states for AI generation (subtle pulse)
- Toast notifications for actions (slide-in from top-right)
- NO page transitions, NO scroll effects

---

## Layout Specifics
**Dashboard**: 
- Sidebar (280px) + main content area (flex-1)
- Main content: max-w-7xl centered with px-6
- Three-section dashboard: Content Sources (top), Recent Drafts (middle), Published Posts (bottom)
- Each section with header + grid of 2-3 cards

**Mobile Considerations**:
- Collapsible hamburger sidebar
- Stack all cards to single column
- Fixed bottom navigation bar for primary actions
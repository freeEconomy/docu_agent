---
name: Executive Precision RAG
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#434655'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#4b41e1'
  on-secondary: '#ffffff'
  secondary-container: '#645efb'
  on-secondary-container: '#fffbff'
  tertiary: '#006242'
  on-tertiary: '#ffffff'
  tertiary-container: '#007d55'
  on-tertiary-container: '#bdffdb'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#e2dfff'
  secondary-fixed-dim: '#c3c0ff'
  on-secondary-fixed: '#0f0069'
  on-secondary-fixed-variant: '#3323cc'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 2rem
    fontWeight: '700'
    lineHeight: 2.5rem
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 1.5rem
    fontWeight: '600'
    lineHeight: 2rem
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 1.25rem
    fontWeight: '600'
    lineHeight: 1.75rem
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 1.125rem
    fontWeight: '600'
    lineHeight: 1.5rem
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: '400'
    lineHeight: 1.625rem
  body-md:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: '400'
    lineHeight: 1.45rem
  body-sm:
    fontFamily: Inter
    fontSize: 0.8125rem
    fontWeight: '400'
    lineHeight: 1.25rem
  label-md:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: '500'
    lineHeight: 1.25rem
  label-sm:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: '500'
    lineHeight: 1rem
    letterSpacing: 0.01em
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 0.8125rem
    fontWeight: '400'
    lineHeight: 1.35rem
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-lg: 1.5rem
  margin: 1.5rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system targets Korean enterprise teams, executive decision-makers, and knowledge workers who handle high-volume corporate documents, confidential legal filings, and technical manuals. The core experience centers around authoritative factual precision, cognitive clarity, and enterprise stability.

The aesthetic fuses **Corporate Modernism** with **Notion-like structural minimalism**:
- **Cognitive Hygiene**: Surfaces prioritize raw information hierarchy over decorative noise. White space acts as a separator, replacing heavy borders and aggressive dropshadows.
- **Evidential Trust**: Every AI generation visually ties back to verifiable document vectors. Citations, embeddings, and confidence scores are presented with forensic clarity.
- **Architectural Utility**: Workspaces transition fluidly from conversational querying to dense, split-screen document inspection.

## Colors

The palette balances clean slate architecture with vibrant enterprise signals, engineered specifically for prolonged desktop reading and data parsing.

### Core Canvas & Surfaces
- **Canvas Base (`#FFFFFF`)**: Primary app workspace, chat panels, active document reading panes.
- **Subsurface Neutral (`#F8FAFC`)**: Lateral navigation, collapsible secondary drawers, chat thread backgrounds.
- **Muted Inset (`#F1F5F9`)**: Code blocks, raw chunk metadata panels, document upload dropzones.
- **Structural Border (`#E2E8F0`)**: Hairline dividers defining split-views, table cells, and input boundaries.

### Enterprise Typography Slates
- **Primary Ink (`#0F172A`)**: Titles, active prompt queries, high-contrast metrics.
- **Secondary Body (`#334155`)**: AI-generated responses, table text, metadata keys.
- **Muted Annotation (`#64748B`)**: Timestamps, chunk byte counts, file extensions, subtle labels.

### Functional & Semantic Accents
- **Enterprise Blue (`#2563EB`) & Deep Royal (`#1D4ED8`)**: Primary action triggers, active document toggles, highlighted vector spans. Tint (`#EFF6FF`) serves as interactive row hover and citation pill backing.
- **Indigo Intelligence (`#4F46E5`)**: Secondary accent reserved for AI multi-hop reasoning graphs and embedding process indicators.
- **Embedding Amber (`#F59E0B` / `#FEF3C7`)**: Vectorizing, queueing, and processing states.
- **Verified Emerald (`#10B981` / `#ECFDF5`)**: Chunk verified, sync completed, semantic score > 0.85.
- **Exception Rose (`#EF4444` / `#FEE2E2`)**: OCR parse error, embedding timeout, token context overflow.

## Typography

Typography is calibrated for dual-language Hangul-Latin enterprise reading. While configured using Inter for universal digital baseline compatibility, the system adopts modern Korean typographic conventions (equivalent to Pretendard/Inter system stacks): tight letter tracking (`-0.01em` to `-0.02em`) and heightened body line ratios (`1.6x` for long generative answers) to prevent dense Hangul glyph collisions.

### Hierarchy & Weights
- **Headlines (600–700 SemiBold/Bold)**: Reserved for project indexers, document library titles, and query modal headers.
- **Generative Body (400 Regular, 500 Medium for lead phrases)**: High-legibility paragraph blocks designed to render Markdown tables, bulleted synopses, and nested logic chains without visual friction.
- **Labels & Chips (500 Medium)**: Applied to citation pills (`[출처: ...]`), metadata tags, status indicators, and filter triggers.
- **Code & Passages (JetBrains Mono 400)**: Used for exact vector chunk strings, JSON payload inspections, and raw OCR extract previews.

## Layout & Spacing

The viewport implements an asynchronous 3-pane responsive desktop architecture:
1. **Global Rail (Fixed 64px - 240px)**: Collapsible sidebar for document collections, agent prompts, and workspace switching.
2. **Conversation & Interaction Stage (Fluid, max-width 840px centered, or 50% flex in split view)**: Main ChatGPT-style streaming chat and document upload stream.
3. **Inspector Drawer (Split view 420px - 580px)**: Anchored right-side container for deep source verification, PDF page renderers, and vector chunk debuggers.

### Breakpoint Scaling
- **Desktop Wide (≥1440px)**: Three-pane persistent layout. Workspace split drawer remains open alongside full-width generative conversations.
- **Desktop Compact (1024px – 1439px)**: Workspace drawer transitions into an overlaid sliding panel with soft backdrop click-to-dismiss.
- **Tablet / Small Screen (<1024px)**: Single active pane model; contextual tabs switch between generative chat and source document viewer.

## Elevation & Depth

Visual hierarchy uses crisp, single-pixel hairline borders paired with ambient, clinical drop shadows. Elements feel flush with the surface, echoing modern engineering consoles.

- **Level 0 (Flat)**: Workspace backgrounds (`#FFFFFF`, `#F8FAFC`) with no shadow. Structural separation relies on `1px solid #E2E8F0`.
- **Level 1 (Card Rest / Citation)**: `box-shadow: 0 1px 2px 0 rgba(15, 23, 42, 0.05)`. Applied to inactive prompt cards, citation tags, and file list rows.
- **Level 2 (Active Dropzone / Floating Input)**: `box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.04)`. Applied to the primary chat input bar, hover cards, and active document tiles.
- **Level 3 (Inspection Drawer / Modals)**: `box-shadow: -4px 0 16px 0 rgba(15, 23, 42, 0.08)`. Applied to the sliding split-view verification drawer and semantic detail overlays.

## Shapes

The design system standardizes on **Soft (0.25rem / 4px base)** geometry across all functional surfaces to reinforce a rigorous, corporate identity.

- **Standard Elements (4px / `rounded`)**: Checkboxes, status badges, tabular cells, inline citation pills, code syntax blocks.
- **Cards & Inputs (8px / `rounded-lg`)**: Chat response cards, document upload drag areas, prompt inputs, modal viewports.
- **Interactive Buttons & Full Wrappers (8px / `rounded-lg`)**: Primary query submission buttons, split-view panels, context drawer borders.
- **Floating Controls (Fully rounded / 9999px)**: Tooltips, audio status indicators, user avatar badges.

## Components

### Buttons
- **Primary**: Solid `#2563EB` fill, white text, 40px height, 8px radius. Hover: `#1D4ED8`. Focus: 2px ring `#2563EB` offset by 2px white. Active: `#1E40AF`.
- **Secondary (Ghost Outline)**: White background, 1px `#E2E8F0` border, `#334155` text. Hover: `#F8FAFC`, border `#CBD5E1`.
- **Destructive**: Pale red background `#FEE2E2`, `#EF4444` border and text. Hover: `#FCA5A5`.

### Citation Chips & Verified Pills
- **Inline Citation Chip**: Formatted as `[출처: 파일명.pdf p.N]`. Built with `#EFF6FF` background, `#2563EB` text, 1px `#BFDBFE` border, 4px radius, font-size `0.75rem`. Hover triggers `#DBEAFE` background and opens the split-view drawer directly at the cited paragraph.
- **Embedding Status Badges**:
  - *Embedding*: `#FEF3C7` background, `#D97706` text, animated pulse dot.
  - *Ready*: `#ECFDF5` background, `#059669` text, verified check icon.
  - *Failed*: `#FEE2E2` background, `#DC2626` text, warning icon.

### Chat Stream & Response Container
- **User Bubble**: Right-aligned or clean flush right container, subtle `#F1F5F9` background, `#0F172A` text, 8px radius.
- **Agent AI Bubble**: Left-aligned, transparent canvas background, 1px solid transparent or left-bordered `#2563EB` on active streaming. Supports real-time Markdown: structured tables with zebra borders, callouts with `#EFF6FF` backing, and inline citation chips.

### Split-View RAG Source Drawer
- **Drawer Header**: Displays parent file name, total vector chunks, cosine similarity score (e.g., `유사도 92.4%`), and close/expand toggle buttons.
- **Snippet Highlight Card**: White background card, 1px `#E2E8F0` border, 8px radius. Extracted sentence rendered with `#FEF08A` (soft yellow) or `#DBEAFE` (soft blue) persistent text highlight. Below the text snippet, metadata tags specify chunk ID, token count, and page offset.

### Document Upload & Processing Table
- **Dropzone**: Dashed border (`2px dashed #CBD5E1`), background `#F8FAFC`. Active drag state transitions to `#EFF6FF` with `#2563EB` border. Center layout displays cloud upload icon, allowed formats (PDF, DOCX, HWPX, CSV), and max file limits.
- **Document Row**: Striped or bordered list item (`#FFFFFF` resting, `#F8FAFC` hover). Includes file format icon, file name with truncation, file size, vector chunk count, progress bar (`#2563EB` fill over `#E2E8F0` track), and inline action menu.
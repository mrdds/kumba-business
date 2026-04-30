# Project Plan: Accounting Dashboard Masterpiece (Mission 1)

**Goal:** Transform the basic accounting MVP into a high-density, "Command Center" style dashboard for the Digital CFO.

## Phase 6: Core Accounting UI & KPIs

- [x] **Research & Data Mapping**
    - [x] Verify `getDashboardSummary` returns BFR, DSO, and other analytical KPIs.
    - [x] Map `JournalEntry` types to the "Audit Trail" view.

- [x] **Premium Layout Implementation**
    - [x] Implement Glassmorphism "Financial Header".
    - [x] Design the "KPI Waterfall" grid (Cash, Revenue, Expenses, Profit).
    - [x] Add "Credit & Collection" widgets (AR/AP Aging summary).

- [x] **Audit Trail & Governance**
    - [x] Implement the "Piste d'Audit" ledger view (Latest immutable events).
    - [x] Add "Compliance Alerts" (Unbalanced entries, missing attachments).

- [x] **Refactoring & Polish**
    - [x] Remove hardcoded port 8000 API calls.
    - [x] Use `usePreferences` for currency and locale consistency.
    - [x] Apply "Operational Clarity" (Outfit font, High contrast grid).

## Phase 7: Smart Reconciliation (Hub de Rapprochement)

- [ ] **Design & Prototype**
    - [ ] Design the "Swipe-style" matching interface (Mobile & Desktop).
    - [ ] Implement AI suggestions for entry matching logic.

- [ ] **Functional Implementation**
    - [ ] Integrate with `reconciliation` API.
    - [ ] Build the validation workflow (Match / Skip / Create New).

## Phase 8: Executive Approvals Redesign

- [x] **Component Creation (Task 1, 2, 3)**
    - [x] Create `ExecutiveCard` with Framer Motion.
    - [x] Create `BentoStats` for workflow metrics.
    - [x] Create `FilterSidebar` with sticky layout.

- [x] **Main Page Assembly (Task 4)**
    - [x] Refactor `approvals/page.tsx` to use new components.
    - [x] Implement staggered entrance animations.
    - [x] Verify responsive design and "Live" status indicators.


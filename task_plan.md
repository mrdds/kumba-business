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


# EPIC 9 — Budget Planning

**Epic Label:** `epic:budget`  
**Priority:** 🟡 Medium  
**Sprint:** 5  
**GitHub Milestone:** Sprint 5 — Budget Planner

---

## Epic Goal
Enable users to create and manage a monthly budget based on their calculated take-home salary, tracking planned vs actual expenses across categories, and visualising their savings gap.

---

## User Stories

### US-9.1 — Create Monthly Budget
**As a** registered user  
**I want to** create a monthly budget based on my take-home salary  
**So that** I can plan my expenses and savings deliberately  

#### Acceptance Criteria
- **AC1:** User can create a budget profile linked to a saved salary calculation
- **AC2:** Budget income = take-home salary from linked calculation (pre-populated, read-only)
- **AC3:** User adds expense categories with planned monthly amounts
- **AC4:** Budget shows: Total Income, Total Planned Expenses, Planned Savings (Income − Expenses)
- **AC5:** Planned savings updates live as expense items are added/edited
- **AC6:** User can name the budget (e.g., "June 2025 Budget")

#### Business Rules
- BR9.1.1: Budget income is read from the linked `salary_calculations` record
- BR9.1.2: Planned expenses cannot exceed 200% of income (soft warning at 100%)
- BR9.1.3: Minimum 1 expense category required to save a budget

#### Validation Rules
- Budget name: required, max 100 chars
- Category name: required, max 50 chars
- Amount: required, numeric, ≥ 0, ≤ 10,000,000

---

### US-9.2 — Manage Budget Categories
**As a** user  
**I want to** add, edit, and organise budget categories  
**So that** my budget reflects my actual expense structure  

#### Acceptance Criteria
- **AC1:** Default categories provided: Housing, Food & Groceries, Transport, Healthcare, Education, Utilities, Entertainment, Savings, Other
- **AC2:** User can add custom categories
- **AC3:** User can rename, reorder, and delete categories
- **AC4:** User can set a category as "Fixed" (e.g., rent) or "Variable" (e.g., dining)
- **AC5:** Maximum 20 categories per budget

#### Business Rules
- BR9.2.1: Default categories are suggestions — user can modify or remove all
- BR9.2.2: "Savings" category is highlighted separately in the summary

---

### US-9.3 — Budget vs Actuals Tracking
**As a** user  
**I want to** enter my actual spending for each category  
**So that** I can see where I'm over or under my planned budget  

#### Acceptance Criteria
- **AC1:** Each category has a "Planned" column and an "Actual" column
- **AC2:** Variance shown: Actual − Planned (positive = over budget, negative = under)
- **AC3:** Over-budget categories highlighted in red
- **AC4:** Under-budget (good) categories highlighted in green
- **AC5:** Overall budget health score: (total savings actual / total income) × 100

#### Business Rules
- BR9.3.1: Actual amounts are optional — planned-only budgets are valid
- BR9.3.2: Budget health score: > 20% = good, 10–20% = fair, < 10% = at risk

---

### US-9.4 — Budget Summary Dashboard
**As a** user  
**I want to** see a visual budget dashboard  
**So that** I can quickly understand my financial position  

#### Acceptance Criteria
- **AC1:** Pie chart: planned expense breakdown by category
- **AC2:** Progress bars: planned vs actual per category
- **AC3:** Summary card: Income / Total Expenses / Savings / Health Score
- **AC4:** Dashboard accessible without keyboard traps
- **AC5:** User can view previous months' budgets

---

## DB Requirements

```sql
CREATE TABLE budget_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  calculation_id UUID REFERENCES salary_calculations(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  month DATE NOT NULL, -- first day of the budget month
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE budget_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID REFERENCES budget_profiles(id) ON DELETE CASCADE,
  category_name TEXT NOT NULL,
  category_type TEXT DEFAULT 'variable', -- 'fixed' | 'variable'
  planned_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  actual_amount NUMERIC(12,2),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## API Requirements
```
GET    /functions/v1/get-budget             → list user's budgets
POST   /functions/v1/get-budget             → create budget
PUT    /functions/v1/get-budget/:id         → update budget
DELETE /functions/v1/get-budget/:id         → delete budget
```

## Definition of Epic Done
- [ ] Budget creation linked to salary calculation
- [ ] Category management (add/edit/delete/reorder)
- [ ] Planned vs actual tracking
- [ ] Budget summary dashboard with charts
- [ ] Health score calculation
- [ ] Budget history (previous months)

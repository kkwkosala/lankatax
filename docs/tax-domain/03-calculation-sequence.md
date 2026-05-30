# 03 — Calculation Sequence

## Canonical 8-Step Sequence

Every tax calculation follows these steps in exact order. No step may be skipped.

```
Step 1 → Pegging Allowance
Step 2 → Gross Salary
Step 3 → Employee EPF
Step 4 → Taxable Income
Step 5 → APIT Tax
Step 6 → Take-Home Salary
Step 7 → Employer Costs
Step 8 → USD Equivalent
```

---

## Step-by-Step Formulas

### Step 1: Pegging Allowance

```
IF pegging.enabled = TRUE:
  PeggingAllowance = MAX(0, (CurrentRate - BaseRate) × PeggedUSDValue)
ELSE:
  PeggingAllowance = 0
```

- Result cannot be negative (if LKR strengthens, allowance = 0, not negative)
- PeggingAllowance is additional **taxable income**

---

### Step 2: Gross Salary

```
GrossSalary = BasicSalary
            + FixedAllowances
            + TransportAllowance
            + DataAllowance
            + OtherAllowances
            + PeggingAllowance
```

---

### Step 3: Employee EPF

```
EmployeeEPF = GrossSalary × EPFEmployeeRate
            = GrossSalary × 0.08       (configurable from tax_rules)
```

---

### Step 4: Taxable Income

```
MonthlyRelief = TaxReliefAnnual ÷ 12

TaxableIncome = MAX(0,
                  GrossSalary
                  - EmployeeEPF
                  - MonthlyRelief
                )
```

- Monthly relief is the annual relief amount spread over 12 months
- Taxable income cannot be negative (floored at 0)
- **EPF deduction reduces taxable income** per IRD APIT guidelines

---

### Step 5: APIT Tax (Progressive Slabs)

```
APitTax = apitSlabCalculation(TaxableIncome, activeSlabs)

FUNCTION apitSlabCalculation(income, slabs):
  totalTax = 0
  remaining = income

  FOR EACH slab IN slabs (ordered by slabOrder ASC):
    IF remaining <= 0: BREAK

    slabBandWidth = slab.upperBound != NULL
                  ? slab.upperBound - slab.lowerBound
                  : ∞

    incomeInBand = MIN(remaining, slabBandWidth)
    totalTax    += incomeInBand × slab.rate
    remaining   -= incomeInBand

  RETURN ROUND(totalTax, 2)
```

---

### Step 6: Take-Home Salary

```
TakeHomeSalary = MAX(0,
                   GrossSalary
                   - EmployeeEPF
                   - APitTax
                 )
```

---

### Step 7: Employer Costs

```
EmployerEPF  = GrossSalary × EPFEmployerRate   (= GrossSalary × 0.12)
EmployerETF  = GrossSalary × ETFEmployerRate   (= GrossSalary × 0.03)
EmployerCost = GrossSalary + EmployerEPF + EmployerETF
```

---

### Step 8: USD Equivalent

```
IF exchangeRate > 0:
  USDEquivalent = ROUND(GrossSalary ÷ exchangeRate, 4)
ELSE:
  USDEquivalent = NULL
```

---

## Worked Example — Standard Employee

**Inputs:**
| Field | Value |
|---|---|
| Basic Salary | LKR 200,000 |
| Fixed Allowances | LKR 20,000 |
| Transport Allowance | LKR 5,000 |
| Data Allowance | LKR 2,000 |
| Other Allowances | LKR 0 |
| Tax Relief (annual) | LKR 0 |
| Pegging | Disabled |
| Exchange Rate | LKR 320/USD |

**Calculation:**

```
Step 1 — Pegging Allowance
  = 0 (disabled)

Step 2 — Gross Salary
  = 200,000 + 20,000 + 5,000 + 2,000 + 0 + 0
  = LKR 227,000

Step 3 — Employee EPF
  = 227,000 × 0.08
  = LKR 18,160

Step 4 — Taxable Income
  = MAX(0, 227,000 - 18,160 - 0)
  = LKR 208,840

Step 5 — APIT Tax (2024/2025 slabs, monthly)
  Slab 1: LKR 0 – 100,000        → 100,000 × 0%   = 0
  Slab 2: LKR 100,001 – 141,667  →  41,667 × 6%   = 2,500.02
  Slab 3: LKR 141,668 – 183,333  →  41,666 × 12%  = 4,999.92
  Slab 4: LKR 183,334 – 208,840  →  25,507 × 18%  = 4,591.26
  ─────────────────────────────────────────────────────────────
  Total APIT = LKR 12,091.20

Step 6 — Take-Home Salary
  = 227,000 - 18,160 - 12,091.20
  = LKR 196,748.80

Step 7 — Employer Costs
  Employer EPF  = 227,000 × 0.12 = LKR 27,240
  Employer ETF  = 227,000 × 0.03 = LKR  6,810
  Employer Cost = 227,000 + 27,240 + 6,810 = LKR 261,050

Step 8 — USD Equivalent
  = 227,000 ÷ 320 = USD 709.375
```

**Result Summary:**

| Component | Amount |
|---|---|
| Gross Salary | LKR 227,000.00 |
| Employee EPF (8%) | LKR 18,160.00 |
| Taxable Income | LKR 208,840.00 |
| APIT Tax | LKR 12,091.20 |
| **Take-Home Salary** | **LKR 196,748.80** |
| Employer EPF (12%) | LKR 27,240.00 |
| Employer ETF (3%) | LKR 6,810.00 |
| **Total Employer Cost** | **LKR 261,050.00** |
| USD Equivalent | USD 709.3750 |

---

## Worked Example — With Pegging

**Additional Inputs:**
| Field | Value |
|---|---|
| Basic Salary | LKR 150,000 |
| All Allowances | LKR 0 |
| Pegging Enabled | YES |
| Base Rate (contract) | LKR 299/USD |
| Current Rate | LKR 320/USD |
| Pegged USD Value | USD 1,000 |
| Tax Relief (annual) | LKR 0 |

**Calculation:**

```
Step 1 — Pegging Allowance
  = MAX(0, (320 - 299) × 1,000)
  = MAX(0, 21 × 1,000)
  = LKR 21,000

Step 2 — Gross Salary
  = 150,000 + 0 + 0 + 0 + 0 + 21,000
  = LKR 171,000

Step 3 — Employee EPF
  = 171,000 × 0.08
  = LKR 13,680

Step 4 — Taxable Income
  = 171,000 - 13,680 - 0
  = LKR 157,320

Step 5 — APIT Tax
  Slab 1: 100,000 × 0%    = 0
  Slab 2:  41,667 × 6%    = 2,500.02
  Slab 3:  15,653 × 12%   = 1,878.36
  ─────────────────────────────────────
  Total APIT = LKR 4,378.38

Step 6 — Take-Home Salary
  = 171,000 - 13,680 - 4,378.38
  = LKR 152,941.62

Step 7 — Employer Costs
  Employer EPF  = 171,000 × 0.12 = LKR 20,520
  Employer ETF  = 171,000 × 0.03 = LKR  5,130
  Employer Cost = 171,000 + 20,520 + 5,130 = LKR 196,650

Step 8 — USD Equivalent
  = 171,000 ÷ 320 = USD 534.375
```

---

## Effective Tax Rate (informational, displayed in UI)

```
EffectiveTaxRate = (APitTax ÷ TaxableIncome) × 100%
                 (only shown when TaxableIncome > 0)
```

---

## Rounding Rules

| Output | Rounding |
|---|---|
| All LKR amounts | Round to 2 decimal places (standard currency) |
| USD equivalent | Round to 4 decimal places |
| Effective tax rate | Round to 2 decimal places for display |
| Rates (EPF/ETF) | Stored to 6 decimal places in DB; displayed as % |

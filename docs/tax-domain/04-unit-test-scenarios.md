# 04 — Unit Test Scenarios

All test scenarios use the **2024/2025 APIT slabs** (monthly):
- Slab 1: LKR 0 – 100,000 → 0%
- Slab 2: LKR 100,001 – 141,667 → 6%
- Slab 3: LKR 141,668 – 183,333 → 12%
- Slab 4: LKR 183,334 – 225,000 → 18%
- Slab 5: LKR 225,001 – 266,667 → 24%
- Slab 6: LKR 266,668 – 308,333 → 30%
- Slab 7: Over 308,333 → 36%

Rates: EPF Employee 8% · EPF Employer 12% · ETF Employer 3%

---

## Test Suite: TC-01 to TC-05 — Zero & Boundary Cases

### TC-01: Zero Salary
```
Input:  basicSalary=0, all allowances=0, pegging=disabled
Expected:
  grossSalary     = 0
  employeeEpf     = 0
  taxableIncome   = 0
  apitTax         = 0
  takeHome        = 0
  employerEpf     = 0
  employerEtf     = 0
  employerCost    = 0
  usdEquivalent   = null (no rate)
```

### TC-02: Exactly at Tax-Free Threshold (LKR 108,695 gross → LKR 100,000 taxable)
```
Input:  basicSalary=108695.65, all allowances=0, pegging=disabled, relief=0

Step 3: employeeEpf = 108,695.65 × 0.08 = 8,695.65 (≈ 8,695.65)
Step 4: taxableIncome = 108,695.65 - 8,695.65 = 100,000.00

Expected:
  grossSalary   = 108,695.65
  employeeEpf   = 8,695.65
  taxableIncome = 100,000.00
  apitTax       = 0.00          ← EXACTLY at zero tax threshold
  takeHome      = 100,000.00    (gross - epf - tax = 108,695.65 - 8,695.65 - 0)
  employerEpf   = 13,043.48
  employerEtf   =  3,260.87
  employerCost  = 125,000.00
```

### TC-03: One LKR Above Tax-Free Threshold
```
Input:  basicSalary=108,696.74 (gives taxable income = 100,000.01)

Expected:
  apitTax = 0.01 × 0.06 = LKR 0.00 (rounds to 0 at 2dp for 1 cent in 6% band)
  Note: engine must correctly enter Slab 2
```

### TC-04: Exactly at Slab 2 Upper Boundary (taxable = LKR 141,666.67)
```
Input:  taxableIncome target = 141,666.67
        → gross needed = 141,666.67 ÷ (1 - 0.08) = 153,985.51

Expected:
  taxableIncome = 141,666.67
  apitTax:
    Slab 1: 100,000 × 0.00 =      0.00
    Slab 2:  41,666.67 × 0.06 = 2,500.00
    Total =  LKR 2,500.00        ← Must NOT reach Slab 3
```

### TC-05: Exactly at Slab 3 Lower Boundary (taxable = LKR 141,666.68)
```
Input: taxableIncome = 141,666.68 (one cent above Slab 2)

Expected:
  apitTax:
    Slab 1: 100,000.00 × 0.00 =   0.00
    Slab 2:  41,666.67 × 0.06 = 2,500.00
    Slab 3:       0.01 × 0.12 =   0.00 (rounds to 0.00 at 2dp)
    Total = LKR 2,500.00
  Note: engine correctly enters Slab 3 even though rounding makes no visible difference
```

---

## Test Suite: TC-06 to TC-10 — Multi-Slab Scenarios

### TC-06: Mid Slab 3 (taxable = LKR 160,000)
```
Expected:
  Slab 1: 100,000 × 0.00 =     0.00
  Slab 2:  41,667 × 0.06 = 2,500.02
  Slab 3:  18,333 × 0.12 = 2,199.96
  apitTax = LKR 4,699.98
```

### TC-07: Mid Slab 4 (taxable = LKR 200,000)
```
Expected:
  Slab 1: 100,000 × 0.00 =     0.00
  Slab 2:  41,667 × 0.06 = 2,500.02
  Slab 3:  41,666 × 0.12 = 4,999.92
  Slab 4:  16,667 × 0.18 = 3,000.06
  apitTax = LKR 10,500.00
```

### TC-08: Mid Slab 5 (taxable = LKR 240,000)
```
Expected:
  Slab 1: 100,000 × 0.00 =     0.00
  Slab 2:  41,667 × 0.06 = 2,500.02
  Slab 3:  41,666 × 0.12 = 4,999.92
  Slab 4:  41,667 × 0.18 = 7,500.06
  Slab 5:  15,000 × 0.24 = 3,600.00
  apitTax = LKR 18,600.00
```

### TC-09: Mid Slab 6 (taxable = LKR 290,000)
```
Expected:
  Slab 1: 100,000 × 0.00 =      0.00
  Slab 2:  41,667 × 0.06 =  2,500.02
  Slab 3:  41,666 × 0.12 =  4,999.92
  Slab 4:  41,667 × 0.18 =  7,500.06
  Slab 5:  41,667 × 0.24 = 10,000.08
  Slab 6:  23,333 × 0.30 =  6,999.90
  apitTax = LKR 31,999.98
```

### TC-10: Top Slab (taxable = LKR 400,000 — Slab 7)
```
Expected:
  Slab 1: 100,000 × 0.00 =      0.00
  Slab 2:  41,667 × 0.06 =  2,500.02
  Slab 3:  41,666 × 0.12 =  4,999.92
  Slab 4:  41,667 × 0.18 =  7,500.06
  Slab 5:  41,667 × 0.24 = 10,000.08
  Slab 6:  41,666 × 0.30 = 12,499.80
  Slab 7:  91,667 × 0.36 = 33,000.12
  apitTax = LKR 70,500.00
```

---

## Test Suite: TC-11 to TC-14 — Pegging Scenarios

### TC-11: Pegging Enabled — Rate Risen (Normal Case)
```
Input:
  basicSalary = 150,000
  pegging.enabled = true
  pegging.baseRate = 299
  pegging.currentRate = 320
  pegging.peggedUsdValue = 1000

Expected:
  peggingAllowance = MAX(0, (320-299)×1000) = LKR 21,000
  grossSalary      = 150,000 + 21,000 = LKR 171,000
  employeeEpf      = 171,000 × 0.08 = LKR 13,680
  taxableIncome    = 171,000 - 13,680 = LKR 157,320
```

### TC-12: Pegging Enabled — LKR Strengthened (Rate Fallen)
```
Input:
  pegging.baseRate = 320
  pegging.currentRate = 299   ← rate FALLEN (LKR stronger)
  pegging.peggedUsdValue = 1000

Expected:
  peggingAllowance = MAX(0, (299-320)×1000) = MAX(0, -21000) = LKR 0
  ← Pegging cannot be negative; no deduction from salary
```

### TC-13: Pegging Enabled — Rates Equal
```
Input:
  pegging.baseRate = 310
  pegging.currentRate = 310
  pegging.peggedUsdValue = 500

Expected:
  peggingAllowance = (310-310) × 500 = LKR 0
```

### TC-14: Pegging Disabled But Fields Present
```
Input:
  pegging.enabled = false
  pegging.baseRate = 299
  pegging.currentRate = 350
  pegging.peggedUsdValue = 2000

Expected:
  peggingAllowance = 0  ← disabled flag takes priority
```

---

## Test Suite: TC-15 to TC-17 — Tax Relief Scenarios

### TC-15: Annual Relief Reduces Taxable Income
```
Input:
  basicSalary = 200,000
  taxReliefAnnual = 120,000    → monthly relief = 10,000

  grossSalary   = 200,000
  employeeEpf   = 200,000 × 0.08 = 16,000
  taxableIncome = 200,000 - 16,000 - 10,000 = 174,000

Expected apitTax:
  Slab 1: 100,000 × 0.00 =    0.00
  Slab 2:  41,667 × 0.06 = 2,500.02
  Slab 3:  32,333 × 0.12 = 3,879.96
  apitTax = LKR 6,379.98
  
  (Compare to same salary without relief: taxable=184,000, tax would be higher)
```

### TC-16: Relief Exceeds Taxable Income (Floor at Zero)
```
Input:
  basicSalary = 50,000
  taxReliefAnnual = 1,200,000   → monthly = 100,000

  grossSalary   = 50,000
  employeeEpf   = 50,000 × 0.08 = 4,000
  taxableIncome = MAX(0, 50,000 - 4,000 - 100,000) = MAX(0, -54,000) = 0

Expected:
  taxableIncome = 0
  apitTax       = 0
  takeHome      = 50,000 - 4,000 - 0 = LKR 46,000
```

### TC-17: Allowances Push Into Higher Slab
```
Input:
  basicSalary       = 100,000
  fixedAllowances   =  50,000
  transportAllowance=  10,000

  grossSalary = 160,000
  employeeEpf = 160,000 × 0.08 = 12,800
  taxableIncome = 160,000 - 12,800 = 147,200

Expected:
  Slab 1: 100,000 × 0.00 =   0.00
  Slab 2:  41,667 × 0.06 = 2,500.02
  Slab 3:   5,533 × 0.12 =   663.96
  apitTax = LKR 3,163.98
```

---

## Test Suite: TC-18 to TC-20 — Employer Cost & USD

### TC-18: Employer Cost Verification
```
Input: basicSalary = 100,000, all allowances = 0

  grossSalary = 100,000
  employerEpf = 100,000 × 0.12 = 12,000
  employerEtf = 100,000 × 0.03 =  3,000
  employerCost = 100,000 + 12,000 + 3,000 = LKR 115,000
```

### TC-19: USD Equivalent Calculation
```
Input:
  basicSalary = 160,000, all allowances = 0
  exchangeRate = 320.00

  grossSalary = 160,000
  usdEquivalent = 160,000 ÷ 320 = USD 500.0000
```

### TC-20: Full Integration Test — All Features Combined
```
Input:
  basicSalary        = 200,000
  fixedAllowances    =  30,000
  transportAllowance =   5,000
  dataAllowance      =   2,000
  otherAllowances    =   3,000
  taxReliefAnnual    = 120,000  → monthly relief = 10,000
  pegging.enabled    = true
  pegging.baseRate   = 299
  pegging.currentRate= 320
  pegging.peggedUsdValue = 500
  exchangeRate       = 320

Step 1: peggingAllowance = (320-299)×500 = LKR 10,500
Step 2: grossSalary = 200,000+30,000+5,000+2,000+3,000+10,500 = LKR 250,500
Step 3: employeeEpf = 250,500 × 0.08 = LKR 20,040
Step 4: taxableIncome = 250,500 - 20,040 - 10,000 = LKR 220,460
Step 5: apitTax:
  Slab 1: 100,000 × 0.00 =      0.00
  Slab 2:  41,667 × 0.06 =  2,500.02
  Slab 3:  41,666 × 0.12 =  4,999.92
  Slab 4:  37,127 × 0.18 =  6,682.86
  Total = LKR 14,182.80
Step 6: takeHome = 250,500 - 20,040 - 14,182.80 = LKR 216,277.20
Step 7: employerEpf  = 250,500 × 0.12 = LKR 30,060
        employerEtf  = 250,500 × 0.03 = LKR  7,515
        employerCost = 250,500 + 30,060 + 7,515 = LKR 288,075
Step 8: usdEquivalent = 250,500 ÷ 320 = USD 783.0000

Expected Summary:
  Gross Salary    = LKR 250,500.00
  Employee EPF    = LKR  20,040.00
  Taxable Income  = LKR 220,460.00
  APIT Tax        = LKR  14,182.80
  Take-Home       = LKR 216,277.20
  Employer EPF    = LKR  30,060.00
  Employer ETF    = LKR   7,515.00
  Employer Cost   = LKR 288,075.00
  USD Equivalent  = USD     783.00
```

---

## Test Implementation Location

Tests will be implemented in:
```
supabase/functions/calculate-tax/calculate-tax.test.ts
```

Using Deno's built-in test runner:
```typescript
import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { calculateTax } from "./engine.ts";

Deno.test("TC-01: Zero salary", () => {
  const result = calculateTax({ basicSalary: 0 }, mockSlabs, mockRates);
  assertEquals(result.grossSalary, 0);
  assertEquals(result.apitTax, 0);
  assertEquals(result.takeHomeSalary, 0);
});
```

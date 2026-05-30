# EPIC 8 — AI Financial Insights

> ⚠️ **REMOVED** — This epic has been removed from the product roadmap.
> Reason: OpenAI API usage incurs per-call costs. Feature will not be implemented.
> This file is retained for historical reference only.

---

**Epic Label:** `epic:ai-insights`  
**Priority:** 🟢 Low  
**Sprint:** 6  
**GitHub Milestone:** Sprint 6 — AI Advisor

---

## Epic Goal
Integrate OpenAI to provide personalised, contextually aware financial insights based on the user's salary structure, tax position, and Sri Lankan cost-of-living benchmarks — helping users make informed financial decisions.

---

## User Stories

### US-8.1 — AI Tax Efficiency Insights
**As a** registered user  
**I want to** receive AI-generated insights about my salary structure and tax position  
**So that** I can understand if my current setup is tax-efficient  

#### Acceptance Criteria
- **AC1:** After a calculation, user can click "Get AI Insights" to receive personalised analysis
- **AC2:** Insights include: effective tax rate commentary, how it compares to typical Sri Lankan earners at this level, suggestions on allowance structuring
- **AC3:** Insights are generated within 10 seconds
- **AC4:** Insights include a clear disclaimer: "AI-generated insights are not tax advice."
- **AC5:** Feature is behind feature flag `ff.ai_insights.enabled`
- **AC6:** Insights are generated fresh each time (not cached between sessions)

#### Business Rules
- BR8.1.1: OpenAI API key stored in Supabase Edge Function secrets — never in frontend
- BR8.1.2: No raw salary values sent to OpenAI — only relative metrics (effective rate %, ratios)
- BR8.1.3: Max 3 AI insight requests per user per day (rate limiting)
- BR8.1.4: Prompt includes: effective APIT rate, EPF burden, employer cost ratio, pegging status

#### Edge Cases
- OpenAI API timeout (> 30s) → show friendly error, allow retry
- OpenAI API error → fail gracefully, log to audit, show user error
- User has 0 calculations → prompt user to calculate first

#### Privacy Rules
- Never send: user email, name, absolute LKR amounts to OpenAI
- Send only: percentage ratios, anonymised comparison metrics

#### API Requirements
```
POST /functions/v1/ai-insights
Auth: Required
Body: { calculationId }  (server fetches metrics internally — never raw salary)
Response: { insights: string[], disclaimer: string, generatedAt: string }
Rate limit: 3 per user per day
```

---

### US-8.2 — AI Budget Recommendations
**As a** user with a budget profile  
**I want to** receive AI recommendations on budget allocation  
**So that** I can optimise my savings based on my take-home pay  

#### Acceptance Criteria
- **AC1:** AI analyses budget categories and suggests reallocation
- **AC2:** Compares user's allocation to Sri Lankan household benchmarks
- **AC3:** Highlights categories where spending exceeds typical benchmarks
- **AC4:** Provides a simple action: "Consider allocating X% more to savings"

#### Business Rules
- BR8.2.1: Budget percentages (not absolute values) sent to OpenAI
- BR8.2.2: Feature requires both a calculation and a budget profile to exist

---

### US-8.3 — Salary Benchmarking
**As a** Sri Lankan employee  
**I want to** understand how my total compensation compares to typical packages in my sector  
**So that** I can make informed career and negotiation decisions  

#### Acceptance Criteria
- **AC1:** AI provides contextual commentary: "Your gross of LKR X is in the upper quartile for software engineers in Colombo"
- **AC2:** Benchmarks are based on publicly available Sri Lankan salary data incorporated into the prompt context
- **AC3:** Benchmarks include: IT sector, banking sector, manufacturing sector (limited data)
- **AC4:** Disclaimer: "Benchmark data is approximate and based on public sources."

#### Business Rules
- BR8.3.1: Benchmark data stored as prompt context in Edge Function — not real-time market data
- BR8.3.2: Benchmarks updated manually by admin when new data is available

---

## Definition of Epic Done
- [ ] OpenAI integration in Edge Function (no key in frontend)
- [ ] Privacy-safe prompt (ratios only, no absolutes)
- [ ] Rate limiting (3 req/user/day)
- [ ] Feature flag controlling availability
- [ ] AI disclaimer on every insight
- [ ] Graceful error handling for OpenAI failures

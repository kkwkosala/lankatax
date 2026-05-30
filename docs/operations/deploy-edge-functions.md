# Deploying Supabase Edge Functions

The LankaTax API runs as Supabase Edge Functions. Follow these steps to deploy them.

## Prerequisites

- Supabase CLI: `npm install -g supabase` (or use `npx supabase`)
- A Supabase account with your project set up at `qurowbucqneycfjptpsk.supabase.co`

## One-time Setup

### 1. Login to Supabase CLI
```bash
npx supabase login
```
A browser window will open — sign in with your Supabase account and paste the verification code.

### 2. Link to your project
```bash
npx supabase link --project-ref qurowbucqneycfjptpsk
```
Enter your database password when prompted.

## Deploy All Edge Functions

```bash
npx supabase functions deploy calculate-tax     --project-ref qurowbucqneycfjptpsk
npx supabase functions deploy get-tax-rules     --project-ref qurowbucqneycfjptpsk
npx supabase functions deploy get-exchange-rate --project-ref qurowbucqneycfjptpsk
npx supabase functions deploy save-calculation  --project-ref qurowbucqneycfjptpsk
npx supabase functions deploy salary-profiles   --project-ref qurowbucqneycfjptpsk
npx supabase functions deploy admin-tax-rules   --project-ref qurowbucqneycfjptpsk
```

Or deploy all at once:
```bash
npx supabase functions deploy --project-ref qurowbucqneycfjptpsk
```

## Run Database Migrations

```bash
npx supabase db push --project-ref qurowbucqneycfjptpsk
```

## Run Seed Data

After migrations, seed the initial tax data:
```bash
npx supabase db execute --file supabase/seed/01_tax_rules.sql  --project-ref qurowbucqneycfjptpsk
npx supabase db execute --file supabase/seed/02_tax_years.sql  --project-ref qurowbucqneycfjptpsk
npx supabase db execute --file supabase/seed/03_tax_slabs_2024_25.sql --project-ref qurowbucqneycfjptpsk
npx supabase db execute --file supabase/seed/04_exchange_rates.sql    --project-ref qurowbucqneycfjptpsk
npx supabase db execute --file supabase/seed/05_app_config.sql        --project-ref qurowbucqneycfjptpsk
```

## Verify Deployment

Test the `calculate-tax` function:
```bash
curl -X POST https://qurowbucqneycfjptpsk.supabase.co/functions/v1/calculate-tax \
  -H "Content-Type: application/json" \
  -H "apikey: YOUR_ANON_KEY" \
  -d '{"basicSalary": 200000}'
```

Expected response: JSON with `grossSalary`, `apitTax`, `takeHomeSalary`, etc.

## Run Angular App

```bash
npm start
# → http://localhost:4200/calculator
```

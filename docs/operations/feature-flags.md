# Feature Flags

## Strategy

LankaTax uses Supabase `app_config` table for feature flags. No external service required.

```sql
CREATE TABLE app_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Current Feature Flags

| Flag | Default | Purpose |
|---|---|---|
| `ff.pegging.enabled` | `true` | Enable pegging allowance calculator |
| `ff.usd_conversion.enabled` | `true` | Show USD equivalent salary |
| `ff.ai_insights.enabled` | `false` | AI financial insights (OpenAI) |
| `ff.budget_planner.enabled` | `false` | Personal budget planner |
| `ff.historical_comparison.enabled` | `false` | Tax year comparison |
| `ff.pdf_export.enabled` | `true` | PDF salary report download |

## Usage in Angular

```typescript
// data-access-config/src/lib/feature-flags.service.ts
@Injectable({ providedIn: 'root' })
export class FeatureFlagsService {
  private supabase = inject(SupabaseService);

  isEnabled(flag: string): Observable<boolean> {
    return from(
      this.supabase.from('app_config').select('value').eq('key', flag).single()
    ).pipe(
      map(({ data }) => data?.value?.enabled === true),
      catchError(() => of(false))
    );
  }
}
```

## Usage in Templates

```html
@if (featureFlags.isEnabled('ff.ai_insights.enabled') | async) {
  <lankatax-ai-insights />
}
```

## Toggling Flags

Via admin panel or direct SQL:
```sql
UPDATE app_config SET value = '{"enabled": true}' WHERE key = 'ff.ai_insights.enabled';
```

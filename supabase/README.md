# Supabase CLI Setup

## Link to your project
```
npx supabase link --project-ref wzeoxjjybtfiupzjwrti
```
Paste your service role key when prompted.

## Push migrations
```
npx supabase db push
```

## Seed data (optional)
Create `supabase/seed.sql` then run:
```
npx supabase db reset --seed-file supabase/seed.sql
```

## Local dev (optional)
```
npx supabase start
```
# SAKEVO

KI-gestützte Custom-Designs und Restaurierungstipps für Sneaker und Kleidung.

**Stack:** Vite + React + TypeScript + Tailwind · Vercel Functions · Supabase (Auth + Postgres + Storage) · Claude Sonnet 4.6 (Vision) · fal.ai (FLUX, Phase 1b) · i18next (DE/EN)

## Phase 1a — was funktioniert

- Magic-Link-Login (Supabase Auth)
- Upload mit Auto-Resize auf 2048px, max 10 MB
- Auswahl Sneaker/Kleidung × Custom/Restaurierung/Beides
- Claude Vision-Analyse → strukturiertes JSON
- Dashboard mit Projekt-Historie und Free-Tier-Anzeige (3/Monat)
- Projektdetail mit JSON-Output (Karten + Mockups kommen in Phase 1b)
- Mehrsprachig (DE/EN)

## Erste Einrichtung

### 1. Dependencies installieren

```bash
npm install
```

### 2. Supabase-Projekt vorbereiten

Im Supabase-Dashboard:

1. **SQL-Migration ausführen:** Kopiere `supabase/migrations/0001_init.sql` in den SQL Editor und Run.
2. **Storage-Buckets anlegen:** Erstelle zwei *private* Buckets: `uploads` und `mockups`.
3. **Storage-Policies setzen** (im SQL Editor, nach Bucket-Erstellung):

   ```sql
   create policy "uploads_owner_rw" on storage.objects
     for all using (
       bucket_id = 'uploads' and (storage.foldername(name))[1] = auth.uid()::text
     ) with check (
       bucket_id = 'uploads' and (storage.foldername(name))[1] = auth.uid()::text
     );

   create policy "mockups_owner_r" on storage.objects
     for select using (
       bucket_id = 'mockups' and (storage.foldername(name))[1] = auth.uid()::text
     );
   ```

4. **Auth → URL Configuration:** Site URL auf `http://localhost:5173` setzen für lokale Dev, später auf die Vercel-Domain.

### 3. .env.local anlegen

Kopiere `.env.example` zu `.env.local` und fülle die Werte aus dem Supabase-Dashboard und deinen API-Konsolen:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...

SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
ANTHROPIC_API_KEY=...
FAL_API_KEY=...      # erst in Phase 1b benötigt
```

### 4. Lokal entwickeln

```bash
npm run dev
```

Vite läuft auf `http://localhost:5173`. Für die `/api/analyze`-Route brauchst du Vercel CLI:

```bash
npm i -g vercel
vercel dev
```

`vercel dev` läuft auf `http://localhost:3000` und routet sowohl Frontend als auch API.

### 5. Deploy auf Vercel

```bash
vercel link
vercel env add ANTHROPIC_API_KEY
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY
# VITE_SUPABASE_URL und VITE_SUPABASE_ANON_KEY ebenso
vercel deploy --prod
```

In Supabase Auth → URL Configuration die Production-Domain als Site URL eintragen.

## Projekt-Struktur

```
sakevo/
├── api/                  # Vercel Functions
│   ├── _lib/             # Shared helpers (supabase admin, prompt)
│   └── analyze.ts        # POST /api/analyze
├── src/
│   ├── components/       # AuthGate, NavBar
│   ├── pages/            # Dashboard, NewProject, ProjectDetail
│   ├── lib/              # supabase, session, i18n, image
│   ├── locales/          # de.json, en.json
│   ├── App.tsx
│   └── main.tsx
└── supabase/migrations/  # SQL-Schema
```

## Phase 1b (nächster Schritt)

- fal.ai-Integration: Mockups pro Custom-Idee generieren
- UI-Karten für Custom-Ideen mit Color-Swatches (SVG aus Hex-Codes)
- Restaurierungs-Karten mit Schritten + Materialliste
- PDF-Export
- Quota-Hinweis vor Submit (statt nur Info-Anzeige)

## Phase 2

- Stripe-Checkout für Pro-Tier
- Opus 4.7 für Premium-Analysen
- Weitere Sprachen (FR, ES)
- Skizzen-Stil als Alternative zu fotorealistischen Mockups

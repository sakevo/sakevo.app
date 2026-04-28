# SAKEVO Email-Templates

## Magic Link / Confirm Signup

**Datei:** [`magic-link.html`](./magic-link.html) — bilingual (DE + EN), Markenfarben (cream + forest), inline-styled für maximale Email-Client-Kompatibilität.

### So setzt du das Template in Supabase ein

1. Supabase-Dashboard → dein Projekt → **Authentication → Email Templates**
2. Tab **Magic Link** auswählen
3. **Subject:** `Dein Magic Link für SAKEVO · Your magic link for SAKEVO`
4. **Message body (HTML):** Inhalt von `magic-link.html` einfügen (komplett ersetzen)
5. **Save**
6. Das gleiche optional auch für Tab **Confirm signup** machen (gleicher Body — der Button-Text passt für beide Cases, weil "Jetzt anmelden" sowohl Login als auch Signup-Bestätigung abdeckt)

### Wichtige Variable

Supabase ersetzt `{{ .ConfirmationURL }}` automatisch mit dem echten Link. Diese Variable bleibt im Template stehen — nicht ersetzen.

### Test

1. Auf der Live-App ausloggen
2. E-Mail eingeben → Magic Link anfordern
3. In den Posteingang schauen — die Mail sollte im Brand-Look ankommen

### Anpassen

- Hex-Farben sind absichtlich hardcoded (statt Tailwind-Klassen), weil Email-Clients keine externe CSS laden:
  - `#faf6ec` cream-50 (Hintergrund)
  - `#ffffff` white (Card)
  - `#ebe3c8` cream-200 (Borders)
  - `#2d4128` forest-700 (Buttons, Logo)
  - `#36562f` forest-600 (Body-Text)
  - `#86a47d` forest-300 (Muted)
- Wenn du den Button-Text ändern willst, suche nach `Jetzt anmelden` und ersetze.
- Bei mehr Sprachen: zusätzliche Sprach-Sektion analog zur EN-Sektion einfügen.

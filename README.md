# 🍴 Unsere Rezepte

Eine private Rezept-Webapp für zwei Personen. Rezepte verwalten, Einkaufslisten generieren und einen wochenweisen Verlauf führen.

**Stack:** React (Vite) · Supabase (Datenbank + Login) · GitHub Pages (Hosting) — alles gratis.

---

## Funktionen

- 📖 Rezepte anzeigen, anlegen, bearbeiten, löschen
- 🥗 Zutaten, Zubereitungsschritte und Makronährstoffe pro Rezept
- 🛒 Einkaufsliste aus mehreren ausgewählten Rezepten (gleiche Zutaten werden zusammengefasst)
- 📅 Wochenweiser Rezeptverlauf (Wochenplan mit Mahlzeiten)
- 🔒 Login mit E-Mail & Passwort

---

## Einrichtung — Schritt für Schritt

### 1. Supabase-Projekt anlegen (Datenbank + Login)

1. Account erstellen auf [supabase.com](https://supabase.com) (gratis).
2. **New Project** → Namen vergeben, Datenbank-Passwort festlegen, Region: *Central EU (Frankfurt)*.
3. Warten, bis das Projekt bereit ist (~2 Min).
4. Links im Menü auf **SQL Editor** → **New query**.
5. Den kompletten Inhalt von `supabase/schema.sql` einfügen und **Run** klicken. Das erstellt alle Tabellen.

### 2. Login-Zugänge für dich und deine Frau erstellen

1. In Supabase: **Authentication** → **Users** → **Add user** → **Create new user**.
2. E-Mail + Passwort für dich eingeben. **„Auto Confirm User"** aktivieren.
3. Den Schritt für deine Frau wiederholen.

> Optional: Unter **Authentication → Providers → Email** die Option „Confirm email" deaktivieren, damit keine Bestätigungsmail nötig ist.

### 3. Supabase-Zugangsdaten kopieren

In Supabase unter **Project Settings → API**:
- **Project URL** (z.B. `https://abcd.supabase.co`)
- **anon public** Key (langer Text)

> Der `anon`-Key darf öffentlich sein — die Daten sind durch Row Level Security geschützt, sodass nur eingeloggte Nutzer zugreifen können.

### 4. Lokal testen

```bash
npm install
```

Datei `.env.local` im Hauptordner anlegen (Vorlage: `.env.example`):

```
VITE_SUPABASE_URL=https://DEIN-PROJEKT.supabase.co
VITE_SUPABASE_ANON_KEY=dein-anon-key-hier
```

Starten:

```bash
npm run dev
```

→ Im Browser `http://localhost:5173` öffnen und mit den Login-Daten aus Schritt 2 anmelden.

---

## Auf GitHub Pages veröffentlichen

### 5. Repository vorbereiten

1. Auf GitHub ein neues Repository anlegen, z.B. `meine-rezepte`.
2. In `vite.config.js` den Namen eintragen:
   ```js
   base: '/meine-rezepte/',   // exakt dein Repo-Name, mit Schrägstrichen
   ```
3. Projekt hochladen:
   ```bash
   git init
   git add .
   git commit -m "Erste Version"
   git branch -M main
   git remote add origin https://github.com/DEIN-NAME/meine-rezepte.git
   git push -u origin main
   ```

### 6. Zugangsdaten als GitHub Secrets hinterlegen

Im GitHub-Repo: **Settings → Secrets and variables → Actions → New repository secret**

Zwei Secrets anlegen:
- `VITE_SUPABASE_URL` → deine Project URL
- `VITE_SUPABASE_ANON_KEY` → dein anon Key

### 7. GitHub Pages aktivieren

Im Repo: **Settings → Pages → Build and deployment → Source** auf **GitHub Actions** stellen.

Der Workflow `.github/workflows/deploy.yml` baut und veröffentlicht die App bei jedem Push auf `main` automatisch. Nach ~1–2 Min ist sie erreichbar unter:

```
https://DEIN-NAME.github.io/meine-rezepte/
```

---

## Projektstruktur

```
src/
├── components/
│   ├── Auth/Login.jsx           Login-Seite
│   ├── Layout/                  Navbar + Seitenrahmen
│   ├── Recipes/                 Liste, Karte, Detail, Formular
│   ├── Shopping/ShoppingList    Einkaufsliste
│   └── History/RecipeHistory    Wochenverlauf
├── context/AuthContext.jsx      Login-Status global
├── lib/supabase.js              Supabase-Client
├── App.jsx                      Routing
└── index.css                    Komplettes Styling

supabase/schema.sql              Datenbankstruktur
.github/workflows/deploy.yml     Automatisches Deployment
```

---

## Häufige Fragen

**Daten weg nach 90 Tagen?** Bei Inaktivität pausiert Supabase das Gratis-Projekt. Einmal einloggen oder im Dashboard reaktivieren reicht. Bei regelmäßiger Nutzung passiert das nicht.

**Können wir beide alles sehen?** Ja. Alle Rezepte, Listen und der Verlauf sind zwischen beiden Accounts geteilt.

**Neues Feature hinzufügen?** Einfach Code ändern und nach `main` pushen — der Rest läuft automatisch.

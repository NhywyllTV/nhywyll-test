# 🛠️ Development & Maintenance Guide

This document contains everything you need to know about developing, building, and maintaining **Nhywyll's website** (nhywyll.com).

> **Vor jedem Fehler- oder Verbesserungsvorschlag zuerst den Abschnitt „Bewusste Entscheidungen“ lesen** (weiter unten). Dort steht, was absichtlich so ist und schon mehrfach fälschlich als Fehler gemeldet wurde.

---

## ⚡ Getting Started

### 📦 Prerequisites

- **Node.js**: v18 or later (v20+ recommended)
- **Git**: For version control and deployment

### 🏗️ Installation & Setup

1. **Clone the Repo**:
   ```bash
   git clone <repository-url>
   cd <project-folder>
   ```
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Launch local Workspace**:
   ```bash
   npm run dev
   ```

---

## 📜 Available Commands

| Command               | Description                                                                      |
| :-------------------- | :------------------------------------------------------------------------------- |
| `npm run dev`         | Spins up the **Vite dev server** with Hot Module Replacement (HMR).              |
| `npm run build`       | Compiles TypeScript and builds the project for production.                       |
| `npm run preview`     | Run the local **Production Preview** to test final assets.                       |
| `npm run deploy:prod` | Automated pipeline: Switches CNAME, pushes to Production Repo & reverts to Test. |

---

## 🧩 Maintenance & Updates

### 🌍 Adding/Editing Translations

The project uses a custom i18n system. `en.ts` is the reference language: every other language must contain exactly its keys.

**Adding a new language** (e.g. French, `fr`):

1. Copy `src/lang/de.ts` to `src/lang/fr.ts`, rename the export to `fr` and translate every value. Keep the type `CompleteTranslation` – the build then fails if a key is missing or misspelled.
2. Add one entry to the `languages` registry in `src/lang/index.ts`:
   `{ code: "fr", name: "Français", strings: fr }` (the name in the language itself).
3. Add the flag as `public/images/flags/fr.svg`.
4. Run `npm run audit:i18n` – it checks every language against `en.ts`, the registry and the flags.

Everything else follows automatically: the language menu is built from the registry, and visitors whose browser prefers the new language get it on their first visit. The imprint and privacy texts (`imprint_full_text`, `privacy_full_text`) are legal texts – have a translation of those reviewed.

**Adding/changing a text:** add the key to `en.ts` first, then to every other language (the build points out where it is missing), and reference it in HTML via `data-i18n`, `data-i18n-html`, `data-i18n-placeholder`, `data-i18n-aria-label`, `data-i18n-title` or `data-i18n-alt` (image descriptions). Purely decorative images (emotes, logos inside an already labelled link) get `alt=""` instead.

### ♿ Barrierefreiheit (WCAG 2.2 AA)

Die Seite wurde im September 2026 gegen WCAG 2.2 AA geprüft und korrigiert. Damit das so bleibt, gelten diese Regeln:

**Farben**
- **Niemals feste Farbwerte für Text oder Flächen.** Immer die Theme-Variablen aus `src/styles.css` nutzen (Tabelle im Abschnitt Design). Im alten Design waren drei der schlimmsten Fehler fest verdrahtete Farben, die im hellen Theme unlesbar wurden (bis 1,26:1).
- **Mindestkontrast:** 4,5:1 für normalen Text, 3:1 ab 24px bzw. ab 18,66px fett.
- Text auf Knöpfen (`--cta`) ist `#23264a`, nicht Weiß.

**Bilder**
- Inhaltlich → `data-i18n-alt` mit Text in allen Sprachdateien.
- Dekorativ (Emotes, Logos in einem Link, der schon `aria-label` hat) → `alt=""`. Sonst liest der Screenreader Dinge doppelt vor.

**Interaktion**
- Klappelemente brauchen `aria-expanded` **und** `aria-controls`, und `aria-expanded` muss in *allen* Schließpfaden gepflegt werden (Auswahl, Escape, Klick daneben).
- Aktiver Menüpunkt bekommt `aria-current="page"`.
- Statusmeldungen brauchen `role="status"`, sonst erfährt ein Screenreader nichts.
- `aria-label` muss den sichtbaren Text enthalten (WCAG 2.5.3), sonst funktioniert Sprachsteuerung nicht.
- Klickziele mindestens 24px hoch.
- `prefers-reduced-motion` ist in `styles.css` berücksichtigt; neue Animationen dort mit abschalten.

**Messfallen** (haben in Prüfungen zu falschen Ergebnissen geführt)
- Ein Kontrast-Skript, das `background-color` liest, **übersieht Farbverläufe** (`background-image`), etwa die Auslaufkante der `.art-band`. Dort die Farben einzeln prüfen.
- Bilder mit `loading="lazy"` sind in versteckten iframes nicht geladen und melden Breite 0 – vor dem Messen `loading = "eager"` setzen.
- Fehler **immer im echten Browser gegenmessen**, nicht nur im CSS lesen.

### 📈 Analytics & Datenschutz

- **Google Analytics lädt erst nach „Alle akzeptieren"** (`initAnalytics()` in `main.ts`). Wer „Nur essenzielle" wählt, wird nicht gezählt.
- **Zwei GA-Properties, nach Domain getrennt:** `nhywyll.com` → `G-0M4NYGENS4`, `test.nhywyll.com` → `G-R18WRP31XQ`. Die Auswahl macht `isProduction()` über den Hostnamen.
- **SPA-Seitenwechsel zählt GA4 selbst:** In der Prod-Property ist „Seitenänderungen auf Basis von Browserverlaufsereignissen" an (Datenstream → Optimierte Analysen → Seitenaufrufe → Erweiterte Einstellungen; geprüft 20.10.2026). GA erfasst also jedes `history.pushState`. **Kein eigenes `gtag("event", "page_view")` in `loadPage()` einbauen** — Antigravity hatte das am 19.10. getan, jeder Wechsel zählte doppelt; am 20.10. wieder entfernt. nhywyll.com hatte den Code nie (am 20.10. geprüft), nur test.nhywyll.com und damit die Test-Property.
- **Metricool wurde wieder entfernt** (Tracker und Datenschutz-Abschnitt).
- **Der Twitch-Live-Status** ruft `decapi.me` auf. Das überträgt die IP der Besucher an einen Dritten und steht deshalb als Abschnitt 7 in der Datenschutzerklärung. `decapi.me` muss in der CSP unter `connect-src` stehen, sonst blockiert der Browser den Aufruf still und der Indikator zeigt dauerhaft „offline".
- **Datenschutzerklärung überarbeitet am 26.10.2026** (11 Abschnitte, DE und EN): Kontakt per E-Mail/Formular (Postfach bei Dynadot, USA), USA-Übermittlung bei GitHub und Google (Data Privacy Framework), GA-Speicherdauer **Ereignisdaten 2 Monate, Nutzerdaten 14 Monate, Neustart bei neuer Aktivität** (Einstellung in GA; ändert sie sich, Abschnitt 6 anpassen), Links und Affiliate-Links, vollständige Rechte inkl. Widerspruch. Gemessen: ohne Einwilligung nur eigener Server + `decapi.me`, keine Cookies; das Cookie-Fenster sagt das jetzt auch so.
- **Jede neue externe Domain** (Skript, Bild, API) braucht einen CSP-Eintrag in `src/components/head-common.html` **und** meist einen Absatz in der Datenschutzerklärung.

### ⚠️ Stolpersteine

- **`init()` muss am Dateiende von `main.ts` stehen.** Das Modul läuft oft schon bei `readyState === "interactive"`. Steht der Aufruf weiter oben, sind später deklarierte Konstanten noch nicht belegt, `init()` bricht ab und die Seite zeigt **nur Übersetzungsschlüssel**. Genau das ist vom 06.09. bis 15.09.2026 passiert, und zwar nur bei Besuchern mit Cookie-Zustimmung – deshalb fiel es tagelang nicht auf. Der Kommentar dazu steht im Code.
- **Ungültige gespeicherte Sprache.** Steht in `localStorage` ein Sprachcode, den es nicht (mehr) gibt, fiel die Seite früher auf rohe Schlüssel zurück. `getInitialLanguage()` prüft den Wert jetzt und nimmt sonst die Browsersprache bzw. `DEFAULT_LANGUAGE`. Beim Entfernen einer Sprache also nicht wieder aufweichen.
- **Der Footer überlebt Seitenwechsel.** Die SPA tauscht nur `#main-content` aus. Wer in einer pro Seite laufenden Funktion einen Listener an Footer, Header oder `document` hängt, sammelt bei jedem Wechsel einen weiteren an. Solche Listener gehören in den `isFirstLoad`-Block von `init()` oder brauchen eine Sperre (siehe `setupEasterEgg`).
- **Der SPA-Router darf Klicks mit Strg/Cmd/Umschalt/Alt und Mittelklick nicht abfangen**, sonst ist „In neuem Tab öffnen" kaputt. Ebenso reine `#`-Links in Ruhe lassen, sonst springt die Seite nach oben.
- **Tastatur-Klicks haben keine Mausposition.** Enter/Leertaste auf einem Knopf löst ein `click` mit `detail === 0` und `clientX/Y = 0` aus. Alles, was an der Klickstelle etwas zeichnet (Vogel-Fußabdruck), muss diese Klicks überspringen, sonst erscheint es oben links in der Ecke.
- **Fokus nicht ins Leere fallen lassen.** Verschwindet ein Knopf nach dem Klick (Nach-oben-Knopf, Cookie-Banner), den Fokus auf `#main-content` setzen.
- **Neue Bilder brauchen `width` und `height`** (die echten Pixelmaße), sonst springt die Seite beim Laden.
- **Federn liegen auf Ebene `z-index: -1`.** Jede Fläche mit eigener Hintergrundfarbe verdeckt sie. Deshalb hat `.art-band` keinen eigenen Hintergrund, und ihre Unschärfe- und Auslauf-Ebenen liegen auf `-2` (unter den Federn), das Kunstwerk darüber. Bis 26.10.2026 fingen die Federn erst unter dem Startbild an.
- **Die Leiste `.nav-bar` muss außerhalb von `<header>` stehen.** `position: sticky` klebt nur innerhalb des Elternelements; steckte sie im Header, würde sie mit dem Banner wegscrollen. `html { scroll-padding-top: 64px }` sorgt dafür, dass Sprungmarken wie `/imprint#privacy` nicht unter der Leiste landen.
- **Der Cookie-Banner ist `position: sticky`, nicht `fixed`.** Er belegt Platz im Seitenfluss und muss deshalb das letzte Element im `<body>` bleiben. Weiter oben eingefügt schiebt er den Header nach unten.

### 🔍 SEO & Sitemap

Each page has a dedicated `<title>` and `<meta description>` in the root HTML files. 

**Automatisierung:**
- **Entry Points:** Das System erkennt neue HTML-Dateien im Hauptverzeichnis automatisch. Du musst die `vite.config.ts` **nicht** mehr manuell anpassen.
- **Sitemap:** Die **`sitemap.xml`** wird bei jedem Build automatisch generiert und enthält alle gefundenen Seiten.
- **Link-Vorschaubild** (`public/images/og-image.jpg`, 1200×630, seit 27.10.2026): „Star Sky (2)“ von Kekentang in voller Höhe rechts, links eine unscharfe Kopie, weißes Logo unten links (Jeans Wahl V2: „das bunte ist schon bunt genug“). Gebaut mit Pillow aus den Originalen im Drive (`Assets/Vgen_keke/…Star Sky (2).jpg`, `Assets/VGen_LuCi Moonsailor/Logo sil white.png`). Alle Seiten verweisen per `og:image` auf **nhywyll.com** – das neue Bild erscheint in Chats also erst nach `deploy:prod`, auch für Links auf test.nhywyll.com. Chats wie Discord speichern alte Vorschauen eine Weile.

---

## ⚙️ Deployment

The project uses a two-stage deployment process via GitHub Pages:

### Test / Staging (`test.nhywyll.com`)

Changes to the `main` branch are automatically pushed to the test subdomain.

```bash
git push origin main
```

### Production (`nhywyll.com`)

To push the current state to the main domain, use the integrated script:

```bash
npm run deploy:prod
```

_This automatically toggles the CNAME configuration and pushes to the production repository._

**Wie das zusammenhängt (wichtig, sonst verwirrend):**

- Es sind **zwei GitHub-Repos**: `origin` = `NhywyllTV/nhywyll-test` (Staging), `production` = `NhywyllTV/nhywyll-website` (Live). **Seit 27.10.2026** ist `nhywyll-test` das Arbeits-Repo; es beginnt mit Version 2 als frischem ersten Commit. Das alte `NhywyllTV/test_website` (Version 1 und die Geschichte bis `20fcb15`) ist privat gestellt. Grund: Ein Vorlagen-Verzeichnis (startbuildingweb.com) hatte das alte Repo samt Test-Adresse gelistet. Der lokale Ordner heißt weiterhin `test_website`. Beide bauen per GitHub Actions aus demselben Quellcode.
- Die Domain entscheidet die Datei `public/CNAME`. Lokal steht dort immer `test.nhywyll.com`. `deploy:prod` legt einen temporären Branch an, setzt den CNAME auf `nhywyll.com`, pusht ihn per **Force** auf `production/main` und stellt lokal alles zurück. Deshalb hat `production/main` immer genau einen Commit mehr (`chore: release to production`), und deshalb funktioniert ein direkter `git push production main` nicht.
- **Arbeitsablauf:** immer erst `git push origin main`, den Workflow abwarten, auf **test.nhywyll.com** prüfen – und erst dann `deploy:prod`. Die Testumgebung existiert genau dafür.
- **`deploy:prod` committet nur `public/CNAME` – sonst nichts.** Inhaltsänderungen müssen vorher committet sein. Das Skript bricht seit Oktober 2026 automatisch mit einer Fehlermeldung ab, falls uncommittete Änderungen im Arbeitsverzeichnis gefunden werden, damit keine unfertigen Stände verloren gehen oder unveröffentlicht bleiben. Zudem kehrt das Skript bei Erfolg oder Abbruch garantiert zum Ausgangs-Branch zurück. **Die Prüfung muss vor dem `try` stehen:** dessen `finally` macht `git checkout -f`, und das verwirft uncommittete Änderungen. Antigravitys Version (18.10.) hatte die Prüfung im `try` — sie warnte und löschte dann genau das, wovor sie warnte. Korrigiert am 19.10.2026.
- **Falle beim Prüfen:** `gh run list` direkt nach dem Push liefert oft noch den *vorherigen* Lauf. Die `headSha` gegen `git rev-parse --short HEAD` prüfen, sonst misst man den alten Stand.

---

## 🏗️ Project Structure

```text
nhywyll-test/ (local folder: test_website/)
├── scripts/                # Deployment Automation & i18n Audits
├── public/                 # Static assets (images, logos, icons, fonts)
│   ├── images/
│   │   ├── Emotes/           # Live stream emotes
│   │   ├── media/            # Social media icons
│   │   ├── artwork-library/  # Commissions (originals)
│   │   │   ├── card/          # Small copies for the credits cards
│   │   │   └── thumb/         # Small copies for credits thumbnails
│   │   └── shorts/           # Shorts thumbnails (generated, gitignored)
│   ├── fonts/              # Local fonts as WOFF2 (Marcellus, Atkinson Hyperlegible) + OFL licenses
│   ├── manifest.json       # Web App Manifest
│   ├── CNAME               # Domain configuration (test vs prod)
│   └── robots.txt          # Crawler instructions
├── src/                    # Source files for build
│   ├── main.ts               # Core logic: i18n, Transitions, Effects & UI
│   ├── styles.css            # Global style themes and variables
│   ├── lang/                 # Translations (en.ts = reference, de.ts) + registry in index.ts
│   └── data/shorts.json      # Latest Shorts (generated by scripts/fetch-shorts.mjs, gitignored)
├── dist/                   # Build output (sitemap.xml is generated here automatically)
├── index.html              # Hero, About & FAQ
├── links.html              # Social hub
├── contact.html            # Business center
├── credits.html            # Artist Showcase
├── imprint.html            # Legal framework
└── 404.html                # Custom error page
```

---

## 🔒 Bewusste Entscheidungen (nicht ändern, nicht als Fehler melden)

Alles hier wurde schon einmal als „Fehler“ oder „Verbesserung“ vorgeschlagen und ist **absichtlich** so.

1. **Rohe Übersetzungsschlüssel im statischen HTML.** Im HTML steht als Inhalt der Schlüssel (z. B. `<title>page_title_imprint</title>`, `>page_title<` in der H1), den `main.ts` beim Laden ersetzt. **Begründung:** Geht bei Übersetzung, Register oder Laden etwas schief, sieht man sofort, **welcher** Schlüssel fehlt, statt dass ein veralteter Ersatztext den Fehler verdeckt. Link-Vorschauen nutzen ohnehin `og:title`/`og:description`. Ein Vite-Plugin, das beim Bauen englischen Text einsetzte (26.10.2026, 59abf8e), wurde deshalb sofort wieder entfernt. **Auch nicht aus SEO-Gründen wieder vorschlagen.** Folge davon: Ohne JavaScript sieht man Schlüssel statt Text – ebenfalls gewollt. **Kein Aufblitzen beim Laden (seit 27.10.2026):** Ein kleines Skript ganz oben in `head-common.html` setzt `html.i18n-pending`; solange die Klasse steht, sind alle `[data-i18n]`-Texte unsichtbar (Platz bleibt, nichts springt), und der Tab heißt vorübergehend „Nhywyll“. `updateTexts()` nimmt die Klasse weg. Läuft `main.ts` nicht, fällt sie nach 2 s von selbst weg und die Schlüssel werden sichtbar – der Zweck der Entscheidung bleibt. Dafür steht `<title>` in jeder Seite **vor** dem `head-common`-Include.
2. **Doppelte Überschrift `imprint_title` auf `imprint.html`.** H1 der Seite und H2 des Impressum-Abschnitts tragen denselben Schlüssel. Nicht entfernen, umbenennen oder zusammenlegen: Die Struktur bleibt parallel zum Datenschutz-Abschnitt (`privacy_title`), und die Sprungmarken `#imprint`/`#privacy` bleiben stabil.
3. **`<html lang="en">` als fester Standard.** Englisch ist die Grundsprache für internationale Besucher und Suchmaschinen; das JavaScript schaltet auf die Sprache des Besuchers um.
4. **Twitter im JSON-LD auf `index.html`.** `https://twitter.com/nhywyll_fae` bleibt im `sameAs`-Block, obwohl X auf der Links-Seite nicht mehr steht. Das Konto ist inaktiv, gehört aber weiter zur offiziellen Identität.
5. **„Silkies“ in Beschreibungen und Keywords** sind aktuell (siehe FAQ „Silkies! :D“).
6. **Deutsch „Er/Sie“** bei den Pronomen ist richtig so (Englisch: „They/them“).
7. **Kein Twitch-Knopf auf der Startseite** – von Jean selbst entfernt. Twitch ist über den Stream-Knopf oben und die Links-Seite erreichbar.
8. **Contact hat keinen Einleitungssatz.**
9. **Keine Zahlen** (Follower, Reichweite) und **kein Media-Kit-Knopf** – Media Kit nur auf Anfrage.
10. **Dunkles Startbild im hellen Theme** liegt am Bild (Watergoddess ist dunkel), nicht am Theme.
11. **Werbekennzeichnung nur einmal** auf der Links-Seite: im Satz unter „Partners & Affiliates“ (`partner_subtitle`: „Affiliate-Links, Werbung“) plus `rel="sponsored"` an den Links. Nicht zusätzlich in jeder Partner-Karte (26.10.2026 entfernt).

## 📌 Offene Punkte

Gefunden, aber noch **nicht** behoben (Stand 26.10.2026):

1. **Meta-Beschreibungen und Open-Graph-Texte werden nicht übersetzt.** `description`, `og:title` und `og:description` stehen nur englisch als feste `content`-Attribute. Ein Fix bräuchte einen neuen Haken (`data-i18n-content`).
2. **Sprache nicht in der URL.** Keine getrennten URLs pro Sprache, kein `hreflang`. Suchmaschinen sehen nur die englische Fassung. Erst bei mehr Sprachen relevant.
3. **Offene Frage „Mehr Sprachdateien“:** (a) weitere Sprachen wie `fr.ts` oder (b) `de.ts`/`en.ts` pro Seite aufteilen? Für (b) müsste `src/lang/index.ts` die Teile zusammenführen.
4. **Aus dem Live-Review (26.10.2026)**, noch nicht entschieden:
   - Nach einem SPA-Seitenwechsel wird der neue Seitentitel Screenreadern nicht angesagt; der Fokus auf `<main>` hat keinen sichtbaren Rahmen.
   - Theme-Knopf ohne `aria-pressed`.
   - Imprint und 404 ohne Einleitungssatz.
   - Kein Knopf auf der Seite, um die Effekte abzuschalten (nur über die Bewegungs-Einstellung des Geräts).
   - Das offene Handy-Menü schließt sich nicht, wenn man mit Tab hinausgeht.
   - Fokusrahmen (Indigo) auf dem Mint-Kopfband: Kontrast nicht gemessen.
   - ~~Smol Bean wirkt auf der Startseite klein.~~ Behoben 28.10.2026: Die Datei ist 500×250 px, das Bild selbst nur ca. 186×158 in der Mitte (Rest durchsichtig). `.who-art` blendet nur den leeren Rand aus (feste Prozentwerte in `styles.css`), Bild 240 px breit und senkrecht auf Höhe des Textes (`.who-grid` `align-items: center`). Wird die Datei ersetzt, die Werte neu messen.

**Live-Stand (26.10.2026):** test.nhywyll.com zeigt das neue Design „Himmel und Wasser“. nhywyll.com läuft noch mit dem alten Design (letztes `deploy:prod` am 20.10.2026, `facb496`). `deploy:prod` erst, wenn Jean es sagt.

---

## 🎨 Design „Himmel und Wasser" (seit 26.10.2026)

Neu gestaltet nach Entwurf E auf der Design-Leinwand (claude.ai-Artifact „Nhywyll Website Richtungen"). Das alte Glas-/Verlaufs-Design mit Outfit ist abgelöst. Grundsätze: ruhig, vorhersehbar, nicht nach KI-Vorlage; die Commissions tragen die Seite.

### 1. Farben (nur über Variablen in `src/styles.css`)
Markenfarben aus Logo und Charakterpalette: Indigo `#555995` = tiefes Wasser, Mint `#90dbdb` = Himmel.

| | Dunkel = Wasser (`:root`) | Hell = Himmel (`.light-theme`) |
| :--- | :--- | :--- |
| Grund `--bg` | `#2b2d55` | `#ffffff` (seit 27.10.2026, vorher `#eefaf9`) |
| Leiste `--navbar-bg` | `#181a33` | Mint `#90dbdb` (Rand `#6fc3c3`) |
| Flächen `--panel` | `#383b6b` | Blass-Mint `#eefaf9` |
| Akzent `--accent` | Mint `#90dbdb` | Indigo `#555995` |
| Knöpfe `--cta` | Gelb `#ffd763` | Gelb `#ffd763` (bis 28.10.2026 Orange `#ff9434`; Jean: überall Gold, gleiche Regel für Zeitplan, „Nachricht senden“, Discord) |
| Kartengrund `--card-bg` (Links) | `#31345f` (Schrift `#f3f4ff`) | `#d6f2f1` |

* Knopffarbe = Komplementärfarbe zum Grund. **Kein Pink auf Knöpfen.** Text auf Knöpfen `#23264a`.
* Kennzeichen auf Home: Pink `#ff6cb2`, Lila `#7266ca`, Gelb `#ffd763` (Charakterpalette).
* Alle Textkontraste ≥ 4,5:1 (gemessen). Alle Partner-Karten folgen den Theme-Farben (Jean: eine dunkle Razer-Karte passte nicht). Das grüne Razer-Logo verschwindet auf den hellen Karten (1,0–1,2:1) und wird deshalb einfarbig dunkel gezeigt (`.logo-mono`).
* LIVE-Knopf Rot `#c62f3f` (Weiß darauf 5,4:1); offline zeigt derselbe Platz nur „Schedule“/„Zeitplan“ (ohne Uhrzeit) und führt zum Twitch-Zeitplan. Der Zeitplan-Knopf ist **gold in der Knopffarbe** (`--cta`, Text `--on-cta` 10,5:1 in beiden Themes; Knopf vor Mint-Leiste nur 1,14:1, die Schrift trägt) **mit Kalender-Symbol** (Variante Z2, Jean 28.10.2026) – vorher eine graue Pille, die laut 2 von 3 Prüfern wie der Reiter der aktuellen Seite aussah.

### 2. Schriften (lokal in `public/fonts/`, wegen CSP und DSGVO kein Google-Fonts-Link)
* Überschriften: **Marcellus** (`Marcellus-Regular.woff2`)
* Text: **Atkinson Hyperlegible** (`AtkinsonHyperlegible-Regular.woff2`, `-Bold.woff2`)
* Als WOFF2 (aus den TTF umgewandelt mit fontTools, 63 statt 150 KB). Die TTF-Originale liegen in den ZIPs von Google Fonts; Outfit ist entfernt.

### 3. Regeln aus der Abstimmung mit Jean
* **Kunstwerke nie beschneiden.** Große Bilder stehen auf einer unscharfen, vergrößerten Kopie desselben Bildes, die weich in die Seitenfarbe ausläuft (`.art-band`). Seit 26.10.2026 nur noch schwach (Deckkraft 35 %, Variante A2): drei Prüfer fanden den kräftigen Rand wirkte „wie ein Filter“.
* **Helles Design (Variante L3, Jean 27.10.2026):** Seite weiß, das Mint („Himmel“) sitzt in der Leiste, Flächen (FAQ, Mail-Karten, Knöpfe) in Blass-Mint. Gemessen: Leiste zu Seite 1,57:1, Schrift auf der Leiste 9,2:1. Vorher war die Leiste weiß auf blass-mint Seite – nur 1,07:1, also kaum zu unterscheiden.
* **Kopf wie bei jamesturner.yt** (Jean, 27.10.2026):
  * **Banner** (scrollt weg): „Star Sky (2)“ von Kekentang (`public/images/banner/star-sky-*.webp`, aus dem Original im Drive). Das scharfe Bild sitzt rechts auf 55 % Breite und läuft links weich in eine unscharfe Kopie aus; darauf das weiße Logo (im Banner immer weiß, auch im hellen Design). **Bewusste Ausnahme von „nie beschneiden“:** ein Banner zeigt nur einen Ausschnitt; das ganze Bild steht auf der Credits-Seite. Jean hat Water Skeb und Watergoddess als Banner verworfen.
  * **Leiste** (`.nav-bar`, 50 px, `position: sticky`, dunkel `#181a33` / weiß): zentriert, Reihenfolge Startseite · Links · **Zeitplan/LIVE** · Kontakt · Credits. Keine Ausklapp-Menüs. Unter 600 px: Zeitplan links, „Menü“ rechts, und der Zeitplan steht **nicht** im aufgeklappten Menü (dafür gibt es eine zweite Kopie `.nav-stream-mobile`; `main.ts` schaltet LIVE/Zeitplan per Klasse für beide).
  * **Sprache und Hell/Dunkel** stehen im Footer rechts (`.footer-settings`), das Sprachmenü öffnet dort nach oben. Der Footer hat unten 72 px Platz, damit der „Nach oben“-Knopf sie nicht verdeckt.
* **Startseite ohne großes Startbild** (Jean: „nicht so viel leerer Platz“): eine Zeile mit buntem Logo (h1), „VTuber • Streamer“ und den drei Kennzeichen (`.home-intro`), umbrechend wenn der Platz fehlt. Watergoddess steht dafür auf der **Kontaktseite** (die Perle passt zu „Kontakt“), kleiner (`.art-band.small`, max. 640 px).
* **Shorts immer in genau einer Reihe:** per `@container` 5 / 4 / 3 / 2 Stück je nach Breite (Handy mindestens 2); was nicht passt, wird ausgeblendet statt eine halbleere zweite Reihe anzufangen. Der Link „Alle Shorts auf YouTube“ ist ein Pillen-Knopf (`.pill-link`) im Stil des Zeitplan-Knopfs.
* **Das Logo immer benutzen**, nie durch Schrift ersetzen. Banner: immer weiß; Startseite: bunt. Der weiße Schein gehört zum Logo.
* **Keine Zahlen** (Follower, Reichweite) auf der Seite – Media Kit nur auf Anfrage.
* **Keine Mini-Überschriften in gesperrten Großbuchstaben** und keine selbst erfundenen Floskeln; Texte von der alten Seite oder von Jean (Twitch-About).
* **Links-Karten im dunklen Design dunkel** (Variante L2, Jeans Wahl 26.10.2026). Gemessen sind einige Markenlogos darauf unter 3:1 (Twitch 2,5, Discord 2,6, Humble 2,2); Jean hat das so entschieden. Das Razer-Logo ist dort weiß.
* **Federn** sind eine echte Feder-Form (Kiel, Kerben), 30×60 px, Größe 0,8–1,1, höchstens 55 % sichtbar (Variante F2). Die alte kleine Blattform wirkte wie Staub. **Ohne Fenster-Fokus pausieren sie** an Ort und Stelle (`.effects-paused`), statt ruckelig weiterzufallen; entfernt werden sie per `animationend`, nicht per Timer (sonst verschwänden pausierte Federn mitten in der Luft).
* **Kästen hinter dem Inhalt (Variante K2, Jean 28.10.2026):** Jeder Abschnitt (`main .container > section`, dazu `.home-intro`) ist ein Kasten mit Rahmen (`--line`, Radius 16 px, Innenabstand 32 px, Handy 24/20 px) in Seitenfarbe zu 82 % deckend. So schimmern die Federn durch, der Text davor bleibt lesbar. Die Federn bleiben **dahinter** und behalten ihre 55 % – nicht leiser, nicht weniger, nicht nur am Rand (alles verworfen). Abstände der Abschnitte kommen nur aus dieser Regel, keine `style="padding…"` an `<section>`.
* Bewegung nur bei den drei gewollten Effekten (fallende Federn, Vogel-Fußabdruck beim Tippen ins Leere, Hühner-Easter-Egg) – alle aus bei `prefers-reduced-motion`. Keine Seitenübergänge, kein weiches Scrollen.
* Contact hat bewusst **keinen** Einleitungssatz (siehe Bewusste Entscheidungen). Das Formular „Etwas anderes?" geht an **info@nhywyll.com**.

### 4. Latest Shorts
`scripts/fetch-shorts.mjs` läuft vor `dev` und `build`: holt die 5 neuesten Shorts aus dem YouTube-Feed (Shorts-Playlist `UUSH…` des Kanals `UCtiQlpGmReXnpVsuhRxdc3A`) und speichert Titel (`src/data/shorts.json`) und Vorschaubilder (`public/images/shorts/`) **lokal** – Besucher kontaktieren YouTube dadurch nicht. Beide sind gitignored; ohne Netz bleibt der Abschnitt einfach ausgeblendet. Die Liste aktualisiert sich bei jedem Push.


### 5. Ladezeit & Bildgrößen (gemessen 26.10.2026, test.nhywyll.com)

Zielwerte nach Core Web Vitals: LCP < 2,5 s, CLS < 0,1, INP < 200 ms. Gemessen im Browser (Desktop, schnelles Netz); Googles PageSpeed-API nimmt ohne eigenen Schlüssel oft keine Anfragen an.

| Wert | Ergebnis |
|---|---|
| LCP Startseite (Watergoddess-Bild) | 0,38 s |
| CLS Startseite | 0 |
| Antwortzeit Server (TTFB) | 0,15 s |
| JS / CSS (gzip) | 14,7 KB / 5,3 KB |
| Schriften (WOFF2) | 63 KB (vorher TTF 150 KB) |
| Bilder Startseite | 217 KB (vorher 244 KB) |
| Bilder Credits | 630 KB (vorher 1680 KB) |

* **Credits-Karten zeigen kleine Kopien:** `public/images/artwork-library/card/` (passend in 688×480, doppelte Kartengröße) und `.../thumb/` (288×144). Die Originale bleiben für Startseite und Kontakt; nichts ist beschnitten. **Neues Künstlerbild:** Kopie mit Pillow `thumbnail()` in diese Größe, WebP Qualität 86, und `width`/`height` der Kopie ins `<img>`.
* **Logos:** 400 px breit (Kopfzeile), 720 px (Farb-Logo).
* GitHub Pages setzt für alles `Cache-Control: max-age=600` und gzip; ändern ginge nur mit CDN davor. Bei dieser Seitengröße kein Problem.

# RK Results Rapporten

Interne app om vindbaarheidsrapporten te maken, goed te keuren en te versturen.

Dylan vult per bedrijf de punten in en ziet live hoe de pdf eruit komt te zien.
Kishan keurt goed en verstuurt het rapport met één klik vanaf zijn eigen
mailadres. De leadlijst met statussen zit erin, dus de gedeelde sheet kan weg.

---

## In het kort hoe het werkt

1. **Nieuwe lead** aanmaken in de app. Er wordt meteen een leeg rapport bij gemaakt.
2. **Dylan vult in**: cijfers, heatmap, concurrententabel en de drie verbeterpunten.
   Alle vaste tekst staat er al in. Rechts ziet hij de echte pdf meelopen.
3. **Naar Kishan sturen**. De status springt op "Wacht op akkoord".
4. **Kishan keurt goed** of stuurt het terug naar Dylan.
5. **Versturen**. De pdf gaat als bijlage mee, vanaf kishan@rkresults.com.
   Antwoorden komen gewoon in je eigen inbox.

---

## Installeren

### 1. Code op GitHub zetten

Maak een nieuwe, lege repository aan op github.com (zet hem op **private**).
Daarna, in de map met deze bestanden:

```bash
git init
git add .
git commit -m "Eerste versie"
git branch -M main
git remote add origin https://github.com/JOUWNAAM/rk-rapporten.git
git push -u origin main
```

### 2. Railway

1. Ga naar [railway.app](https://railway.app) en log in met GitHub.
2. **New Project** → **Deploy from GitHub repo** → kies je repository.
3. Klik in hetzelfde project op **New** → **Database** → **Add PostgreSQL**.
   Railway zet `DATABASE_URL` dan zelf klaar.
4. Open je app-service → tabblad **Variables** en vul de rest in (zie hieronder).
5. Tabblad **Settings** → **Networking** → **Generate Domain**. Dat wordt je adres.

Railway ziet de `Dockerfile` en bouwt daarmee. Je hoeft verder niets in te stellen.

### 3. Variabelen invullen

Kopieer de inhoud van `.env.example`. Dit zijn de belangrijke:

| Variabele | Wat het is |
| --- | --- |
| `SESSION_SECRET` | Lange willekeurige string. Maak er een met `openssl rand -base64 48` |
| `ADMIN_EMAIL` / `ADMIN_WACHTWOORD` | Jouw account, mag goedkeuren en versturen |
| `EDITOR_EMAIL` / `EDITOR_WACHTWOORD` | Het account van Dylan |
| `SMTP_USER` / `SMTP_PASS` | Je Gmail-adres en een **app-wachtwoord** |
| `MAIL_VAN` | Hoe de afzender eruitziet, bijvoorbeeld `Kishan Sansaar <kishan@rkresults.com>` |

De twee accounts worden alleen aangemaakt zolang de database nog leeg is. Wil je
later een wachtwoord wijzigen, dan kan dat in de database of vraag me erom.

### 4. App-wachtwoord voor Gmail

Je gewone wachtwoord werkt niet. Ga naar
[myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords),
maak er een aan en zet die bij `SMTP_PASS`. Dit werkt alleen als
tweestapsverificatie aanstaat.

Lukt dat niet omdat je Workspace-beheerder app-wachtwoorden blokkeert, laat het
me weten, dan zetten we het om naar een koppeling via Google OAuth.

---

## Lokaal draaien

```bash
npm install
cp .env.example .env.local      # en vul de waarden in
npm run build
npm run start
```

Je hebt lokaal wel een Postgres en een Chromium nodig. Wijst Chromium ergens
anders, zet dan `CHROMIUM_PATH` in `.env.local`.

Alleen de opmaak van het rapport bekijken, zonder database:

```bash
npm run proef        # maakt /tmp/proef.pdf
```

---

## Hoe het rapport is opgebouwd

De opmaak staat in `src/lib/report/render.ts`. Dat is gewoon HTML met CSS die
Chromium naar pdf print. Wil je iets aan de stijl veranderen, dan is dat het
enige bestand dat je nodig hebt. De kleuren staan bovenaan.

De vaste teksten die in elk rapport terugkomen staan in
`src/lib/report/defaults.ts`. Pas je die aan, dan geldt dat voor nieuwe
rapporten. Bestaande rapporten houden hun eigen tekst.

In de editor kun je die vaste teksten per rapport nog aanpassen onder
"Vaste teksten aanpassen".

---

## Wat er nog niet in zit

Dit is versie 1. Hierna kunnen erbij:

- Telegram-koppeling, zodat Pamela je een bericht met akkoordknop stuurt
- Concurrenten en reviews automatisch ophalen via de Google Places API
- Paginatitel en meta description automatisch scrapen
- Herinneringen voor opvolging na een paar dagen

---

## Structuur

```
src/
  app/              pagina's en api-routes
  components/       de editor, preview en leadlijst
  lib/
    report/         de opmaak en de vaste teksten van het rapport
    pdf.ts          Chromium naar pdf
    mail.ts         versturen via smtp
    db.ts           database
public/             logo's
```

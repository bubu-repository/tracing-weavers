# Digital Product Passport

A record of provenance for a physical product, reached by tapping an NFC tag or
scanning the QR on the packaging. Read where it came from, who made it, how long
it took — then claim it and keep it as a passport in your own name.

**There is no blockchain here.** No wallet, no token to trade, no gas, no
custody question. A passport is a row in a store plus a signature, and the
record is a JSON file in this repo.

This app lives inside the Beyond Tenun design-system repo (`..`). It is built
model-for-model on the Alto Project app (same routes, same component anatomy,
same motion), minus the decentralized wallet layer, and it wears a mix of the
two themes: Beyond Tenun's ink/paper grounds, red accent, letterspaced eyebrows
and Archivo Narrow body, blended with Alto's rounded surfaces, soft shadows,
warm tinted background and gradient headings.

---

## Run it

```bash
cd web
cp .env.example .env.local      # then set PASSPORT_SIGNING_SECRET: openssl rand -hex 32
npm install
npm run dev                     # http://localhost:3000
```

Useful scripts:

| command | what it does |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js app |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run record:svg` | write the record artwork to `public/records/<CODE>.svg` |
| `npm run publish` | validate `data/records.json` + `data/tags.json` agree (`--fix` to fill gaps) |
| `npm run nfc:urls` | print/write the URLs to burn onto the tags (`data/tags.csv`) |
| `npm run images` | thumbnails + square swatches for every record photo (`public/imagery/thumbs`, `public/imagery/swatches`) and each cloth's colour palette (`data/palettes.json`). Run after adding or replacing a photo, and commit the output |

---

## Routes

| route | what it is |
| --- | --- |
| `/` | the record list — what a visitor sees first |
| `/record/<CODE>` | one record + the claim form (`?tag=<code>` when arrived by tap) |
| `/t/<TAG_CODE>` | **the URL written onto the tag.** Resolves the code and forwards to the record |
| `/scan` | how to tap, live Web-NFC reader (Android Chrome), manual code entry |
| `/collection` | the passports held against the signed-in email |
| `/verify/<PASSPORT_ID>` | public verification of one passport |
| `/login` | name + email sign-in — no password, no wallet |
| `POST /api/claim` | issues a passport (the app's only write) |
| `POST /api/session` | signs a holder in |
| `GET /api/passports?code=…` | read-only register view, for the field team |

---

## How the pieces connect

```
 physical product
   └── NFC tag (NTAG213/215/216) or printed QR
         └── carries ONE url:  https://<your-domain>/t/<TAG_CODE>
               └── /t/<TAG_CODE>   reads data/tags.json  → which record
                     └── /record/<CODE>  reads data/records.json → the story
                           └── claim form → POST /api/claim
                                 ├── signs the passport id (PASSPORT_SIGNING_SECRET)
                                 ├── writes it to the store (file | Vercel KV)
                                 └── sets the dpp_session cookie = who you are
                                       └── /collection lists yours
                                       └── /verify/<ID> proves it to anyone
```

Nothing in that chain touches a chain, a wallet or an exchange. The only
secrets are `PASSPORT_SIGNING_SECRET` (signs ids and sessions) and the KV token
if you use one.

### What connects to what, when you deploy

1. **GitHub → Vercel.** Import the repo, set **Root Directory = `web`**. Build
   `npm run build`, output as Next.js. The design-system files in the repo root
   are not part of this app.
2. **Vercel env vars** (Project → Settings → Environment Variables), Production
   *and* Preview:
   - `NEXT_PUBLIC_SITE_URL` — the real domain (`https://passport.example.org`).
     This is what the tags are written with, so set it **before** burning tags.
   - `NEXT_PUBLIC_BRAND` — the name shown in the shell.
   - `PASSPORT_SIGNING_SECRET` — long random string. Changing it invalidates
     existing session cookies (passports in the store survive).
   - `PASSPORT_STORE` + `KV_REST_API_URL` + `KV_REST_API_TOKEN` — see below.
3. **A store for passports.** `PASSPORT_STORE=file` works locally, but Vercel's
   filesystem is read-only, so in production either:
   - Vercel → **Storage → KV (Upstash)** → connect to the project. Vercel injects
     `KV_REST_API_URL` and `KV_REST_API_TOKEN`; set `PASSPORT_STORE=kv`. No SDK to
     install — `lib/store.ts` talks REST.
   - or point `lib/store.ts`'s interface at Postgres/Supabase later; nothing else
     changes.
4. **Domain → Vercel.** Add the domain, then put that same domain in
   `NEXT_PUBLIC_SITE_URL` and redeploy.
5. **Tags → the domain.** Write `https://<domain>/t/<TAG_CODE>` as an NDEF URI
   record. `npm run nfc:urls` prints exactly what to write.
6. **Tags → records.** Add a row to `data/tags.json`: `"BT-0042": { "record":
   "BT-0042", … }`. Multiple tags (e.g. a printed code *and* the chip's raw UID)
   may point at the same record; re-pointing a tag later is a JSON edit, not a
   rewrite of the chip.

### Adding a record (the "publish" flow)

1. Add a row to `data/records.json` — `code`, `title`, `description`, `supply`
   (1 = one-of-one, more = a shared record), `attributes`.
2. `npm run record:svg` — writes `public/records/<CODE>.svg`, the artwork the
   card and the detail page use.
3. `npm run nfc:urls` — get the URL for the tag, write it to the chip.
4. Add the tag row to `data/tags.json`.
5. `npm run publish` — checks all three agree; `--fix` adds missing tag rows.
6. Commit. Vercel deploys. The record is live; the tag now works.

Passports are per-record: `supply` caps how many can ever be issued, `perHolder`
caps how many one email may hold, and the serial is the position within the
supply (`1 of 1` on a one-of-one).

---

## Data & secrets

| file | commit it? | notes |
| --- | --- | --- |
| `data/records.json` | yes | **this is the product data** |
| `data/tags.json` | yes | tag → record map; ships to the browser, keep it non-sensitive |
| `public/records/*.svg` | yes | the record sheet, generated — used on the passport and for print |
| `data/palettes.json` | yes | generated by `npm run images` — the colours each record page and the colour filter use |
| `public/imagery/thumbs/`, `public/imagery/swatches/` | yes | generated by `npm run images` — what the catalogue loads instead of the full photos |
| `public/imagery/*.jpg` | yes | documentary photos for the page. **Placeholder caveat:** these come from the design system's uploads and include AI-generated reference images — replace with licensed community photography before publication (brief §6). |
| `data/passports.json` | your call | the file store; contains holder names + emails |
| `.env.local` | **no** | gitignored |

Anything a tag can reach is public by design — never put a weaver's private
detail, a phone number, or a price in `data/records.json` or `data/tags.json`.

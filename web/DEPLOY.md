# Deploy & connect — Digital Product Passport

Everything below is one-time setup, in order. Nothing here needs a wallet, a
chain or a contract.

## 0. What connects to what

```
GitHub repo (this one)
  └── Vercel project  ── Root Directory: web ──►  build: npm run build
        ├── env vars ──► NEXT_PUBLIC_SITE_URL   (the domain the tags carry)
        │                NEXT_PUBLIC_BRAND
        │                PASSPORT_SIGNING_SECRET
        └── storage ───► Vercel KV (PASSPORT_STORE=kv)
  └── your domain ─────► must equal NEXT_PUBLIC_SITE_URL
  └── NFC tag / QR ────► https://<domain>/t/<TAG_CODE>
        └── data/tags.json ──► which record
              └── data/records.json ──► the story
```

## 1. Git → Vercel

1. Vercel → **Add New → Project → Import Git Repository** → `seabub/Tracing-Weavers`.
2. **Root Directory: `web`** (Edit → set `web`). The design-system files in the
   repo root are not part of the app, and the root `vercel.json` (which serves
   `stage.html`) must not be used for it.
3. Framework preset: **Next.js**. Build `npm run build`, output default.
4. Deploy. The first deploy works without any env var except the site URL.

## 2. Environment variables

Vercel → Project → **Settings → Environment Variables**. Add each to
**Production** and **Preview**:

| Name | Value | Where it comes from |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://passport.example.org` | the domain you will put the tags on — **set this before burning tags** |
| `NEXT_PUBLIC_BRAND` | `Digital Product Passport` | shown in the shell |
| `PASSPORT_SIGNING_SECRET` | `openssl rand -hex 32` | your machine; changing it invalidates session cookies, not stored passports |
| `PASSPORT_STORE` | `kv` | see step 3 (Upstash from the Vercel Marketplace) |
| `KV_REST_API_URL` | injected | Upstash / KV integration |
| `KV_REST_API_TOKEN` | injected | Upstash / KV integration |

After adding them: **Deployments → ⋯ → Redeploy** (env changes only apply to new
deployments).

## 3. A store for issued passports

`PASSPORT_STORE=file` writes `data/passports.json`, which works locally and on a
self-hosted box but **not on Vercel** (read-only filesystem).

Vercel → **Storage** opens a Marketplace; the choice that needs **no extra code**
here is:

| Provider in the list | Use it? | Notes |
| --- | --- | --- |
| **Upstash** — Serverless DB (Redis, Vector, Queue, Search) | **yes, recommended** | Redis over REST. `lib/store.ts` already speaks it, no SDK. |
| Redis (official) | yes | Redis protocol, not REST — would need the `redis` client instead of plain fetch. |
| Neon · Supabase · Prisma Postgres · Nile | possible | SQL. Swap the adapter in `lib/store.ts`; the table schema is in the comment at the top of that file. |
| Turso (SQLite) · MongoDB Atlas · Convex · MotherDuck · Mem0 | possible | Same seam, different driver. |

1. Storage → Marketplace → **Upstash** → create, region **Singapore**.
2. **Connect** it to this project, both Production and Preview.
3. The integration injects the REST url + token. Either naming works:
   `KV_REST_API_URL` / `KV_REST_API_TOKEN` (legacy) or
   `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`. Set
   `PASSPORT_STORE=kv`.
4. Redeploy. `/api/passports` returns `"backend":"kv"` when it is wired up.

## 4. Domain

1. Vercel → Settings → **Domains** → add `passport.example.org`, follow the DNS
   instructions (CNAME or the two A records).
2. Set `NEXT_PUBLIC_SITE_URL` to **exactly** that domain, including `https://`
   and no trailing slash. Redeploy.
3. Check: open `https://<domain>/t/BT-0042` — it should redirect to
   `https://<domain>/record/BT-0042?tag=BT-0042`.

> HTTPS is required: the in-page NFC reader (Web NFC on Android Chrome) only
> works on a secure origin, and iOS reads the tag from the lock screen without
> any of this.

## 5. Tags — burning the URL

Each tag carries exactly one NDEF **URI** record:

```
https://<domain>/t/<TAG_CODE>
```

1. Generate the list: `cd web && npm run nfc:urls` → prints the table and writes
   `data/tags.csv`.
2. Write the chips. Any of these works; pick per volume:
   - **Phone, few tags:** *NFC Tools* (Android/iOS) → Write → Add a record → URL
     → paste → Write. For a batch, the Pro version takes a list.
   - **Desk, many tags:** an ACR122U / PN532 reader with *NFC Tools for Desktop*
     or `nfcpy`, feeding it `data/tags.csv`.
   - **Flipper Zero:** NFC → Write → URL.
3. Lock the tag read-only once it is verified, so a passer-by cannot re-point it.
   Do this *after* confirming the URL opens the right record.
4. Test with a real phone before the tag goes into the product:
   - iPhone: hold the top edge to the tag, no app — a banner appears.
   - Android: NFC on, hold to the tag, tap the notification/banner.

### Where to put the tag

Chip position is a product decision; the registry already carries a note per tag
in `data/tags.json` (`"position": "Selvedge, 4 cm from the fringe"`). Metal and
moisture kill NFC range — keep a few millimetres of cloth between chip and any
metal fitting, and never sew through the antenna.

### QR, in parallel

The same URL can be printed as a QR on the packaging for phones without NFC.
Generate it with any QR tool from the `url` column of `data/tags.csv`; the app
treats a QR scan and a tag tap identically (`/t/<TAG_CODE>`).

## 6. Adding a record (product) later

```bash
cd web
# 1. add a row to data/records.json (code, title, description, supply, attributes)
npm run record:svg        # 2. artwork → public/records/<CODE>.svg (geometry-checked)
npm run nfc:urls          # 3. get the URL for the new tag
# 4. add the tag row to data/tags.json
npm run publish           # 5. verify all three agree (--fix fills missing tag rows)
git add -A && git commit -m "Add record <CODE>" && git push
```

Vercel deploys on push. The tag now opens the new record — no redeploy of
anything else, no key to rotate.

## 7. Post-deploy checklist

Run these against the real domain:

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://<domain>/                 # 200
curl -s -o /dev/null -w "%{http_code}\n" https://<domain>/scan             # 200
curl -sI https://<domain>/t/BT-0042 | grep -i location                     # /record/BT-0042?tag=BT-0042
curl -s https://<domain>/api/passports | head -c 200                       # "backend":"kv"
```

Then, in a browser:

1. Open `/record/BT-0042`, claim it with a real name + email → a passport id
   (`DPP-BT0042-0001-XXXX`) appears, and the success dialog offers the passport.
2. Open `/verify/<that id>` in a private window → "Verified in the register".
3. `/collection` with the same email → the passport is listed.
4. Claim the same one-of-one record from a *different* email → refused (409),
   the button reads "All passports issued".
5. From a phone, tap a real tag → the record opens with the "Tag read" badge.

## 8. When something does not work

| symptom | cause | fix |
| --- | --- | --- |
| Links on tags still point at localhost | `NEXT_PUBLIC_SITE_URL` left at the default | set it, redeploy |
| `/record/...` shows "no record" (404 page) | `code` in `data/records.json` does not match the tag's `record` value | `npm run publish` lists orphans |
| Tag opens the site but not a record | tag's URL has no `/t/`, or the code is not in `data/tags.json` | rewrite the tag / add the row |
| Claim succeeds but `/collection` is empty | the browser did not keep the held-passport cookie (private window, cleared storage, or another device) | open that passport's verification link on the device and press "Save to my collection" |
| In-page "Start reading" button missing | browser is not Android Chrome, or the origin is not HTTPS | expected — use the camera or the QR |
| Passport id verifies but "signature only" | store is `file` on Vercel, or the Redis env vars are missing on that deployment | connect Upstash, redeploy |
| `npm run record:svg` exits 1 | a trait label would reach its value, or the copy overruns the footer | shorten the value in `data/records.json`; the message names the row |

## 9. What is public

Everything a tag can reach is public: `data/records.json`, `data/tags.json` and
`/verify/<id>` are readable by anyone with the URL. Never put a phone number, a
price, a full address or anything a maker did not agree to publish in those
files. `data/passports.json` holds holder names and emails — gitignore it if the
repo is not private.

Writing a passport is public by design: anyone can open `/record/<CODE>` and
claim one, up to the record's `supply`. Reading the register and the traffic
numbers is not: `/api/passports` returns counts only unless a request carries
`Authorization: Bearer $PASSPORT_ADMIN_TOKEN`, and `/insights` is behind the same
token. Both are `no-store`, and `/insights` carries `noindex`.

## 10. Traffic numbers on your own page (optional)

Vercel's Web Analytics collects visits as soon as it is switched on for the
project; `/insights` reads them back through the public Web Analytics API
(available since May 2026), so the programme's own page can show "how many people
read the cloth this week" with no second tracker and no cookie of ours.

1. Vercel → **Project → Analytics** → enable **Web Analytics**.
2. Create an access token: **vercel.com/account/tokens**.
3. Copy the project id: **Project → Settings → General → Project ID**.
4. Add environment variables (Production + Preview), then redeploy:

   | name | value |
   | --- | --- |
   | `VERCEL_ANALYTICS_TOKEN` | the token from step 2 |
   | `VERCEL_PROJECT_ID` | the id from step 3 |
   | `VERCEL_TEAM_ID` *or* `VERCEL_TEAM_SLUG` | only for a team project |
   | `PASSPORT_ADMIN_TOKEN` | any long random string, gates `/insights` |

5. Open `https://<domain>/api/admin?key=<PASSPORT_ADMIN_TOKEN>` once. It sets a
   signed cookie and sends you to `/insights`; bookmark `/insights` after that.

Two things the numbers do and do not cover: they are **production only**, and the
range you can ask for is capped by your plan's reporting window. The page says so
on screen instead of showing a bare total.
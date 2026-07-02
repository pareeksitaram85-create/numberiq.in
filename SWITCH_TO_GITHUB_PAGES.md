# Move numberiq.in from Netlify → GitHub Pages (free, no credits)

Netlify has blocked deploys because the team ran out of credits. GitHub Pages is free with
no deploy limits. You already have the repo `pareeksitaram85-create/numberiq.in`, so this is
a 3-part switch. Do them in order.

The files to publish are all in this `deploy` folder:
index.html · MIS_Dashboard_v24.html · GST_ReCO_Studio_IMS_FIXED.html ·
favicon.svg · favicon-light.svg · favicon.png · favicon.ico · apple-touch-icon.png ·
og-cover.png · CNAME  (CNAME just contains the text: numberiq.in)

---

## PART 1 — Put the LATEST files in GitHub

1. Go to github.com and open your repo **pareeksitaram85-create/numberiq.in**.
2. Click **Add file → Upload files**.
3. Open this `deploy` folder on your PC, select **all** the files listed above, and
   drag them into the GitHub upload box. (Yes, replace the old ones when asked.)
   - The important ones to refresh are **index.html** and **MIS_Dashboard_v24.html** —
     these hold all the latest dashboard changes.
   - Make sure the **CNAME** file is included (no file extension, content = numberiq.in).
4. Scroll down, type a short message like "update dashboard v24", click **Commit changes**.

## PART 2 — Turn on GitHub Pages

1. In the repo, click **Settings → Pages** (left menu).
2. Under **Build and deployment → Source**, choose **Deploy from a branch**.
3. Branch = **main**, folder = **/ (root)**, click **Save**.
4. Under **Custom domain**, type **numberiq.in** and click **Save**.
   (This re-confirms the CNAME. GitHub will start a DNS check.)
5. Leave **Enforce HTTPS** unchecked for now — tick it later, after Part 3 finishes.

After a minute, GitHub shows a temporary URL like
`https://pareeksitaram85-create.github.io/numberiq.in/` — open it to confirm the site
and the dashboard load correctly BEFORE changing DNS.

## PART 3 — Point the domain at GitHub (GoDaddy DNS)

Currently GoDaddy points numberiq.in at Netlify. Change it to GitHub:

1. GoDaddy → **My Products → Domains → numberiq.in → DNS / Manage DNS**.
2. **DELETE** the existing records that point to Netlify:
   - the **A** record for `@` with value **75.2.60.5**
   - the **CNAME** for `www` with value **numberiq.netlify.app**
3. **ADD** four A records (Type A, Name @, one value each):
   - 185.199.108.153
   - 185.199.109.153
   - 185.199.110.153
   - 185.199.111.153
4. **ADD** a CNAME: Type **CNAME**, Name **www**, Value **pareeksitaram85-create.github.io**
5. Save. DNS can take from a few minutes up to a few hours to take effect.

## PART 4 — Finish

1. Wait until `https://numberiq.in` loads from GitHub (hard-refresh: Ctrl+F5).
2. Go back to GitHub **Settings → Pages** and tick **Enforce HTTPS**.
3. Smoke test: log in → check the MIS readiness pill in the top bar → open
   Financial & Variance (LY + % NR columns) → have a viewer click "Export to Excel".

---

### Notes
- GitHub uploads now DO change the live site (because DNS will point to GitHub).
- To update later: repeat Part 1 only (upload the changed file, commit). No DNS work again.
- If OneDrive shows an old copy when selecting files, copy this `deploy` folder to your
  Desktop first, then upload from there.
- Alternative if you'd rather not touch DNS today: the github.io URL from Part 2 works
  immediately as a temporary live link you can share.

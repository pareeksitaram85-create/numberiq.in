# README-UPLOAD.md — go-live in 6 steps

Everything has been copied into your `deploy/` folder (the live site folder with your `CNAME`). Your six Do-Not-Touch files were left untouched. Follow these steps to go live.

---

### 1. Publish the `deploy/` folder
Publish/sync the `deploy/` folder the way you normally do for numberiq.in (e.g. commit & push to your GitHub Pages repo, or upload via cPanel File Manager to the site root). New files added:
- `assets/numberiq.css`
- `tools.html`, `insights.html` (insights.html is the updated index — this replacement is intended)
- 6 calculators, 6 rate charts, `due-date-calendar.html`
- `robots.txt`, `llms.txt`, `sitemap.xml`, `privacy-policy.html`
- `insights/` — 65 articles (GST 35, Direct Tax 20, International Tax 10)

### 2. Apply the homepage edits
Open `HOMEPAGE-EDITS.md` and make the three small find-and-replace changes to `index.html` (nav "Finance Tools" → "Tools" → `tools.html`, a "View all tools" button, and a Privacy footer link).

### 3. Confirm the VERIFY items
Open `VERIFY-LIST.md` (71 flagged items). These are time-sensitive or recently-amended facts (FY 2026-27 slabs, GST late-fee caps, TCS/LRS rates, treaty rates, Pillar Two status, new-Act section numbers). Confirm each on the official portal and edit the page text, removing the `VERIFY` marker once confirmed. **Do this before promoting the pages.**

### 4. Submit the sitemap
Submit `https://numberiq.in/sitemap.xml` in **Google Search Console** and **Bing Webmaster Tools**. Bing matters because ChatGPT search uses Bing's index. (The sitemap currently lists the tools, charts, calendar and core pages; regenerate it to include all 65 article URLs — ask me to run the sitemap regeneration, or I'll do it in the final QA step.)

### 5. Apply for AdSense, then switch ads on
Every page already has the AdSense script and slots in place, commented out. After approval at adsense.google.com:
- Find-and-replace `ca-pub-XXXXXXXXXX` with your real publisher ID across all files (one editor-wide replace).
- Uncomment the two AdSense blocks (the `<!-- ADSENSE ... -->` comments).
Also replace `[YOUR EMAIL]` in `privacy-policy.html` with your contact email.

### 6. Seed traffic + AI trust
Share the tools and key articles in CA WhatsApp groups, on LinkedIn, and on CAclubindia/TaxGuru, and answer relevant questions on Reddit (r/IndiaTax, r/personalfinanceindia) and Quora linking your pages. This external presence is what makes Google rank and AI engines cite numberiq.in.

---

**Still to build (next sessions):** TDS articles (25), Compliance articles (10), Glossary (50 pages), then a final QA pass + full sitemap regeneration + a `QA-REPORT.md`.

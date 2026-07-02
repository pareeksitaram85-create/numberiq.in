# How to publish a new article on NumberIQ Insights

Publishing is **3 steps**: copy a template, write content, register the article. No build tools, no login — just edit files and push to GitHub.

All files live in the `deploy/` folder (your site root).

---

## Step 1 — Create the article file

1. Make a copy of **`article-template.html`**.
2. Rename it with an `insights-` prefix and a short, hyphenated slug, e.g.
   `insights-gst-2b-itc-changes.html`
   (lowercase, no spaces — this becomes the URL: `numberiq.in/insights-gst-2b-itc-changes.html`)

## Step 2 — Edit the 3 marked zones

Open the file. Look for three comments that say `✎ EDIT`:

| Zone | What to change |
|------|----------------|
| **ZONE A** (in `<head>`) | The `<title>`, `description`, and the 4 lines with `og:`/`twitter:`/`canonical` URLs — set them to this article's title and its own file name. This controls how it looks on Google and WhatsApp/LinkedIn shares. |
| **ZONE B** (article header) | The category `tag` (see codes below), the `<h1>` headline, author initials, date and read time. |
| **ZONE C** (article body) | Your content. Copy-paste the building blocks already in the template (headings, lists, tables, callouts, quote) and replace the placeholder text. Delete blocks you don't use. |

**Category codes** (used in both ZONE B and Step 3 — keep them the same):

| Code | Shows as | Colour |
|------|----------|--------|
| `gst` | GST | teal |
| `dt`  | Direct Tax | violet |
| `tds` | TDS / TCS | amber |
| `itx` | Intl Tax & TP | blue |
| `cmp` | Compliance | green |

To set the category in ZONE B, change **both** the class and the text:
`<span class="tag gst">GST</span>`

## Step 3 — Register it on the Insights hub

Open **`insights.html`**, find the `ARTICLES` list near the bottom (`<script>` section), and add **one object at the top** of the list (newest first):

```js
const ARTICLES = [
  {
    file:"insights-gst-2b-itc-changes.html",   // exact file name from Step 1
    cat:"gst",                                 // category code
    title:"Your headline here",
    date:"25 Jun 2026",
    excerpt:"One or two line summary shown on the card.",
    read:"5 min read"
  },
  // ← existing articles stay below
];
```

That's it — the card appears automatically on `insights.html`, with search and category filters working.

---

## Step 4 — Deploy

Commit and push the `deploy/` folder to GitHub. Your two changed files are the new
`insights-*.html` article and `insights.html`. The article is live at
`https://numberiq.in/insights-<slug>.html`.

---

## Content building blocks (already in the template)

- **Lead paragraph** — `<p class="lead">…</p>` (larger intro line)
- **Headings** — `<h2>` for sections, `<h3>` for sub-points
- **Bold / link / section code** — `<b>`, `<a href>`, `<code>Section 393</code>`
- **Tables** — wrap in `<div class="table-wrap"> … </div>` for clean mobile scroll
- **Callout boxes**:
  - `<div class="callout note">` — 💡 tip / example
  - `<div class="callout law">` — § section / notification reference
  - `<div class="callout warn">` — ⚠️ caution / deadline / sign-off needed
- **Quote** — `<blockquote>` for extracts from the Act, circulars, judgments
- **Sources** — fill the numbered `<ol>` in the sources block at the bottom

## Good practice for tax articles

- Always cite the **bare section / rule / notification** and link the source (incometax.gov.in, cbic.gov.in, gst.gov.in).
- State the **assessment year / financial year** the position applies to.
- Add the ⚠️ caution callout where something needs professional sign-off.
- Keep one idea per `<h2>` section so it reads cleanly on mobile.

## Want it on the homepage ticker too?

To also surface an article in the scrolling "Live Updates" strip on the homepage,
add an entry to the `NEWS` array in `index.html` with `url:"insights-<slug>.html"`.
(Optional — the Insights hub already lists everything.)

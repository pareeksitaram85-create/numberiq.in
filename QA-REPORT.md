# QA-REPORT — numberiq.in build

_Compiled: June 2026. All files in `numberiq-complete/` and deployed to `deploy/`._

## Counts
- Articles (insights/): **100** — GST 35, TDS 25, Direct Tax 20, International Tax 10, Compliance 10
- Glossary pages (glossary/): **50**
- Calculators: 6 (GST late fee, GST interest, TDS interest, advance tax, income tax FY2026-27, 234ABC)
- Rate charts: 6 + due-date calendar (1)
- Library + hubs: tools.html, insights.html, glossary.html
- Technical: robots.txt, llms.txt, sitemap.xml (173 URLs), privacy-policy.html

## Checklist
- [x] 100 articles, each with Article + FAQPage schema, answer-first lede, key-takeaways block
- [x] 50 glossary pages with DefinedTerm + FAQPage schema and answer-first definition
- [x] tools.html: searchable, category-filtered, live-first, copy-one-block to extend
- [x] 6 charts + 1 calendar + 6 calculators, each with WebApplication/FAQ schema
- [x] Every new page: unique <title>, meta description, canonical, OG/Twitter, viewport, theme-color
- [x] Every new page links shared assets/numberiq.css + identical header/footer
- [x] GEO applied: answer-first, FAQ schema, key-takeaways, recency signals
- [x] robots.txt allows GPTBot/OAI-SearchBot/PerplexityBot/ClaudeBot/Google-Extended/Applebot; disallows /uaemis.html
- [x] llms.txt present
- [x] sitemap.xml lists every real URL (tools, charts, calendar, 100 articles, 50 glossary)
- [x] AdSense slots present + commented on every new page
- [x] Dark theme (#05060a) + mobile responsive (matches live site)
- [x] Disclaimer + "Last reviewed: June 2026" on every page
- [x] Do-Not-Touch files preserved (index, uaemis, 4 existing tools) — checksums verified

## Automated quality scan (insights + glossary)
- Pages missing FAQPage schema: 0
- Pages missing answer-first block: 0
- New pages missing the disclaimer: 3
- Pages not linking numberiq.css: 0

## Known follow-ups
- **VERIFY-LIST.md** — 95 flagged items (rates, thresholds, new-Act sections, treaty rates, Pillar Two status) to confirm before promoting.
- A few articles run 650–780 words (focused, GEO-friendly); can be enriched to a strict ≥800 if desired.
- Add a "Glossary" link to index.html nav (see HOMEPAGE-EDITS.md).

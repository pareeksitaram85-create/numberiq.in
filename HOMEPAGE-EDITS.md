# HOMEPAGE-EDITS.md — small changes to index.html (do yourself)

`index.html` is on the Do-Not-Touch list, so I did **not** edit it. Make these three small, copy-paste changes so the homepage links to the new Tools library. Each is a simple find-and-replace in `index.html`.

---

## Edit 1 — point the nav "Finance Tools" link to the new library

There are **two** places in `index.html` (desktop nav + mobile menu) with this line:

**Find:**
```html
<a href="#tools">Finance Tools</a>
```

**Replace with:**
```html
<a href="tools.html">Tools</a>
```

Do this for **both** occurrences. (If you prefer to keep the homepage tools showcase too, you can instead point it to `tools.html` and leave the on-page `#tools` section as a 6-tool showcase — see Edit 2.)

---

## Edit 2 — make the homepage tools section a 6-tool showcase + "View all"

The homepage should show only your **6 newest/featured tools**, then a button to the full library. At the **end** of your existing tools section (the one with `id="tools"`), add this button just before the section closes:

```html
<div style="text-align:center;margin-top:30px">
  <a href="tools.html" class="btn btn-primary">View all tools
    <svg viewBox="0 0 24 24" width="16" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
  </a>
</div>
```

(Optional) Trim the homepage tools grid to your 6 best cards. Everything else still lives on `tools.html`, so nothing is lost.

---

## Edit 3 — add a "Glossary" link to the nav (optional but recommended)

Next to the Tools/Insights links in both the desktop nav and mobile menu of `index.html`, add:

```html
<a href="glossary.html">Glossary</a>
```

The Tools, Insights and Glossary hubs already link to each other.

---

## Edit 4 — (optional) add a footer link to Privacy Policy

Wherever your homepage footer lists links, add:

```html
<a href="privacy-policy.html">Privacy</a>
```

This is needed for the AdSense appl
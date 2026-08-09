/* ============================================================================
 * NumberIQ module access gate  (shared)
 * ============================================================================
 * Supabase email/password sign-in plus a `user_access` module-permission check.
 * Behaviour is identical to the gate inlined at the top of
 * src/private-modules/attendance-face.html, extracted so a module needs one
 * script tag instead of 130 copy-pasted lines:
 *
 *     <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
 *     <script src="/js/gst-reco-gate.js" data-module-slug="gst-reco-analytics"></script>
 *
 * On success it calls window.appInit(email, isAdmin), or stashes
 * window.__pendingAuth if appInit is not defined yet.
 *
 * WHAT THIS IS AND IS NOT
 * -----------------------
 * This is the UX boundary, not the security boundary. /api/module/<slug>
 * serves the HTML shell without authentication - as every module route in this
 * repo does - so anyone with the URL can load the page.
 *
 * The real boundary is Postgres RLS: gst_has_access() gates every gst_* table,
 * so a visitor without a Supabase session and a matching user_access row sees
 * an empty module. That is why no module may ever ship data as a static file
 * under public/ - a JSON there is world-readable and bypasses all of this.
 *
 * A client-side PIN comparison is NOT a gate. Anything compared in the browser
 * is readable in the browser: a literal password in React source ships to every
 * visitor in the JS bundle. Never reintroduce one.
 * ========================================================================= */

(function () {
  "use strict";

  var SUPABASE_URL = "https://qlvsowlzztsdthqqrhgi.supabase.co";
  var SUPABASE_KEY = "sb_publishable_yrpTeyds6we661S78IdDgg_qv943431";
  var OWNER_EMAIL = "sitaram.pareek@igp.com";

  var self = document.currentScript;
  var MODULE_SLUG = (self && self.getAttribute("data-module-slug")) || "";
  var MODULE_NAME = (self && self.getAttribute("data-module-name")) || "this module";

  if (!MODULE_SLUG) {
    console.error("[gate] missing data-module-slug - refusing to unlock");
  }
  if (!window.supabase || !window.supabase.createClient) {
    console.error("[gate] supabase-js not loaded - include it before this script");
    return;
  }

  var sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      storage: window.sessionStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
  window.sbClient = sb;
  window.moduleLogout = function () {
    sb.auth.signOut().then(function () { location.reload(); });
  };

  var CSS = [
    "body.lg-locked > :not(#loginGate):not(script):not(style):not(datalist){display:none !important}",
    "#loginGate{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:24px;background:radial-gradient(1000px 600px at 18% -10%,rgba(79,124,255,.2),transparent 60%),radial-gradient(900px 600px at 92% 0%,rgba(154,107,255,.18),transparent 55%),#05060a;font-family:'Segoe UI',system-ui,sans-serif}",
    "#loginGate .lg-card{width:min(400px,92vw);position:relative;overflow:hidden;border:1px solid rgba(255,255,255,.16);border-radius:24px;padding:38px 34px 26px;background:linear-gradient(180deg,rgba(20,24,40,.92),rgba(10,12,20,.97));backdrop-filter:blur(24px);box-shadow:0 30px 80px -20px rgba(0,0,0,.7)}",
    "#loginGate .lg-mark{width:46px;height:46px;margin:0 auto 14px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:22px;color:#4f7cff;background:rgba(79,124,255,.12);border:1px solid rgba(79,124,255,.3)}",
    "#loginGate h2{margin:0 0 4px;text-align:center;color:#fff;font-size:20px;letter-spacing:.02em}",
    "#loginGate .lg-sub{text-align:center;color:#8b93a7;font-size:12.5px;margin-bottom:20px}",
    "#loginGate label{display:block;font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#8b93a7;margin:12px 0 5px}",
    "#loginGate input{width:100%;box-sizing:border-box;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.14);border-radius:10px;padding:10px 12px;color:#fff;font-size:14px;outline:none}",
    "#loginGate input:focus{border-color:#4f7cff}",
    "#loginGate button{width:100%;margin-top:16px;padding:11px;border:none;border-radius:10px;background:linear-gradient(120deg,#4f7cff,#6b5bff);color:#fff;font-size:13.5px;font-weight:700;letter-spacing:.03em;cursor:pointer}",
    "#loginGate button:hover{filter:brightness(1.1)}",
    "#loginGate button:disabled{opacity:.6;cursor:default}",
    "#loginGate .lg-err{display:none;margin-top:10px;font-size:12px;color:#ff8b8b;text-align:center}",
    "#loginGate .lg-foot{margin-top:22px;text-align:center;font-size:10.5px;color:#5b6274;letter-spacing:.04em}",
    "#lgLogout{position:fixed;right:14px;bottom:14px;z-index:9999;font-size:11px;color:#8b93a7;background:rgba(10,12,20,.85);border:1px solid rgba(255,255,255,.12);border-radius:8px;padding:5px 10px;cursor:pointer;font-family:'Segoe UI',system-ui,sans-serif}",
    "#lgLogout:hover{color:#fff}",
  ].join("\n");

  var HTML =
    '<div class="lg-card">' +
    '<div class="lg-mark">&#9678;</div>' +
    "<h2>NumberIQ</h2>" +
    '<div class="lg-sub" id="lgSub">Checking session&hellip;</div>' +
    '<div id="lgForm" style="display:none">' +
    "<label>Email</label>" +
    '<input id="lgId" type="email" autocomplete="username" placeholder="you@company.com">' +
    "<label>Password</label>" +
    '<input id="lgPin" type="password" autocomplete="current-password" placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;">' +
    '<button id="lgBtn">Sign In</button>' +
    '<div class="lg-err" id="lgErr">Invalid email or password. Please try again.</div>' +
    '<div style="text-align:center;margin-top:10px"><a href="#" id="lgForgot" style="color:#4f7cff;font-size:12px;text-decoration:none">Forgot password?</a></div>' +
    '<div id="lgMsg" style="display:none;margin-top:10px;font-size:12px;color:#7fb77f;text-align:center"></div>' +
    "</div>" +
    '<div id="lgReset" style="display:none">' +
    "<label>New Password</label>" +
    '<input id="lgNew" type="password" autocomplete="new-password" placeholder="Enter new password (min 6 chars)">' +
    '<button id="lgSetBtn">Set New Password</button>' +
    '<div class="lg-err" id="lgResetErr"></div>' +
    '<div id="lgResetMsg" style="display:none;margin-top:10px;font-size:12px;color:#7fb77f;text-align:center"></div>' +
    "</div>" +
    '<div class="lg-foot">NumberIQ Boardroom &middot; Access restricted</div></div>';

  var gate;

  function boot() {
    var style = document.createElement("style");
    style.textContent = CSS;
    document.head.appendChild(style);

    document.body.className += " lg-locked";
    gate = document.createElement("div");
    gate.id = "loginGate";
    gate.innerHTML = HTML;
    document.body.appendChild(gate);

    byId("lgBtn").onclick = attempt;
    byId("lgPin").onkeydown = function (e) { if (e.key === "Enter") attempt(); };
    byId("lgId").onkeydown = function (e) { if (e.key === "Enter") attempt(); };
    byId("lgForgot").onclick = forgot;
    byId("lgSetBtn").onclick = doReset;

    sb.auth.onAuthStateChange(function (event) {
      if (event === "PASSWORD_RECOVERY") showReset();
    });
    sb.auth.getSession().then(function (res) {
      var s = res && res.data ? res.data.session : null;
      if (s && s.user) checkAccess(s.user.email); else showForm();
    });
  }

  function byId(id) { return document.getElementById(id); }

  function addLogout(email) {
    var b = document.createElement("button");
    b.id = "lgLogout";
    b.textContent = email + " · Logout";
    b.onclick = window.moduleLogout;
    document.body.appendChild(b);
  }

  function showAccessDenied(msg) {
    byId("lgSub").textContent = "Access Restricted";
    byId("lgForm").style.display = "block";
    var er = byId("lgErr");
    er.style.display = "block";
    er.textContent = msg;
    sb.auth.signOut();
  }

  var DENIED = "Access denied. You do not have permission to view " + MODULE_NAME +
    ". Please contact CA Sitaram Pareek.";

  function checkAccess(email) {
    var lower = (email || "").toLowerCase();
    if (lower === OWNER_EMAIL) { unlock(email, true); return; }
    if (!MODULE_SLUG) { showAccessDenied(DENIED); return; }
    sb.from("user_access").select("is_admin, allowed_modules").eq("email", lower).maybeSingle()
      .then(function (res) {
        if (res.error) {
          console.error("[gate] access query error:", res.error);
          showAccessDenied("Error checking access permissions. Please contact administrator.");
          return;
        }
        if (!res.data) { showAccessDenied(DENIED); return; }
        var d = res.data;
        if (d.is_admin || (d.allowed_modules && d.allowed_modules.indexOf(MODULE_SLUG) !== -1)) {
          unlock(email, !!d.is_admin);
        } else {
          showAccessDenied(DENIED);
        }
      })
      .catch(function (err) {
        console.error("[gate] access check failed:", err);
        showAccessDenied("Error checking access permissions. Please contact administrator.");
      });
  }

  function unlock(email, isAdmin) {
    document.body.classList.remove("lg-locked");
    if (gate && gate.parentNode) gate.remove();
    addLogout(email);
    setTimeout(function () { window.dispatchEvent(new Event("resize")); }, 100);
    if (typeof window.appInit === "function") window.appInit(email, isAdmin);
    else window.__pendingAuth = { email: email, isAdmin: isAdmin };
  }

  function showForm() {
    byId("lgSub").textContent = "Sign in to open " + MODULE_NAME;
    byId("lgForm").style.display = "block";
    setTimeout(function () { var el = byId("lgId"); if (el) el.focus(); }, 100);
  }

  function attempt() {
    var email = (byId("lgId").value || "").trim();
    var pass = (byId("lgPin").value || "").trim();
    var btn = byId("lgBtn");
    if (!email || !pass) return;
    btn.disabled = true; btn.textContent = "Signing in…";
    byId("lgErr").style.display = "none";
    sb.auth.signInWithPassword({ email: email, password: pass }).then(function (res) {
      btn.disabled = false; btn.textContent = "Sign In";
      if (res.error || !res.data || !res.data.user) {
        var er = byId("lgErr");
        er.textContent = "Invalid email or password. Please try again.";
        er.style.display = "block";
        return;
      }
      checkAccess(res.data.user.email);
    });
  }

  function forgot(e) {
    e.preventDefault();
    var email = (byId("lgId").value || "").trim();
    if (!email) {
      var er = byId("lgErr");
      er.textContent = "Enter your email first, then click Forgot password.";
      er.style.display = "block";
      return;
    }
    sb.auth.resetPasswordForEmail(email, { redirectTo: window.location.href }).then(function () {
      var msg = byId("lgMsg");
      msg.textContent = "Password reset link sent to " + email;
      msg.style.display = "block";
    });
  }

  function showReset() {
    byId("lgSub").textContent = "Set a new password";
    byId("lgReset").style.display = "block";
  }

  function doReset() {
    var np = (byId("lgNew").value || "").trim();
    var err = byId("lgResetErr");
    if (np.length < 6) {
      err.textContent = "Password must be at least 6 characters.";
      err.style.display = "block";
      return;
    }
    sb.auth.updateUser({ password: np }).then(function (res) {
      if (res.error) { err.textContent = res.error.message; err.style.display = "block"; return; }
      byId("lgReset").style.display = "none";
      var m = byId("lgResetMsg");
      m.textContent = "Password updated. Loading…";
      m.style.display = "block";
      checkAccess(res.data.user.email);
    });
  }

  if (document.body) boot();
  else document.addEventListener("DOMContentLoaded", boot);
})();

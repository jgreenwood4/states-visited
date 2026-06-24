/* ============================================================
   Fifty — States I've set foot in
   Vanilla JS. Renders the pre-projected us-atlas TopoJSON
   (975×610 Albers USA space) with d3-geo + topojson-client.
   ============================================================ */
(function () {
  "use strict";

  // FIPS → { abbr, name } for the 50 states + DC. Territories are excluded.
  var STATES = {
    "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA", "08": "CO",
    "09": "CT", "10": "DE", "11": "DC", "12": "FL", "13": "GA", "15": "HI",
    "16": "ID", "17": "IL", "18": "IN", "19": "IA", "20": "KS", "21": "KY",
    "22": "LA", "23": "ME", "24": "MD", "25": "MA", "26": "MI", "27": "MN",
    "28": "MS", "29": "MO", "30": "MT", "31": "NE", "32": "NV", "33": "NH",
    "34": "NJ", "35": "NM", "36": "NY", "37": "NC", "38": "ND", "39": "OH",
    "40": "OK", "41": "OR", "42": "PA", "44": "RI", "45": "SC", "46": "SD",
    "47": "TN", "48": "TX", "49": "UT", "50": "VT", "51": "VA", "53": "WA",
    "54": "WV", "55": "WI", "56": "WY"
  };
  var DC_FIPS = "11";

  // Small eastern states get a leader-line label out to the right gutter.
  // Anchors are in 975×610 viewBox space, stacked top→bottom.
  var LEADERS = {
    "50": { x: 930, y: 116 }, // VT
    "33": { x: 930, y: 142 }, // NH
    "25": { x: 930, y: 168 }, // MA
    "44": { x: 930, y: 194 }, // RI
    "09": { x: 930, y: 220 }, // CT
    "34": { x: 930, y: 246 }, // NJ
    "10": { x: 930, y: 272 }, // DE
    "24": { x: 930, y: 298 }, // MD
    "11": { x: 930, y: 324 }  // DC
  };

  var STORE_KEY = "fifty-states-visited:v1";
  var THEME_KEY = "fifty-states-theme";
  var SVGNS = "http://www.w3.org/2000/svg";

  // ---- State ----
  var visited = loadVisited();
  var areaTotal = 0;          // total planar area of the 50 states (excl. DC)
  var areaByFips = {};        // fips → planar area
  var pathEls = {};           // fips → <path>
  var labelEls = {};          // fips → <text> (leader labels only)
  var lastDisplayedCount = 0; // for count-up tween

  // ---- DOM refs ----
  var svg = document.getElementById("map");
  var tooltip = document.getElementById("tooltip");
  var stage = document.querySelector(".stage");

  // ============================================================
  // Boot
  // ============================================================
  fetch("data/states-10m.json")
    .then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    })
    .then(buildMap)
    .catch(function (err) {
      var el = document.getElementById("stage-loading");
      if (el) {
        el.textContent = "Couldn't load the map — run via a local server (see README).";
      }
      console.error("[Fifty] Failed to load map data:", err);
    });

  function buildMap(topo) {
    var features = topojson.feature(topo, topo.objects.states).features;

    // Data is raw lon/lat → project with Albers USA, fitted to the 975×610
    // viewBox. Fit on just the 50 states + DC (territories project to null).
    var rendered = features.filter(function (f) { return STATES[f.id]; });
    var projection = d3.geoAlbersUsa().fitSize([975, 610], {
      type: "FeatureCollection",
      features: rendered
    });
    var path = d3.geoPath(projection);

    // First pass: compute areas (excl. DC) so percentages are exact.
    features.forEach(function (f) {
      if (!STATES[f.id]) return;
      var a = path.area(f) || 0;
      areaByFips[f.id] = a;
      if (f.id !== DC_FIPS) areaTotal += a;
    });

    // Sort so the intro stagger reads west→east — a small narrative touch.
    var ordered = features
      .filter(function (f) { return STATES[f.id] && !LEADERS[f.id]; })
      .sort(function (a, b) { return path.centroid(a)[0] - path.centroid(b)[0]; });

    var i = 0;
    ordered.forEach(function (f) {
      drawState(f, path, i++);
    });

    // Leader-line states drawn last (on top), with their labels.
    Object.keys(LEADERS).forEach(function (fips) {
      var f = features.find(function (x) { return x.id === fips; });
      if (f) drawLeaderState(f, path, i++);
    });

    stage.classList.add("is-ready");
    render(true);
    Sync.boot();
  }

  function drawState(f, path, idx) {
    var p = document.createElementNS(SVGNS, "path");
    p.setAttribute("d", path(f));
    p.setAttribute("class", "state intro");
    p.style.animationDelay = (idx * 14) + "ms";
    wireState(p, f);
    svg.appendChild(p);
    pathEls[f.id] = p;
  }

  function drawLeaderState(f, path, idx) {
    var c = path.centroid(f);
    var anchor = LEADERS[f.id];

    // leader line
    var line = document.createElementNS(SVGNS, "line");
    line.setAttribute("x1", c[0]); line.setAttribute("y1", c[1]);
    line.setAttribute("x2", anchor.x - 4); line.setAttribute("y2", anchor.y - 3);
    line.setAttribute("stroke", "var(--state-edge)");
    line.setAttribute("stroke-width", "0.8");
    svg.appendChild(line);

    // the state path itself
    var p = document.createElementNS(SVGNS, "path");
    p.setAttribute("d", path(f));
    p.setAttribute("class", "state intro");
    p.style.animationDelay = (idx * 14) + "ms";
    wireState(p, f);
    svg.appendChild(p);
    pathEls[f.id] = p;

    // label text (also a toggle target with a fat invisible hit area)
    var hit = document.createElementNS(SVGNS, "rect");
    hit.setAttribute("x", anchor.x - 4); hit.setAttribute("y", anchor.y - 11);
    hit.setAttribute("width", 34); hit.setAttribute("height", 16);
    hit.setAttribute("fill", "transparent");
    hit.style.cursor = "pointer";
    wireState(hit, f);
    svg.appendChild(hit);

    var t = document.createElementNS(SVGNS, "text");
    t.setAttribute("x", anchor.x); t.setAttribute("y", anchor.y);
    t.setAttribute("class", "state-label");
    t.textContent = STATES[f.id];
    svg.appendChild(t);
    labelEls[f.id] = t;
  }

  function wireState(el, f) {
    var name = f.properties.name;
    el.setAttribute("tabindex", "0");
    el.setAttribute("role", "button");
    el.setAttribute("aria-label", name);
    el.dataset.fips = f.id;

    el.addEventListener("click", function () { toggle(f.id); });
    el.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggle(f.id);
      }
    });
    el.addEventListener("pointermove", function (e) { showTip(e, f.id); });
    el.addEventListener("pointerleave", hideTip);
    el.addEventListener("focus", function () { showTipAt(f.id); });
    el.addEventListener("blur", hideTip);
  }

  // ============================================================
  // Toggle + persistence
  // ============================================================
  function toggle(fips) {
    if (visited[fips]) {
      delete visited[fips];
    } else {
      visited[fips] = Date.now();
      var p = pathEls[fips];
      if (p) {
        p.classList.remove("just-toggled");
        void p.offsetWidth; // restart animation
        p.classList.add("just-toggled");
      }
    }
    saveVisited();
    render(false);
    Sync.queuePush();
  }

  function loadVisited() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return {};
      var data = JSON.parse(raw);
      // Accept either { fips: timestamp } or [fips, ...]
      if (Array.isArray(data)) {
        var o = {};
        data.forEach(function (k) { o[k] = 1; });
        return o;
      }
      return data || {};
    } catch (e) { return {}; }
  }

  function saveVisited() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(visited)); }
    catch (e) { /* storage full / disabled */ }
  }

  // ============================================================
  // Render
  // ============================================================
  function render(initial) {
    var stateCount = 0, areaVisited = 0, lastFips = null, lastTime = 0;

    Object.keys(STATES).forEach(function (fips) {
      var on = !!visited[fips];
      var p = pathEls[fips];
      if (p) p.classList.toggle("is-visited", on);
      var lbl = labelEls[fips];
      if (lbl) lbl.classList.toggle("is-visited", on);

      if (on) {
        if (fips !== DC_FIPS) {
          stateCount++;
          areaVisited += areaByFips[fips] || 0;
        }
        if (visited[fips] > lastTime) { lastTime = visited[fips]; lastFips = fips; }
      }
    });

    var pctStates = Math.round((stateCount / 50) * 100);
    var pctLand = areaTotal ? Math.round((areaVisited / areaTotal) * 100) : 0;

    // Big counter (animated count-up)
    tweenCount(lastDisplayedCount, stateCount, initial);
    lastDisplayedCount = stateCount;

    // Meter
    document.getElementById("meter-fill").style.transform =
      "scaleX(" + (stateCount / 50) + ")";
    document.getElementById("pct-states").textContent = pctStates + "%";
    document.getElementById("pct-land").textContent = pctLand + "%";

    // Facts
    document.getElementById("fact-remaining").textContent = String(50 - stateCount);
    document.getElementById("fact-last").textContent =
      lastFips && STATES[lastFips] ? fullName(lastFips) : "—";

    // Colophon
    document.getElementById("colophon-count").textContent = String(stateCount);
    document.getElementById("colophon-left").textContent = String(50 - stateCount);
  }

  function tweenCount(from, to, initial) {
    var el = document.getElementById("count-visited");
    if (initial && to === from) { el.textContent = String(to); return; }
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // When hidden, requestAnimationFrame is paused — set the value directly so
    // the counter is never left stale.
    if (reduce || document.hidden || from === to) { el.textContent = String(to); return; }
    var start = performance.now();
    var dur = 420;
    function frame(now) {
      var t = Math.min((now - start) / dur, 1);
      var eased = 1 - Math.pow(1 - t, 3);
      el.textContent = String(Math.round(from + (to - from) * eased));
      if (t < 1) requestAnimationFrame(frame);
      else el.textContent = String(to);
    }
    requestAnimationFrame(frame);
  }

  function fullName(fips) {
    // Pull from rendered path's aria-label (the Census name).
    var p = pathEls[fips];
    return p ? p.getAttribute("aria-label") : STATES[fips];
  }

  // ============================================================
  // Tooltip
  // ============================================================
  function showTip(e, fips) {
    var rect = svg.getBoundingClientRect();
    var x = e.clientX - rect.left;
    var y = e.clientY - rect.top;
    positionTip(x, y, fips);
  }
  function showTipAt(fips) {
    // For keyboard focus: anchor to the element's box center.
    var el = pathEls[fips] || svg.querySelector('[data-fips="' + fips + '"]');
    if (!el) return;
    var b = el.getBoundingClientRect();
    var rect = svg.getBoundingClientRect();
    positionTip(b.left - rect.left + b.width / 2, b.top - rect.top + b.height / 2, fips);
  }
  function positionTip(x, y, fips) {
    var on = !!visited[fips];
    tooltip.innerHTML = fullName(fips) +
      (on ? '<em>visited</em>' : '<em style="color:var(--ink-faint)">not yet</em>');
    tooltip.style.left = x + "px";
    tooltip.style.top = y + "px";
    tooltip.classList.add("is-on");
    tooltip.setAttribute("aria-hidden", "false");
  }
  function hideTip() {
    tooltip.classList.remove("is-on");
    tooltip.setAttribute("aria-hidden", "true");
  }

  // ============================================================
  // Controls: export / import / reset
  // ============================================================
  document.getElementById("btn-export").addEventListener("click", function () {
    var payload = {
      app: "fifty-states-visited",
      version: 1,
      exportedAt: new Date().toISOString(),
      visited: visited
    };
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "states-visited-" + new Date().toISOString().slice(0, 10) + ".json";
    a.click();
    URL.revokeObjectURL(url);
    toast("Backup downloaded");
  });

  var fileInput = document.getElementById("file-import");
  document.getElementById("btn-import").addEventListener("click", function () {
    fileInput.click();
  });
  fileInput.addEventListener("change", function () {
    var file = fileInput.files && fileInput.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(reader.result);
        var incoming = data.visited || data;
        if (Array.isArray(incoming)) {
          var o = {}; incoming.forEach(function (k) { o[k] = 1; }); incoming = o;
        }
        // Keep only valid state FIPS.
        var clean = {};
        Object.keys(incoming).forEach(function (k) {
          if (STATES[k]) clean[k] = incoming[k] === true ? Date.now() : incoming[k];
        });
        visited = clean;
        saveVisited();
        lastDisplayedCount = 0;
        render(false);
        Sync.queuePush();
        toast("Backup restored");
      } catch (e) {
        toast("That file didn't look right");
      }
      fileInput.value = "";
    };
    reader.readAsText(file);
  });

  document.getElementById("btn-reset").addEventListener("click", function () {
    if (!Object.keys(visited).length) { toast("Nothing to reset"); return; }
    if (confirm("Clear all visited states? This can't be undone.")) {
      visited = {};
      saveVisited();
      lastDisplayedCount = 0;
      render(false);
      Sync.queuePush();
      toast("Map cleared");
    }
  });

  // ============================================================
  // Sync — store the map in a private GitHub gist
  // ============================================================
  var Sync = (function () {
    var TOKEN_KEY = "fifty-gh-token";
    var GIST_KEY = "fifty-gist-id";
    var FILE = "visited.json";
    var MARKER = "[fifty-states-visited:v1]";
    var DESC = "🗺️ Fifty — states I've visited " + MARKER;

    var token = localStorage.getItem(TOKEN_KEY) || "";
    var gistId = localStorage.getItem(GIST_KEY) || "";
    var pushTimer = null;
    var pushing = false;
    var pushAgain = false;

    // ---- DOM ----
    var pill = document.getElementById("sync-pill");
    var pillLabel = document.getElementById("sync-label");
    var pillAction = document.getElementById("sync-action");
    var dialog = document.getElementById("sync-dialog");
    var msgEl = document.getElementById("dialog-msg");
    var input = document.getElementById("token-input");
    var connectBtn = document.getElementById("dialog-connect");
    var disconnectBtn = document.getElementById("dialog-disconnect");
    var gistLink = document.getElementById("dialog-gist-link");

    // ---- status pill ----
    function setStatus(status, label) {
      pill.dataset.status = status;
      pillLabel.textContent = label;
      pillAction.textContent = status === "local" ? "Connect →" : "Manage";
    }

    function refreshPill() {
      if (!token) { setStatus("local", "Local only"); return; }
      setStatus("synced", "Synced");
    }

    // ---- GitHub API ----
    function api(method, path, body) {
      return fetch("https://api.github.com" + path, {
        method: method,
        headers: {
          "Authorization": "Bearer " + token,
          "Accept": "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28"
        },
        body: body ? JSON.stringify(body) : undefined
      }).then(function (r) {
        if (!r.ok) {
          var err = new Error("GitHub " + r.status);
          err.status = r.status;
          return r.text().then(function (t) { err.body = t; throw err; });
        }
        return r.status === 204 ? null : r.json();
      });
    }

    function serialize() {
      return JSON.stringify({
        app: "fifty-states-visited",
        version: 1,
        updatedAt: new Date().toISOString(),
        visited: visited
      }, null, 2);
    }

    function adopt(content) {
      try {
        var data = JSON.parse(content);
        var inc = data.visited || {};
        var clean = {};
        Object.keys(inc).forEach(function (k) {
          if (STATES[k]) clean[k] = inc[k] === true ? Date.now() : inc[k];
        });
        visited = clean;
        saveVisited();
        lastDisplayedCount = 0;
        render(false);
        return true;
      } catch (e) { return false; }
    }

    // ---- gist discovery / pull / push ----
    function findGist() {
      return api("GET", "/gists?per_page=100").then(function (list) {
        var match = (list || []).filter(function (g) {
          return g.description && g.description.indexOf(MARKER) !== -1 && g.files && g.files[FILE];
        });
        match.sort(function (a, b) {
          return new Date(b.updated_at) - new Date(a.updated_at);
        });
        return match[0] || null;
      });
    }

    function createGist() {
      var files = {}; files[FILE] = { content: serialize() };
      return api("POST", "/gists", {
        description: DESC, public: false, files: files
      });
    }

    function pull() {
      if (!gistId) return Promise.resolve(false);
      return api("GET", "/gists/" + gistId).then(function (g) {
        var f = g.files && g.files[FILE];
        if (!f) return false;
        // Large files come back truncated with a raw_url; ours never is.
        if (f.truncated && f.raw_url) {
          return fetch(f.raw_url).then(function (r) { return r.text(); }).then(adopt);
        }
        return adopt(f.content);
      });
    }

    function push() {
      if (!token) return Promise.resolve();
      if (pushing) { pushAgain = true; return Promise.resolve(); }
      pushing = true;
      setStatus("saving", "Saving…");

      var ensure = gistId
        ? api("PATCH", "/gists/" + gistId, (function () {
            var f = {}; f[FILE] = { content: serialize() }; return { files: f };
          })())
        : createGist().then(function (g) {
            gistId = g.id;
            localStorage.setItem(GIST_KEY, gistId);
            return g;
          });

      return ensure.then(function () {
        setStatus("synced", "Synced");
      }).catch(function (err) {
        if (err.status === 401) { setStatus("error", "Token expired"); }
        else if (err.status === 404) { // gist deleted — recreate next time
          gistId = ""; localStorage.removeItem(GIST_KEY);
          setStatus("error", "Sync error");
        } else { setStatus("offline", "Offline — saved locally"); }
        console.warn("[Fifty] push failed:", err);
      }).then(function () {
        pushing = false;
        if (pushAgain) { pushAgain = false; return push(); }
      });
    }

    // ---- public ----
    function queuePush() {
      if (!token) return;
      setStatus("saving", "Saving…");
      clearTimeout(pushTimer);
      pushTimer = setTimeout(push, 900);
    }

    function boot() {
      refreshPill();
      if (!token) return;
      setStatus("loading", "Syncing…");
      var step = gistId ? pull() : findGist().then(function (g) {
        if (!g) return push(); // first time on this account
        gistId = g.id;
        localStorage.setItem(GIST_KEY, gistId);
        return pull();
      });
      step.then(function () { refreshPill(); }).catch(function (err) {
        if (err.status === 401) setStatus("error", "Token expired");
        else setStatus("offline", "Offline — local copy");
        console.warn("[Fifty] sync boot failed:", err);
      });
    }

    function connect(newToken) {
      token = newToken.trim();
      if (!token) { showMsg("Paste a token first.", "error"); return; }
      localStorage.setItem(TOKEN_KEY, token);
      showMsg("Connecting…", "");
      setStatus("loading", "Connecting…");
      findGist().then(function (g) {
        if (g) {
          gistId = g.id;
          localStorage.setItem(GIST_KEY, gistId);
          return pull().then(function () { return g; });
        }
        return createGist().then(function (g2) {
          gistId = g2.id;
          localStorage.setItem(GIST_KEY, gistId);
          return g2;
        });
      }).then(function (g) {
        setStatus("synced", "Synced");
        showMsg("Connected — your map now syncs.", "ok");
        renderDialogState();
        toast("Sync connected");
      }).catch(function (err) {
        token = ""; localStorage.removeItem(TOKEN_KEY);
        setStatus("local", "Local only");
        if (err.status === 401) showMsg("That token was rejected. Check it has the gist scope.", "error");
        else showMsg("Couldn't reach GitHub. Check your connection and try again.", "error");
        console.warn("[Fifty] connect failed:", err);
      });
    }

    function disconnect() {
      token = ""; gistId = "";
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(GIST_KEY);
      setStatus("local", "Local only");
      showMsg("Disconnected. Your map stays in this browser.", "");
      renderDialogState();
      toast("Sync disconnected");
    }

    // ---- dialog wiring ----
    function showMsg(text, kind) {
      msgEl.textContent = text;
      msgEl.className = "dialog__msg" + (kind ? " is-" + kind : "");
    }
    function renderDialogState() {
      var connected = !!token;
      disconnectBtn.hidden = !connected;
      connectBtn.textContent = connected ? "Update token" : "Connect";
      if (connected && gistId) {
        gistLink.hidden = false;
        gistLink.href = "https://gist.github.com/" + gistId;
      } else {
        gistLink.hidden = true;
      }
      input.value = "";
    }

    pill.addEventListener("click", function () {
      showMsg("", "");
      renderDialogState();
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
    });
    connectBtn.addEventListener("click", function () { connect(input.value); });
    disconnectBtn.addEventListener("click", disconnect);
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); connect(input.value); }
    });

    return { boot: boot, queuePush: queuePush };
  })();

  // ============================================================
  // Theme
  // ============================================================
  (function initTheme() {
    var saved = localStorage.getItem(THEME_KEY);
    if (saved) document.body.dataset.theme = saved;
    syncThemeLabel();
  })();
  document.getElementById("theme-toggle").addEventListener("click", function () {
    var next = document.body.dataset.theme === "dark" ? "light" : "dark";
    document.body.dataset.theme = next;
    try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
    syncThemeLabel();
  });
  function syncThemeLabel() {
    var dark = document.body.dataset.theme === "dark";
    document.querySelector(".theme-toggle__label").textContent = dark ? "Light" : "Dark";
  }

  // ============================================================
  // Toast
  // ============================================================
  var toastEl;
  var toastTimer;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "toast";
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    requestAnimationFrame(function () { toastEl.classList.add("is-on"); });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("is-on"); }, 2200);
  }
})();

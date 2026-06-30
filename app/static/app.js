/* ============================================================
   Fifty — States I've set foot in
   Renders the pre-projected us-atlas TopoJSON (975×610 Albers
   USA space) with d3-geo + topojson-client.

   Persistence is server-side: the map loads the logged-in user's
   visited states from /api/visited, and each toggle POSTs to
   /api/visited/<fips>. Nothing is stored in the browser, and the
   server only ever returns the current user's own data.
   ============================================================ */
(function () {
  "use strict";

  // FIPS → abbreviation for the 50 states + DC. Territories are excluded.
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

  var SVGNS = "http://www.w3.org/2000/svg";

  // ---- State ----
  var visited = {};           // fips → truthy once loaded from the server
  var areaTotal = 0;          // total planar area of the 50 states (excl. DC)
  var areaByFips = {};        // fips → planar area
  var pathEls = {};           // fips → <path>
  var labelEls = {};          // fips → <text> (leader labels only)
  var lastDisplayedCount = 0; // for count-up tween

  // ---- DOM refs ----
  var svg = document.getElementById("map");
  var tooltip = document.getElementById("tooltip");
  var stage = document.querySelector(".map-card");

  // ============================================================
  // Boot — load the map geometry and the user's visited states together.
  // ============================================================
  Promise.all([
    fetch("/static/data/states-10m.json").then(function (r) {
      if (!r.ok) throw new Error("map HTTP " + r.status);
      return r.json();
    }),
    fetch("/api/visited", { headers: { "Accept": "application/json" } })
      .then(function (r) {
        if (!r.ok) throw new Error("visited HTTP " + r.status);
        return r.json();
      })
  ]).then(function (results) {
    visited = results[1].visited || {};
    buildMap(results[0]);
  }).catch(function (err) {
    var el = document.getElementById("map-loading");
    if (el) el.textContent = "Couldn't load your map — please refresh.";
    console.error("[Fifty] Failed to load:", err);
  });

  function buildMap(topo) {
    var features = topojson.feature(topo, topo.objects.states).features;

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
    ordered.forEach(function (f) { drawState(f, path, i++); });

    // Leader-line states drawn last (on top), with their labels.
    Object.keys(LEADERS).forEach(function (fips) {
      var f = features.find(function (x) { return x.id === fips; });
      if (f) drawLeaderState(f, path, i++);
    });

    stage.classList.add("is-ready");
    render(true);
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

    var line = document.createElementNS(SVGNS, "line");
    line.setAttribute("x1", c[0]); line.setAttribute("y1", c[1]);
    line.setAttribute("x2", anchor.x - 4); line.setAttribute("y2", anchor.y - 3);
    line.setAttribute("stroke", "var(--state-edge)");
    line.setAttribute("stroke-width", "0.8");
    svg.appendChild(line);

    var p = document.createElementNS(SVGNS, "path");
    p.setAttribute("d", path(f));
    p.setAttribute("class", "state intro");
    p.style.animationDelay = (idx * 14) + "ms";
    wireState(p, f);
    svg.appendChild(p);
    pathEls[f.id] = p;

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
  // Toggle — optimistic UI, then persist to the server.
  // ============================================================
  function toggle(fips) {
    var wasOn = !!visited[fips];

    // Optimistically flip locally so the map feels instant.
    if (wasOn) {
      delete visited[fips];
    } else {
      visited[fips] = new Date().toISOString();
      var p = pathEls[fips];
      if (p) {
        p.classList.remove("just-toggled");
        void p.offsetWidth; // restart animation
        p.classList.add("just-toggled");
      }
    }
    render(false);

    // Persist. The server is the source of truth; on failure we roll back.
    fetch("/api/visited/" + fips, {
      method: "POST",
      headers: { "Accept": "application/json" }
    }).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    }).then(function (data) {
      // Reconcile with the server's authoritative answer.
      if (data.visited && !visited[fips]) {
        visited[fips] = new Date().toISOString();
        render(false);
      } else if (!data.visited && visited[fips]) {
        delete visited[fips];
        render(false);
      }
    }).catch(function (err) {
      // Roll back to the previous state and let the user know.
      if (wasOn) visited[fips] = new Date().toISOString();
      else delete visited[fips];
      render(false);
      toast("Couldn't save — check your connection");
      console.warn("[Fifty] toggle failed:", err);
    });
  }

  // ============================================================
  // Render
  // ============================================================
  function render(initial) {
    var stateCount = 0, areaVisited = 0;

    Object.keys(STATES).forEach(function (fips) {
      var on = !!visited[fips];
      var p = pathEls[fips];
      if (p) p.classList.toggle("is-visited", on);
      var lbl = labelEls[fips];
      if (lbl) lbl.classList.toggle("is-visited", on);

      if (on && fips !== DC_FIPS) {
        stateCount++;
        areaVisited += areaByFips[fips] || 0;
      }
    });

    var pctStates = Math.round((stateCount / 50) * 100);
    var pctLand = areaTotal ? Math.round((areaVisited / areaTotal) * 100) : 0;

    tweenCount(lastDisplayedCount, stateCount, initial);
    lastDisplayedCount = stateCount;

    document.getElementById("meter-fill").style.transform =
      "scaleX(" + (stateCount / 50) + ")";
    document.getElementById("pct-states").textContent = pctStates + "%";
    document.getElementById("pct-land").textContent = pctLand + "%";
  }

  function tweenCount(from, to, initial) {
    var el = document.getElementById("count-visited");
    if (initial && to === from) { el.textContent = String(to); return; }
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
    var p = pathEls[fips];
    return p ? p.getAttribute("aria-label") : STATES[fips];
  }

  // ============================================================
  // Tooltip
  // ============================================================
  function showTip(e, fips) {
    var rect = svg.getBoundingClientRect();
    positionTip(e.clientX - rect.left, e.clientY - rect.top, fips);
  }
  function showTipAt(fips) {
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
  // Toast
  // ============================================================
  var toastEl, toastTimer;
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

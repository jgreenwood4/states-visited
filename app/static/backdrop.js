/* ============================================================
   Backdrop — rotating landmark photography.
   Shared by the auth pages and the map page (loaded from base.html).
   Self-contained: it no-ops if the backdrop element isn't present.
   ============================================================ */
(function backdrop() {
  "use strict";

  var PHOTOS = [
    { src: "golden-gate.jpg",  caption: "Golden Gate Bridge — San Francisco, California" },
    { src: "nyc.jpg",          caption: "Empire State Building — New York City" },
    { src: "grand-canyon.jpg", caption: "Grand Canyon — Arizona" },
    { src: "zion.jpg",         caption: "Angels Landing — Zion National Park, Utah" },
    { src: "chicago.jpg",      caption: "Chicago — Illinois" },
    { src: "new-orleans.jpg",  caption: "Jackson Square — New Orleans, Louisiana" },
    { src: "seattle.jpg",      caption: "Seattle — Washington" }
  ];
  // Map filenames to their numbered files under /static/photos/.
  var FILES = {
    "golden-gate.jpg": "01-golden-gate.jpg",
    "nyc.jpg": "02-nyc.jpg",
    "grand-canyon.jpg": "03-grand-canyon.jpg",
    "zion.jpg": "04-zion.jpg",
    "chicago.jpg": "05-chicago.jpg",
    "new-orleans.jpg": "06-new-orleans.jpg",
    "seattle.jpg": "07-seattle.jpg"
  };
  function url(name) { return "/static/photos/" + FILES[name]; }

  var HOLD = 7000; // ms each photo is shown
  var host = document.getElementById("backdrop");
  var captionEl = document.getElementById("photo-caption");
  if (!host) return;

  var idx = Math.floor(Math.random() * PHOTOS.length);
  var slides = [];

  function makeSlide(i) {
    var s = document.createElement("div");
    s.className = "slide";
    s.style.backgroundImage = "url('" + url(PHOTOS[i].src) + "')";
    host.appendChild(s);
    return s;
  }

  function show(i) {
    var next = makeSlide(i);
    void next.offsetWidth; // force layout so the opacity transition runs
    slides.forEach(function (s) { s.classList.remove("is-active"); });
    next.classList.add("is-active");
    slides.push(next);
    while (slides.length > 2) {
      var old = slides.shift();
      if (old && old.parentNode) old.parentNode.removeChild(old);
    }
    setCaption(PHOTOS[i].caption);
  }

  function setCaption(text) {
    if (!captionEl) return;
    captionEl.style.opacity = "0";
    setTimeout(function () {
      captionEl.textContent = text;
      captionEl.style.opacity = "1";
    }, 280);
  }

  // Preload images so cross-fades are seamless.
  PHOTOS.forEach(function (p) { var im = new Image(); im.src = url(p.src); });

  show(idx);
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduce && PHOTOS.length > 1) {
    setInterval(function () {
      if (document.hidden) return;
      idx = (idx + 1) % PHOTOS.length;
      show(idx);
    }, HOLD);
  }
})();

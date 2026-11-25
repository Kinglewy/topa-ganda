/* TOPA — site interactions. Vanilla JS, no dependencies. */
(function () {
  "use strict";
  var doc = document.documentElement;
  doc.classList.remove("no-js");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- Preloader (first page view per session only) ---------- */
  var pre = $(".preloader");
  var seen = false;
  try { seen = sessionStorage.getItem("topa-seen") === "1"; sessionStorage.setItem("topa-seen", "1"); } catch (e) {}
  function ready() { doc.classList.add("is-ready"); }
  if (pre) {
    if (seen || reduce) { pre.remove(); ready(); }
    else {
      var done = function () { setTimeout(function () { pre.classList.add("is-done"); setTimeout(ready, 250); setTimeout(function () { pre.remove(); }, 1300); }, 900); };
      if (document.readyState === "complete") done(); else window.addEventListener("load", done);
      setTimeout(function () { if (pre.isConnected) { pre.classList.add("is-done"); ready(); } }, 3500);
    }
  } else { requestAnimationFrame(ready); }

  /* ---------- Header + scroll progress + back to top ---------- */
  var header = $(".header"), bar = $(".scroll-bar"), topBtn = $(".fab__top"), ring = $(".progress-ring circle");
  var lastY = 0, ticking = false;
  function onScroll() {
    var y = window.scrollY, h = document.body.scrollHeight - window.innerHeight, p = h > 0 ? y / h : 0;
    if (header) {
      header.classList.toggle("is-scrolled", y > 40);
      header.classList.toggle("is-hidden", y > 500 && y > lastY + 4 && !doc.classList.contains("menu-open"));
      if (y < lastY - 4) header.classList.remove("is-hidden");
    }
    if (bar) bar.style.transform = "scaleX(" + p + ")";
    if (topBtn) topBtn.classList.toggle("is-visible", y > 700);
    if (ring) ring.style.strokeDashoffset = 163 - 163 * p;
    parallax();
    timeline();
    lastY = y; ticking = false;
  }
  window.addEventListener("scroll", function () { if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } }, { passive: true });
  if (topBtn) topBtn.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }); });

  /* ---------- Mobile menu ---------- */
  var toggle = $(".menu-toggle");
  if (toggle) {
    var setMenu = function (open) {
      doc.classList.toggle("menu-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    };
    toggle.addEventListener("click", function () { setMenu(!doc.classList.contains("menu-open")); });
    $$(".nav a").forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });
    window.addEventListener("resize", function () { if (window.innerWidth > 960) setMenu(false); });
  }

  /* ---------- Hero slider ---------- */
  var slides = $$(".hero__slide"), dots = $$(".hero__dot"), cur = 0, timer;
  function go(i) {
    if (!slides.length) return;
    slides[cur].classList.remove("is-active"); if (dots[cur]) dots[cur].classList.remove("is-active");
    cur = (i + slides.length) % slides.length;
    var img = slides[cur].querySelector("img");
    if (img && img.dataset.src) { img.src = img.dataset.src; img.srcset = img.dataset.srcset || ""; delete img.dataset.src; }
    slides[cur].classList.add("is-active");
    if (dots[cur]) { void dots[cur].offsetWidth; dots[cur].classList.add("is-active"); }
  }
  function play() { clearInterval(timer); if (!reduce && slides.length > 1) timer = setInterval(function () { go(cur + 1); }, 7000); }
  dots.forEach(function (d, i) { d.addEventListener("click", function () { go(i); play(); }); });
  if (slides.length) {
    // warm the next slides after load
    window.addEventListener("load", function () {
      setTimeout(function () { slides.forEach(function (s) { var im = s.querySelector("img[data-src]"); if (im) { var p = new Image(); p.srcset = im.dataset.srcset || ""; p.src = im.dataset.src; } }); }, 1500);
    });
    play();
  }

  /* ---------- Reveal on scroll, counters, bars ---------- */
  function count(el) {
    var end = parseFloat(el.dataset.count), dec = (el.dataset.count.split(".")[1] || "").length;
    var suffix = el.dataset.suffix || "", prefix = el.dataset.prefix || "", dur = 2000, t0 = null;
    var fmt = function (v) { return prefix + v.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suffix; };
    if (reduce) { el.textContent = fmt(end); return; }
    function step(t) {
      if (!t0) t0 = t;
      var k = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - k, 4);
      el.textContent = fmt(end * e);
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        el.classList.add("in-view");
        if (el.dataset.count) count(el);
        io.unobserve(el);
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });
    $$(".reveal, .clip-reveal, [data-count], .bars").forEach(function (el) { io.observe(el); });
  } else {
    $$(".reveal, .clip-reveal, .bars").forEach(function (el) { el.classList.add("in-view"); });
    $$("[data-count]").forEach(function (el) { el.textContent = (el.dataset.prefix || "") + Number(el.dataset.count).toLocaleString() + (el.dataset.suffix || ""); });
  }

  /* ---------- Parallax ---------- */
  var px = $$("[data-parallax]");
  function parallax() {
    if (reduce || !px.length) return;
    var vh = window.innerHeight;
    px.forEach(function (el) {
      var r = el.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      var speed = parseFloat(el.dataset.parallax) || 0.2;
      var off = (r.top + r.height / 2 - vh / 2) * -speed;
      el.style.transform = "translate3d(0," + off.toFixed(1) + "px,0)";
    });
  }

  /* ---------- Timeline progress ---------- */
  var tl = $(".timeline"), tlBar = $(".timeline__progress");
  function timeline() {
    if (!tl || !tlBar) return;
    var r = tl.getBoundingClientRect(), vh = window.innerHeight;
    var p = Math.min(Math.max((vh * 0.6 - r.top) / r.height, 0), 1);
    tlBar.style.height = (p * (r.height - 20)) + "px";
  }

  /* ---------- Carousel ---------- */
  $$(".carousel").forEach(function (c) {
    var track = $(".carousel__track", c), prev = $("[data-prev]", c.parentElement), next = $("[data-next]", c.parentElement);
    var by = function (d) { var card = track.firstElementChild; var w = card ? card.getBoundingClientRect().width + 22 : 300; track.scrollBy({ left: d * w, behavior: reduce ? "auto" : "smooth" }); };
    if (prev) prev.addEventListener("click", function () { by(-1); });
    if (next) next.addEventListener("click", function () { by(1); });
  });

  /* ---------- Filters (products + gallery) ---------- */
  $$("[data-filter-group]").forEach(function (group) {
    var target = $(group.dataset.filterGroup);
    var btns = $$(".filter-btn", group);
    btns.forEach(function (b) {
      b.addEventListener("click", function () {
        btns.forEach(function (x) { x.classList.toggle("is-active", x === b); x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        var f = b.dataset.filter;
        $$("[data-cat]", target).forEach(function (item) {
          var show = f === "all" || item.dataset.cat.split(" ").indexOf(f) > -1;
          item.classList.toggle("is-filtered-out", !show);
          if (show) { item.classList.remove("in-view"); void item.offsetWidth; item.classList.add("in-view"); }
        });
      });
    });
  });

  /* ---------- Lightbox ---------- */
  var lbItems = $$("[data-lightbox]");
  if (lbItems.length) {
    var lb = document.createElement("div");
    lb.className = "lightbox"; lb.setAttribute("role", "dialog"); lb.setAttribute("aria-modal", "true"); lb.setAttribute("aria-label", "Image viewer");
    var ico = function (d) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + d + '"/></svg>'; };
    lb.innerHTML = '<figure style="margin:0"><img alt=""><figcaption class="lightbox__caption"></figcaption></figure>' +
      '<button class="lightbox__close" aria-label="Close">' + ico("M6 6l12 12M18 6L6 18") + '</button>' +
      '<button class="lightbox__prev" aria-label="Previous image">' + ico("M15 18l-6-6 6-6") + '</button>' +
      '<button class="lightbox__next" aria-label="Next image">' + ico("M9 18l6-6-6-6") + '</button>';
    document.body.appendChild(lb);
    var lbImg = $("img", lb), lbCap = $(".lightbox__caption", lb), idx = 0, lastFocus;
    var visible = function () { return lbItems.filter(function (i) { return !i.classList.contains("is-filtered-out"); }); };
    function show(i) {
      var list = visible(); idx = (i + list.length) % list.length;
      var it = list[idx]; lbImg.src = it.dataset.lightbox; lbImg.alt = it.querySelector("img").alt; lbCap.textContent = it.dataset.caption || lbImg.alt;
    }
    function open(i) { lastFocus = document.activeElement; show(i); lb.classList.add("is-open"); $(".lightbox__close", lb).focus(); document.body.style.overflow = "hidden"; }
    function close() { lb.classList.remove("is-open"); document.body.style.overflow = ""; if (lastFocus) lastFocus.focus(); }
    lbItems.forEach(function (it) { it.addEventListener("click", function (e) { e.preventDefault(); open(visible().indexOf(it)); }); });
    $(".lightbox__close", lb).addEventListener("click", close);
    $(".lightbox__prev", lb).addEventListener("click", function () { show(idx - 1); });
    $(".lightbox__next", lb).addEventListener("click", function () { show(idx + 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) close(); });
    document.addEventListener("keydown", function (e) {
      if (!lb.classList.contains("is-open")) return;
      if (e.key === "Escape") close(); if (e.key === "ArrowLeft") show(idx - 1); if (e.key === "ArrowRight") show(idx + 1);
    });
  }

  /* ---------- Sub-navigation active state ---------- */
  var subLinks = $$(".subnav a");
  if (subLinks.length && "IntersectionObserver" in window) {
    var so = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) subLinks.forEach(function (a) {
          var on = a.getAttribute("href") === "#" + en.target.id;
          a.classList.toggle("is-active", on);
          if (on && a.scrollIntoView) a.parentElement.parentElement.scrollTo({ left: a.offsetLeft - 20, behavior: "smooth" });
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    subLinks.forEach(function (a) { var t = $(a.getAttribute("href")); if (t) so.observe(t); });
  }

  /* ---------- Magnetic buttons (pointer devices) ---------- */
  if (!reduce && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    $$(".btn").forEach(function (b) {
      b.addEventListener("mousemove", function (e) {
        var r = b.getBoundingClientRect();
        b.style.transform = "translate(" + ((e.clientX - r.left - r.width / 2) * 0.15) + "px," + ((e.clientY - r.top - r.height / 2) * 0.25 - 2) + "px)";
      });
      b.addEventListener("mouseleave", function () { b.style.transform = ""; });
    });
  }

  /* ---------- Forms: POST to contact.php, fall back to email ---------- */
  $$("form[data-ajax]").forEach(function (form) {
    var status = $(".form-status", form);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var btn = $("button[type=submit]", form), label = btn ? btn.innerHTML : "";
      if (btn) { btn.disabled = true; btn.textContent = "Sending…"; }
      var data = new FormData(form);
      fetch(form.action, { method: "POST", body: data, headers: { Accept: "application/json" } })
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function (j) {
          if (!j.ok) throw new Error(j.error || "failed");
          status.className = "form-status ok"; status.textContent = j.message || "Thank you! We'll get back to you shortly.";
          form.reset();
        })
        .catch(function () {
          // Fallback: open the visitor's email app with the message pre-filled.
          var body = [];
          data.forEach(function (v, k) { if (k !== "website" && k !== "form") body.push(k.charAt(0).toUpperCase() + k.slice(1) + ": " + v); });
          var subj = (data.get("subject") || data.get("interest") || "Website enquiry");
          window.location.href = "mailto:topauganda@gmail.com?subject=" + encodeURIComponent("[Website] " + subj) + "&body=" + encodeURIComponent(body.join("\n"));
          status.className = "form-status ok"; status.textContent = "Opening your email app to send this message…";
        })
        .then(function () { if (btn) { btn.disabled = false; btn.innerHTML = label; } });
    });
  });

  /* ---------- Footer year ---------- */
  $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  onScroll();
})();

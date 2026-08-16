// Nexara Consulting — interações do site
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Header scroll state
  var header = document.querySelector(".site-header");
  function onScroll() {
    if (window.scrollY > 12) header.classList.add("scrolled");
    else header.classList.remove("scrolled");
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Muted inline playback is supported by mobile browsers, but some require
  // an explicit play attempt after the media element reaches canplay.
  var heroVideo = document.querySelector(".hero-video");
  var heroPlay = document.querySelector(".hero-play");
  if (heroVideo) {
    heroVideo.muted = true;
    heroVideo.setAttribute("muted", "");
    heroVideo.setAttribute("playsinline", "");
    var startHeroVideo = function () {
      var play = heroVideo.play();
      if (play && typeof play.catch === "function") play.catch(function () {
        if (heroPlay) heroPlay.hidden = false;
      });
      heroVideo.classList.add("is-ready");
    };
    heroVideo.addEventListener("loadedmetadata", startHeroVideo, { once: true });
    heroVideo.addEventListener("canplay", startHeroVideo, { once: true });
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) startHeroVideo();
    });
    if (heroPlay) heroPlay.addEventListener("click", function () {
      heroVideo.muted = true;
      heroVideo.play().then(function () { heroPlay.hidden = true; heroVideo.classList.add("is-ready"); }).catch(function () {});
    });
  }

  // Mobile menu
  var toggle = document.querySelector(".nav-toggle");
  var menu = document.getElementById("menu");
  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var open = menu.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    });
    menu.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        menu.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  // Scroll reveal
  var revealEls = document.querySelectorAll(
    ".scroll-copy, .section-title, .section-lead, .card, .method, .modal, .size, .journey, .ba-item, .fact, .step-num, .stat-panel, .check-list, .beth-emblem, .paper-body"
  );
  revealEls.forEach(function (el) { el.classList.add("reveal"); });

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  }

  // Count-up for pesquisa stats
  function animateCount(el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    if (isNaN(target)) return;
    var dur = 1100;
    var start = performance.now();
    function tick(now) {
      var p = Math.min((now - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(eased * target);
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = target;
    }
    requestAnimationFrame(tick);
  }

  var counters = document.querySelectorAll(".fact-num[data-count]");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    counters.forEach(function (el) { el.textContent = el.getAttribute("data-count"); });
  } else {
    var cio = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            cio.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach(function (el) { cio.observe(el); });
  }
})();
// Nexara Consulting — interações do site
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasIO = "IntersectionObserver" in window;

  // Header scroll state
  var header = document.querySelector(".site-header");
  var progress = document.getElementById("progress");
  function onScroll() {
    var y = window.scrollY || 0;
    if (header) header.classList.toggle("scrolled", y > 12);
    if (progress && !reduceMotion) {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = (h > 0 ? (y / h) * 100 : 0) + "%";
    }
    parallax();
  }
  window.addEventListener("scroll", onScroll, { passive: true });

  // Mobile menu
  var toggle = document.querySelector(".nav-toggle");
  var menu = document.getElementById("menu");
  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var open = menu.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    });
    menu.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        menu.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  // Parallax on Beth emblem
  var emblem = document.querySelector(".beth-emblem");
  function parallax() {
    if (reduceMotion || !emblem || window.innerWidth <= 720) {
      if (emblem) emblem.style.transform = "none";
      return;
    }
    var rect = emblem.getBoundingClientRect();
    var offset = (rect.top + rect.height / 2 - window.innerHeight / 2) * -0.06;
    emblem.style.transform = "translateY(" + offset.toFixed(1) + "px)";
  }

  // Reveal targets + stagger inside grids
  var revealEls = document.querySelectorAll(
    ".section-title, .section-lead, .card, .method, .modal, .size, .journey, .ba-item, .fact, .step-num, .beth-emblem, .paper-body, .cost-bars"
  );
  revealEls.forEach(function (el) { el.classList.add("reveal"); });

  // staggered delay for cards within the same parent
  var groups = {};
  revealEls.forEach(function (el) {
    var p = el.parentElement;
    if (!p) return;
    var key = p.className || p.tagName;
    groups[key] = (groups[key] || 0);
    var idx = groups[key];
    if (el.classList.contains("card") || el.classList.contains("method") || el.classList.contains("modal") || el.classList.contains("journey") || el.classList.contains("size") || el.classList.contains("ba-item") || el.classList.contains("fact")) {
      el.style.setProperty("--d", (idx * 70) + "ms");
      groups[key]++;
    }
  });

  // Cost bars + dividers
  var bars = document.querySelectorAll(".cost-bar");
  var dividers = document.querySelectorAll(".divider");

  function addIn(el) { el.classList.add("in"); }

  if (reduceMotion || !hasIO) {
    revealEls.forEach(addIn);
    bars.forEach(addIn);
    dividers.forEach(addIn);
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add("in"); io.unobserve(entry.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(function (el) { io.observe(el); });

    var bio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add("in"); bio.unobserve(entry.target); }
      });
    }, { threshold: 0.4 });
    bars.forEach(function (el) { bio.observe(el); });
    dividers.forEach(function (el) { bio.observe(el); });
  }

  // Active nav link via section observer
  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".nav-list a[href^='#']"));
  var sections = navLinks
    .map(function (a) { return document.querySelector(a.getAttribute("href")); })
    .filter(Boolean);
  if (hasIO && sections.length) {
    var navIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var id = entry.target.id;
          navLinks.forEach(function (a) {
            a.classList.toggle("active", a.getAttribute("href") === "#" + id);
          });
        }
      });
    }, { threshold: 0.5 });
    sections.forEach(function (s) { navIO.observe(s); });
  }

  // Count-up for pesquisa stats
  function animateCount(el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    if (isNaN(target)) return;
    var dur = 1100, start = performance.now();
    function tick(now) {
      var p = Math.min((now - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(eased * target);
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = target;
    }
    requestAnimationFrame(tick);
  }
  var counters = document.querySelectorAll(".fact-num[data-count]");
  if (reduceMotion || !hasIO) {
    counters.forEach(function (el) { el.textContent = el.getAttribute("data-count"); });
  } else {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { animateCount(entry.target); cio.unobserve(entry.target); }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { cio.observe(el); });
  }

  window.addEventListener("resize", parallax, { passive: true });
  onScroll();
})();

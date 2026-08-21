// Nexara Consulting — interações do site
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches && window.innerWidth > 720;
  var hasIO = "IntersectionObserver" in window;

  // Header state, progress and desktop parallax.
  var header = document.querySelector(".site-header");
  var progress = document.getElementById("progress");
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

  function onScroll() {
    var y = window.scrollY || 0;
    if (header) header.classList.toggle("scrolled", y > 12);
    if (progress && !reduceMotion) {
      var height = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = (height > 0 ? (y / height) * 100 : 0) + "%";
    }
    parallax();
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", parallax, { passive: true });

  // Muted inline hero playback for mobile browsers.
  var heroVideo = document.querySelector(".hero-video");
  var heroPlay = document.querySelector(".hero-play");
  if (heroVideo) {
    if (window.matchMedia("(max-width: 720px)").matches && heroVideo.dataset.mobilePoster) {
      heroVideo.poster = heroVideo.dataset.mobilePoster;
    }
    heroVideo.muted = true;
    heroVideo.setAttribute("muted", "");
    heroVideo.setAttribute("playsinline", "");

    var startHeroVideo = function () {
      var play = heroVideo.play();
      if (play && typeof play.catch === "function") {
        play.catch(function () {
          if (heroPlay) heroPlay.hidden = false;
        });
      }
      heroVideo.classList.add("is-ready");
    };

    heroVideo.addEventListener("loadedmetadata", startHeroVideo, { once: true });
    heroVideo.addEventListener("canplay", startHeroVideo, { once: true });
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) startHeroVideo();
    });

    if (heroPlay) {
      heroPlay.addEventListener("click", function () {
        heroVideo.muted = true;
        heroVideo.play().then(function () {
          heroPlay.hidden = true;
          heroVideo.classList.add("is-ready");
        }).catch(function () {});
      });
    }
  }

  // Mobile menu.
  var toggle = document.querySelector(".nav-toggle");
  var menu = document.getElementById("menu");
  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var open = menu.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    });
    menu.addEventListener("click", function (event) {
      if (event.target.tagName === "A") {
        menu.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  // Scroll reveals reset offscreen and replay on every entrance.
  var revealEls = document.querySelectorAll(
    ".scroll-copy, .section-title, .section-lead, .card, .method, .modal, .size, .journey, .ba-item, .fact, .step-num, .stat-panel, .check-list, .beth-emblem, .paper-body, .cost-bars, .promo-video-shell"
  );
  revealEls.forEach(function (el) { el.classList.add("reveal"); });

  var groupIndexes = new Map();
  revealEls.forEach(function (el) {
    var parent = el.parentElement;
    if (!parent) return;
    var index = groupIndexes.get(parent) || 0;
    if (el.matches(".card, .method, .modal, .journey, .size, .ba-item, .fact")) {
      el.style.setProperty("--d", (index * 70) + "ms");
      groupIndexes.set(parent, index + 1);
    }
  });

  var bars = document.querySelectorAll(".cost-bar");
  var dividers = document.querySelectorAll(".divider");

  function showImmediately(el) {
    el.classList.add("in");
  }

  function observeReplay(elements, options) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        entry.target.classList.toggle("in", entry.isIntersecting);
      });
    }, options);
    elements.forEach(function (el) { observer.observe(el); });
  }

  if (reduceMotion || !hasIO) {
    revealEls.forEach(showImmediately);
    bars.forEach(showImmediately);
    dividers.forEach(showImmediately);
  } else {
    observeReplay(revealEls, { threshold: 0.1, rootMargin: "0px 0px -32px 0px" });
    observeReplay(bars, { threshold: 0.35 });
    observeReplay(dividers, { threshold: 0.35 });
  }

  // Active navigation link.
  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".nav-list a[href^='#']"));
  var sections = navLinks.map(function (link) {
    return document.querySelector(link.getAttribute("href"));
  }).filter(Boolean);

  if (hasIO && sections.length) {
    var navObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = entry.target.id;
        navLinks.forEach(function (link) {
          link.classList.toggle("active", link.getAttribute("href") === "#" + id);
        });
      });
    }, { threshold: 0.5 });
    sections.forEach(function (section) { navObserver.observe(section); });
  }

  // Research counters also replay when the user returns to the section.
  var countRuns = new WeakMap();
  function cancelCount(el) {
    countRuns.set(el, (countRuns.get(el) || 0) + 1);
  }

  function animateCount(el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    if (isNaN(target)) return;
    var run = (countRuns.get(el) || 0) + 1;
    countRuns.set(el, run);
    var duration = 1100;
    var start = performance.now();

    function tick(now) {
      if (countRuns.get(el) !== run) return;
      var value = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - value, 3);
      el.textContent = Math.round(eased * target);
      if (value < 1) requestAnimationFrame(tick);
      else el.textContent = target;
    }
    requestAnimationFrame(tick);
  }

  var counters = document.querySelectorAll(".fact-num[data-count]");
  if (reduceMotion || !hasIO) {
    counters.forEach(function (el) { el.textContent = el.getAttribute("data-count"); });
  } else {
    var countObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCount(entry.target);
        } else {
          cancelCount(entry.target);
          entry.target.textContent = "0";
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { countObserver.observe(el); });
  }

  onScroll();
})();

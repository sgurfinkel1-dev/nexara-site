// Nexara Consulting — interações do site
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches && window.innerWidth > 720;
  var hasIO = "IntersectionObserver" in window;

  var header = document.querySelector(".site-header");
  var progress = document.getElementById("progress");
  var emblem = document.querySelector(".beth-emblem");
  var heroCarousel = document.querySelector("[data-carousel]");

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
    if (heroCarousel) heroCarousel.classList.toggle("hero-copy-visible", y > 24);
    if (progress && !reduceMotion) {
      var height = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = (height > 0 ? (y / height) * 100 : 0) + "%";
    }
    parallax();
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", parallax, { passive: true });

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
        play.catch(function () { if (heroPlay) heroPlay.hidden = false; });
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

  var revealEls = document.querySelectorAll(
    ".scroll-copy, .section-title, .section-lead, .card, .method, .modal, .size, .journey, .ba-item, .fact, .step-num, .stat-panel, .check-list, .beth-emblem, .paper-body, .cost-bars, .promo-video-shell, .identity-grid article, .service-grid article, .action-grid a, .testimonial-grid article, .partner-form"
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
  function showImmediately(el) { el.classList.add("in"); }
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

  var countRuns = new WeakMap();
  function cancelCount(el) { countRuns.set(el, (countRuns.get(el) || 0) + 1); }
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

  var carousel = heroCarousel;
  if (carousel) {
    var slides = Array.prototype.slice.call(carousel.querySelectorAll(".hero-slide"));
    var dots = carousel.querySelector(".carousel-dots");
    var current = 0;
    var timer;
    var touchX = 0;

    function showSlide(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, i) { slide.classList.toggle("is-active", i === current); });
      Array.prototype.forEach.call(dots.children, function (dot, i) {
        dot.classList.toggle("is-active", i === current);
        dot.setAttribute("aria-selected", i === current ? "true" : "false");
      });
    }
    function startCarousel() {
      clearInterval(timer);
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        timer = setInterval(function () { showSlide(current + 1); }, 5600);
      }
    }

    slides.forEach(function (_, i) {
      var dot = document.createElement("button");
      dot.type = "button";
      dot.className = "carousel-dot";
      dot.setAttribute("role", "tab");
      dot.setAttribute("aria-label", "Mostrar foto " + (i + 1));
      dot.addEventListener("click", function () { showSlide(i); startCarousel(); });
      dots.appendChild(dot);
    });
    carousel.querySelector("[data-carousel-prev]").addEventListener("click", function () { showSlide(current - 1); startCarousel(); });
    carousel.querySelector("[data-carousel-next]").addEventListener("click", function () { showSlide(current + 1); startCarousel(); });
    carousel.addEventListener("mouseenter", function () { clearInterval(timer); });
    carousel.addEventListener("mouseleave", startCarousel);
    carousel.addEventListener("touchstart", function (event) { touchX = event.touches[0].clientX; }, { passive: true });
    carousel.addEventListener("touchend", function (event) {
      var delta = event.changedTouches[0].clientX - touchX;
      if (Math.abs(delta) > 45) showSlide(current + (delta < 0 ? 1 : -1));
      startCarousel();
    }, { passive: true });
    showSlide(0);
    startCarousel();
  }

  if (new URLSearchParams(window.location.search).get("form") === "sucesso") {
    var formStatus = document.getElementById("form-status");
    if (formStatus) formStatus.textContent = "Mensagem enviada. A equipe Nexara entrará em contato.";
  }

  onScroll();
})();

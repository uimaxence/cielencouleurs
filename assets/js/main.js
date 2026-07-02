/* ============================================================
   Ciel en Couleurs — interactions (sobres)
   ============================================================ */
(function () {
  "use strict";

  const nav = document.querySelector(".nav");
  const burger = document.querySelector(".burger");

  /* --- Nav : fond translucide au scroll --------------------- */
  const onScroll = () => {
    if (!nav) return;
    nav.classList.toggle("is-scrolled", window.scrollY > 24);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* --- Menu mobile ------------------------------------------ */
  if (burger && nav) {
    const toggle = (open) => {
      const isOpen = open ?? !nav.classList.contains("is-open");
      nav.classList.toggle("is-open", isOpen);
      burger.setAttribute("aria-expanded", String(isOpen));
      document.body.style.overflow = isOpen ? "hidden" : "";
    };
    burger.addEventListener("click", () => toggle());
    nav.querySelectorAll(".nav__mobile a").forEach((a) =>
      a.addEventListener("click", () => toggle(false))
    );
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") toggle(false);
    });
  }

  /* --- Révélations au scroll -------------------------------- */
  const reveals = document.querySelectorAll(".reveal");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduce || !("IntersectionObserver" in window)) {
    reveals.forEach((el) => el.classList.add("is-in"));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.transitionDelay =
              (entry.target.dataset.delay || 0) + "ms";
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    reveals.forEach((el) => io.observe(el));
  }

  /* --- Social proof : comptage animé des chiffres -----------
     Déclenché quand le chiffre entre dans la vue (au scroll de l'utilisateur), donc joué
     même en « prefers-reduced-motion » — au même titre que le pêle-mêle. */
  const counters = document.querySelectorAll(".socialproof__num[data-count]");
  const animateCount = (el) => {
    const target = parseInt(el.dataset.count, 10) || 0;
    const prefix = el.dataset.prefix || "";
    const suffix = el.dataset.suffix || "";
    const dur = 1400, start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      el.textContent = prefix + Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if (counters.length) {
    if (!("IntersectionObserver" in window)) {
      counters.forEach(animateCount);
    } else {
      const cio = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              animateCount(entry.target);
              cio.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.6 }
      );
      counters.forEach((el) => {
        // valeur de départ à 0 pour éviter un flash du chiffre final avant le comptage
        el.textContent = (el.dataset.prefix || "") + "0" + (el.dataset.suffix || "");
        cio.observe(el);
      });
    }
  }

  /* --- Formulaire : état de succès (démo, pas de backend) --- */
  const form = document.querySelector(".form");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      form.classList.add("is-sent");
      const success = form.querySelector(".form__success");
      if (success) {
        success.classList.add("is-visible");
        success.setAttribute("tabindex", "-1");
        success.focus({ preventScroll: false });
        success.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
      }
      // TODO(intégration) : POST vers backend + notification email + attribution.
    });
  }

  /* --- Occasions : fond qui reprend l'image survolée --------- */
  const occSection = document.querySelector(".occasions");
  const occBg = document.querySelector(".occasions__bg");
  if (occSection && occBg) {
    occSection.querySelectorAll(".occ[data-bg]").forEach((card) => {
      card.addEventListener("mouseenter", () => {
        occBg.style.backgroundImage = `url("${card.dataset.bg}")`;
        occSection.classList.add("is-hovering");
      });
    });
    const grid = occSection.querySelector(".occasions__grid");
    if (grid) grid.addEventListener("mouseleave", () => occSection.classList.remove("is-hovering"));
  }

  /* --- Pêle-mêle : déploiement des photos piloté au scroll ---
     Positions calculées en JS (et non en calc() CSS) pour marcher partout, Safari inclus. */
  const pele = document.querySelector("[data-pelemele]");
  if (pele) {
    const cards = Array.prototype.slice.call(pele.querySelectorAll(".polaroid")).map((el) => {
      const cs = getComputedStyle(el);
      const num = (v) => parseFloat(cs.getPropertyValue(v)) || 0;
      return { el, dx: num("--dx"), dy: num("--dy"), rot: num("--rot"), ox: num("--ox"), oy: num("--oy"), rot0: num("--rot0") };
    });
    const applyP = (p) => {
      const spread = window.matchMedia("(max-width: 760px)").matches ? 0.5 : 1;
      for (let i = 0; i < cards.length; i++) {
        const c = cards[i];
        const x = c.ox + c.dx * p * spread;
        const y = c.oy + c.dy * p * spread;
        const r = c.rot0 + c.rot * p;
        c.el.style.transform =
          "translate(-50%, -50%) translate(" + x.toFixed(1) + "px, " + y.toFixed(1) + "px) rotate(" + r.toFixed(2) + "deg)";
      }
    };

    // Déploiement piloté par le scroll (interaction demandée). On l'active même en
    // « prefers-reduced-motion » car c'est l'utilisateur qui la déclenche en scrollant,
    // et non une animation qui se joue toute seule.
    let ticking = false;
    const update = () => {
      ticking = false;
      const rect = pele.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      // Empilé tant que la section est basse ; déployé quand elle est bien cadrée
      const start = vh * 0.5;   // à mi-viewport : encore empilé (p=0)
      const end = vh * 0.11;    // section cadrée sous la nav : déployé, les 8 photos visibles (p=1)
      let p = (start - rect.top) / (start - end);
      p = Math.max(0, Math.min(1, p));
      applyP(p);
    };
    const onScrollPele = () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    };
    window.addEventListener("scroll", onScrollPele, { passive: true });
    window.addEventListener("resize", onScrollPele, { passive: true });
    update();
  }

  /* --- Lightbox : ouvrir une réalisation en grand ----------- */
  const lightbox = document.getElementById("lightbox");
  if (lightbox) {
    const lbImg = lightbox.querySelector(".lightbox__img");
    const lbCap = lightbox.querySelector(".lightbox__cap");
    const lbClose = lightbox.querySelector(".lightbox__close");
    let lastFocused = null;

    const openLb = (fig) => {
      const img = fig.querySelector("img");
      const cap = fig.querySelector(".polaroid__cap");
      if (!img) return;
      lbImg.src = img.currentSrc || img.src;
      lbImg.alt = img.alt || "";
      lbCap.textContent = cap ? cap.textContent : "";
      lastFocused = fig;
      lightbox.classList.add("is-open");
      lightbox.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      lbClose.focus();
    };
    const closeLb = () => {
      lightbox.classList.remove("is-open");
      lightbox.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      if (lastFocused) lastFocused.focus();
    };

    document.querySelectorAll(".polaroid").forEach((fig) => {
      fig.addEventListener("click", () => openLb(fig));
      fig.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openLb(fig); }
      });
    });
    lbClose.addEventListener("click", closeLb);
    lightbox.addEventListener("click", (e) => { if (e.target === lightbox) closeLb(); });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && lightbox.classList.contains("is-open")) closeLb();
    });
  }

  /* --- Année dynamique du footer ---------------------------- */
  const y = document.querySelector("[data-year]");
  if (y) y.textContent = new Date().getFullYear();
})();

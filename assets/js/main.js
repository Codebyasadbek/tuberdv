(() => {
  const desktop = window.matchMedia("(min-width: 1024px)");

  /* ---------- Mobile menu ---------- */
  const header = document.querySelector("[data-header]");
  const menuToggle = header?.querySelector("[data-menu-toggle]");

  const setMenu = (open) => {
    header.classList.toggle("is-menu-open", open);
    menuToggle.setAttribute("aria-expanded", String(open));
  };

  if (menuToggle) {
    menuToggle.addEventListener("click", () => setMenu(!header.classList.contains("is-menu-open")));
    header.querySelectorAll(".nav__link").forEach((link) => link.addEventListener("click", () => setMenu(false)));
    desktop.addEventListener("change", () => setMenu(false));

    // The menu is an overlay: close it on a click outside the header and on Escape
    document.addEventListener("click", (event) => {
      if (header.classList.contains("is-menu-open") && !header.contains(event.target)) setMenu(false);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && header.classList.contains("is-menu-open")) {
        setMenu(false);
        menuToggle.focus();
      }
    });
  }

  /* ---------- Services: tabs on desktop, accordion on mobile ---------- */
  document.querySelectorAll("[data-tabs]").forEach((root) => {
    const tabs = [...root.querySelectorAll("[data-tab]")];
    const panelOf = (tab) => document.getElementById(tab.getAttribute("aria-controls"));

    const activate = (current) => {
      tabs.forEach((tab) => {
        const isOpen = tab === current;
        tab.setAttribute("aria-expanded", String(isOpen));
        panelOf(tab).hidden = !isOpen;
      });
    };

    const syncWithViewport = () => {
      const open = tabs.find((tab) => tab.getAttribute("aria-expanded") === "true");
      if (desktop.matches && !open) activate(tabs[0]);
    };

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const isOpen = tab.getAttribute("aria-expanded") === "true";
        // On mobile a second tap collapses the panel; on desktop one tab is always open
        activate(isOpen && !desktop.matches ? null : tab);
      });
    });

    if (!desktop.matches) activate(null);
    desktop.addEventListener("change", syncWithViewport);
  });

  /* ---------- Sliders (Swiper) ---------- */
  // slidesPerView: "auto" — slide widths are set in CSS, so any number of cards from the CMS fits
  if (window.Swiper) {
    const hero = document.querySelector("[data-hero-slider]");
    if (hero) {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      new Swiper(hero, {
        loop: true,
        grabCursor: true,
        watchOverflow: true,
        autoplay: reduceMotion ? false : { delay: 6000, pauseOnMouseEnter: true, disableOnInteraction: false },
        pagination: { el: document.querySelector("[data-hero-pagination]"), clickable: true, bulletElement: "button" },
      });
    }

    const doctors = document.querySelector("[data-doctors-slider]");
    if (doctors) {
      new Swiper(doctors, {
        slidesPerView: "auto",
        spaceBetween: 18,
        grabCursor: true,
        watchOverflow: true,
        breakpoints: { 1024: { spaceBetween: 21.25 } },
      });
    }

    const documents = document.querySelector("[data-documents-slider]");
    if (documents) {
      new Swiper(documents, {
        slidesPerView: "auto",
        spaceBetween: 18,
        grabCursor: true,
        watchOverflow: true,
        navigation: {
          prevEl: document.querySelector("[data-documents-prev]"),
          nextEl: document.querySelector("[data-documents-next]"),
        },
        breakpoints: { 1024: { spaceBetween: 20 } },
      });
    }
  }
})();

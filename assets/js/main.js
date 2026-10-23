(() => {
  const desktop = window.matchMedia("(min-width: 1024px)");

  /* ---------- Dropdown menu: burger on mobile, square menu button on desktop ---------- */
  const header = document.querySelector("[data-header]");
  const menuToggles = header ? [...header.querySelectorAll("[data-menu-toggle]")] : [];

  const isMenuOpen = () => header.classList.contains("is-menu-open");
  const setMenu = (open) => {
    header.classList.toggle("is-menu-open", open);
    menuToggles.forEach((toggle) => toggle.setAttribute("aria-expanded", String(open)));
  };

  if (menuToggles.length) {
    menuToggles.forEach((toggle) => toggle.addEventListener("click", () => setMenu(!isMenuOpen())));
    header.querySelectorAll(".menu__link").forEach((link) => link.addEventListener("click", () => setMenu(false)));
    desktop.addEventListener("change", () => setMenu(false));

    // The menu is an overlay: close it on a click outside the header and on Escape
    document.addEventListener("click", (event) => {
      if (isMenuOpen() && !header.contains(event.target)) setMenu(false);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && isMenuOpen()) {
        setMenu(false);
        menuToggles.find((toggle) => toggle.offsetParent)?.focus(); // the button visible at this width
      }
    });
  }

  /* ---------- Desktop menu dropdowns («Диагностика») ---------- */
  document.querySelectorAll("[data-dropdown-toggle]").forEach((toggle) => {
    const item = toggle.parentElement;
    const setOpen = (open) => toggle.setAttribute("aria-expanded", String(open));
    toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
    document.addEventListener("click", (event) => {
      if (!item.contains(event.target)) setOpen(false);
    });
    item.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggle.focus();
      }
    });
  });

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

  /* ---------- Prices: a tab per doctor / cabinet ---------- */
  document.querySelectorAll("[data-price-tabs]").forEach((root) => {
    const tabs = [...root.querySelectorAll('[role="tab"]')];
    const select = (current) => {
      tabs.forEach((tab) => {
        const isOn = tab === current;
        tab.setAttribute("aria-selected", String(isOn));
        tab.tabIndex = isOn ? 0 : -1;
        document.getElementById(tab.getAttribute("aria-controls")).hidden = !isOn;
      });
    };
    tabs.forEach((tab) => tab.addEventListener("click", () => select(tab)));
  });

  /* ---------- Service search: filters the service types and the price rows ---------- */
  const search = document.querySelector("[data-service-search]");
  if (search) {
    const input = search.querySelector("input");
    const clear = search.querySelector("[data-search-clear]");
    const typeButtons = [...document.querySelectorAll("[data-service-type]")];
    const rows = [...document.querySelectorAll("[data-price-row]")];
    const normalize = (text) => text.toLowerCase().replace(/ё/g, "е").trim();

    // terms: words to look for (any of them); an empty list shows everything
    const filter = (terms, filterTypes) => {
      const matches = (text) => !terms.length || terms.some((term) => normalize(text).includes(term));
      typeButtons.forEach((btn) => (btn.parentElement.hidden = filterTypes && !matches(btn.textContent)));
      rows.forEach((row) => (row.hidden = !matches(row.cells[0].textContent)));
      document.querySelectorAll("[data-price-empty]").forEach((note) => {
        note.hidden = [...note.parentElement.querySelectorAll("[data-price-row]")].some((row) => !row.hidden);
      });
      // Prices page: hide the sections with nothing found, and say so when nothing is found at all
      const sections = [...document.querySelectorAll("[data-price-section]")];
      sections.forEach((section) => {
        section.hidden = terms.length > 0 && ![...section.querySelectorAll("[data-price-row]")].some((row) => !row.hidden);
      });
      const emptyAll = document.querySelector("[data-search-empty]");
      if (emptyAll) emptyAll.hidden = !sections.length || sections.some((section) => !section.hidden);
      clear.hidden = !input.value;
    };

    const pressType = (current) => typeButtons.forEach((btn) => btn.setAttribute("aria-pressed", String(btn === current)));

    input.addEventListener("input", () => {
      pressType(null);
      const query = normalize(input.value);
      filter(query ? [query] : [], true);
    });

    // A service type shows its prices; a second click shows all of them again
    typeButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const isOn = btn.getAttribute("aria-pressed") === "true";
        pressType(isOn ? null : btn);
        input.value = isOn ? "" : btn.textContent;
        filter(isOn ? [] : btn.dataset.serviceType.split(",").map(normalize), false);
        if (!isOn) document.getElementById("ceny")?.scrollIntoView();
      });
    });

    clear.addEventListener("click", () => {
      input.value = "";
      pressType(null);
      filter([], true);
      input.focus();
    });
  }

  /* ---------- Booking form: sends the request to send.php without leaving the page ---------- */
  document.querySelectorAll("[data-booking-form]").forEach((form) => {
    const status = form.querySelector("[data-form-status]");
    const button = form.querySelector('[type="submit"]');
    const show = (text, kind) => {
      status.hidden = false;
      status.textContent = text;
      status.className = `form__status${kind ? ` form__status--${kind}` : ""}`;
    };

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      button.disabled = true;
      show("Отправляем…");
      try {
        const response = await fetch(form.action, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } });
        const result = await response.json();
        if (!response.ok || !result.ok) throw new Error(result.error || "send failed");
        form.reset();
        show("Спасибо! Заявка отправлена, администратор перезвонит вам в рабочее время.", "ok");
      } catch {
        show("Не удалось отправить заявку. Позвоните нам: +7 (4212) 456-000.", "error");
      } finally {
        button.disabled = false;
      }
    });
  });

  /* ---------- Search from the header lands on the prices page with ?q= ---------- */
  const query = new URLSearchParams(location.search).get("q");
  const searchInput = document.querySelector("[data-service-search] input");
  if (query && searchInput) {
    searchInput.value = query;
    searchInput.dispatchEvent(new Event("input"));
  }

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
      const doctorsSwiper = new Swiper(doctors, {
        slidesPerView: "auto",
        spaceBetween: 18,
        grabCursor: true,
        watchOverflow: true,
        breakpoints: { 1024: { spaceBetween: 21.25 } },
        on: {
          lock: () => doctors.classList.add("is-locked"),
          unlock: () => doctors.classList.remove("is-locked"),
        },
      });
      doctors.classList.toggle("is-locked", doctorsSwiper.isLocked);
    }

    const gallery = document.querySelector("[data-gallery-slider]");
    if (gallery) {
      new Swiper(gallery, {
        slidesPerView: "auto",
        spaceBetween: 15,
        grabCursor: true,
        watchOverflow: true,
        navigation: {
          prevEl: document.querySelector("[data-gallery-prev]"),
          nextEl: document.querySelector("[data-gallery-next]"),
        },
        breakpoints: { 1024: { spaceBetween: 20 } },
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

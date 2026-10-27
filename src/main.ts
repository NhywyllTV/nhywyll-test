import "./styles.css";
import {
  translations,
  languages,
  DEFAULT_LANGUAGE,
  isSupportedLanguage,
} from "./lang/index";

// Sprache festlegen: erst die gespeicherte Wahl, dann die Browsersprachen, sonst DEFAULT_LANGUAGE.
const getInitialLanguage = (): string => {
  // Nur uebernehmen, wenn es die Sprache (noch) gibt - sonst saehe man nach dem
  // Entfernen einer Sprache dauerhaft nur Uebersetzungsschluessel.
  const saved = localStorage.getItem("language");
  if (isSupportedLanguage(saved)) return saved;

  // Bevorzugte Browsersprachen der Reihe nach; "de-AT" zaehlt als "de".
  const preferred = navigator.languages?.length
    ? navigator.languages
    : [navigator.language];
  for (const tag of preferred) {
    const base = tag?.toLowerCase().split("-")[0];
    if (isSupportedLanguage(base)) return base;
  }
  return DEFAULT_LANGUAGE;
};

// Produktion und Test-Umgebung melden in getrennte Properties.
const PROD_HOSTNAME = "nhywyll.com";
const GA_ID_PROD = "G-0M4NYGENS4";
const GA_ID_TEST = "G-R18WRP31XQ";

const isProduction = () =>
  window.location.hostname === PROD_HOSTNAME ||
  window.location.hostname === `www.${PROD_HOSTNAME}`;

function initAnalytics() {
  const gaId = isProduction() ? GA_ID_PROD : GA_ID_TEST;
  (window as any)[`ga-disable-${gaId}`] = false;

  if (document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${gaId}"]`)) {
    return;
  }

  const script1 = document.createElement("script");
  script1.async = true;
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
  document.head.appendChild(script1);

  const script2 = document.createElement("script");
  script2.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${gaId}');
    `;
  document.head.appendChild(script2);
}

function clearAnalyticsCookies() {
  const cookies = document.cookie.split(";");
  const host = window.location.hostname;
  const domains = [host, `.${host}`];
  if (host.includes(".")) {
    const parts = host.split(".");
    if (parts.length > 2) {
      domains.push(`.${parts.slice(-2).join(".")}`);
    }
  }
  for (const cookie of cookies) {
    const name = cookie.split("=")[0].trim();
    if (name === "_ga" || name.startsWith("_ga_") || name.startsWith("_gid")) {
      for (const domain of domains) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${domain};`;
      }
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    }
  }
}

function disableAnalytics() {
  const gaId = isProduction() ? GA_ID_PROD : GA_ID_TEST;
  (window as any)[`ga-disable-${gaId}`] = true;
  clearAnalyticsCookies();
}

let currentLanguage = getInitialLanguage();

// Die Funktion zum Texte austauschen
function updateTexts() {
  const strings = translations[currentLanguage];
  if (!strings) {
    console.error("Keine Texte für Sprache gefunden:", currentLanguage);
    return;
  }

  const elements = document.querySelectorAll(
    "[data-i18n], [data-i18n-html], [data-i18n-placeholder], [data-i18n-aria-label], [data-i18n-title], [data-i18n-alt]",
  );

  elements.forEach((el) => {
    const htmlEl = el as HTMLElement;
    
    // Check for standard text content
    const textKey = htmlEl.getAttribute("data-i18n");
    if (textKey && strings[textKey]) {
      htmlEl.textContent = strings[textKey];
    }

    // Check for HTML content
    const htmlKey = htmlEl.getAttribute("data-i18n-html");
    if (htmlKey && strings[htmlKey]) {
      htmlEl.innerHTML = strings[htmlKey];
    }

    // Check for placeholder
    const placeholderKey = htmlEl.getAttribute("data-i18n-placeholder");
    if (placeholderKey && strings[placeholderKey]) {
      (htmlEl as HTMLInputElement).placeholder = strings[placeholderKey];
    }

    // Check for alt text (Bildbeschreibung fuer Screenreader)
    const altKey = htmlEl.getAttribute("data-i18n-alt");
    if (altKey && strings[altKey] && htmlEl instanceof HTMLImageElement) {
      htmlEl.alt = strings[altKey];
    }

    // Check for aria-label
    const ariaKey = htmlEl.getAttribute("data-i18n-aria-label");
    if (ariaKey && strings[ariaKey]) {
      htmlEl.setAttribute("aria-label", strings[ariaKey]);
    }

    // Check for title
    const titleKey = htmlEl.getAttribute("data-i18n-title");
    if (titleKey && strings[titleKey]) {
      htmlEl.setAttribute("title", strings[titleKey]);
    }
  });

  document.documentElement.lang = currentLanguage;
  // Texts are in place: show them (hidden by the early script in head-common.html).
  document.documentElement.classList.remove("i18n-pending");
  updateLanguageUI();
  updateThemeLabel();
  updateMenuLabel();
}

function updateLanguageUI() {
  const activeLangSpan = document.querySelector(".active-lang");
  if (activeLangSpan) {
    // Hier wird NUR die Flagge gesetzt, der Pfeil ist ein Geschwister-Element in header.html
    activeLangSpan.innerHTML = `<img src="/images/flags/${currentLanguage}.svg" alt="" class="flag-icon">`;
  }
  const activeLangCode = document.querySelector(".active-lang-code");
  if (activeLangCode) {
    activeLangCode.textContent = currentLanguage.toUpperCase();
  }

  const options = document.querySelectorAll(".lang-opt");
  options.forEach((opt) => {
    const htmlOpt = opt as HTMLElement;
    const lang = htmlOpt.dataset.lang;

    // Update selection state
    if (lang === currentLanguage) {
      htmlOpt.classList.add("active");
      htmlOpt.setAttribute("aria-current", "true");
    } else {
      htmlOpt.classList.remove("active");
      htmlOpt.removeAttribute("aria-current");
    }

    // Add flag icon to option if not already present
    if (lang && !htmlOpt.querySelector(".flag-icon")) {
      const flagImg = document.createElement("img");
      flagImg.src = `/images/flags/${lang}.svg`;
      flagImg.className = "flag-icon";
      flagImg.alt = ""; // dekorativ, der Sprachname steht daneben
      htmlOpt.prepend(flagImg);
    }
  });
}

// 4. Sprachaustausch-Logik & Dropdown
function setupLanguageSwitcher() {
  const switcher = document.querySelector(".language-switcher");
  const currentBtn = document.querySelector(".current-lang");

  // Optionen aus dem Sprachregister erzeugen, damit neue Sprachen ohne
  // Aenderung an header.html im Menue auftauchen.
  const menu = document.getElementById("lang-menu");
  menu?.replaceChildren(
    ...languages.map(({ code, name }) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "lang-opt";
      btn.dataset.lang = code;
      btn.lang = code; // Screenreader sprechen den Sprachnamen in der Sprache selbst aus
      btn.textContent = name;
      return btn;
    }),
  );
  const options = document.querySelectorAll(".lang-opt");

  if (!switcher || !currentBtn) return;

  // Dropdown öffnen/schließen
  currentBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = switcher.classList.toggle("open");
    currentBtn.setAttribute("aria-expanded", String(isOpen));
  });

  // Dropdown per Escape schliessen und Fokus zurueckgeben
  switcher.addEventListener("keydown", (e) => {
    if ((e as KeyboardEvent).key === "Escape" && switcher.classList.contains("open")) {
      switcher.classList.remove("open");
      currentBtn.setAttribute("aria-expanded", "false");
      (currentBtn as HTMLElement).focus();
    }
  });

  // Sprache wählen
  options.forEach((opt) => {
    opt.addEventListener("click", () => {
      const lang = (opt as HTMLElement).dataset.lang;
      if (isSupportedLanguage(lang) && lang !== currentLanguage) {
        currentLanguage = lang;
        localStorage.setItem("language", lang);
        updateTexts();
      }
      switcher.classList.remove("open");
      currentBtn.setAttribute("aria-expanded", "false");
      // Without this, keyboard focus would stay on the now hidden option.
      (currentBtn as HTMLElement).focus();
    });
  });

  // Close when keyboard focus leaves the language menu (Tab past the last option).
  switcher.addEventListener("focusout", (e) => {
    const next = (e as FocusEvent).relatedTarget as Node | null;
    if (switcher.classList.contains("open") && (!next || !switcher.contains(next))) {
      switcher.classList.remove("open");
      currentBtn.setAttribute("aria-expanded", "false");
    }
  });

  // Schließen wenn man außerhalb klickt
  document.addEventListener("click", () => {
    switcher.classList.remove("open");
    currentBtn.setAttribute("aria-expanded", "false");
  });
}
// 6. Mobile Menü Logik
// Phone menu button shows a visible word ("Menu" / "Close"), not only an icon.
function updateMenuLabel() {
  const label = document.querySelector("#menu-toggle .menu-label");
  const toggle = document.getElementById("menu-toggle");
  if (!label || !toggle) return;
  const strings = translations[currentLanguage];
  const isOpen = toggle.getAttribute("aria-expanded") === "true";
  label.textContent = strings?.[isOpen ? "nav_close" : "nav_menu"] ?? (isOpen ? "Close" : "Menu");
}

function setupNavigation() {
  const menuToggle = document.getElementById("menu-toggle");
  const navUl = document.getElementById("nav-menu");

  const header = document.querySelector(".nav-bar");
  if (!menuToggle || !navUl) return;

  const closeMenu = () => {
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.classList.remove("open");
    navUl.classList.remove("open");
    header?.classList.remove("menu-open");
    updateMenuLabel();
  };

  menuToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", (!isExpanded).toString());
    menuToggle.classList.toggle("open");
    navUl.classList.toggle("open");
    header?.classList.toggle("menu-open", !isExpanded);
    updateMenuLabel();
  });

  // Schließen beim Klick auf einen Navigationslink
  navUl.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  // Close when keyboard focus leaves the bar (Tab past the last menu entry).
  header?.addEventListener("focusout", (e) => {
    const next = (e as FocusEvent).relatedTarget as Node | null;
    if (navUl.classList.contains("open") && next && !header.contains(next)) {
      closeMenu();
    }
  });

  // Schließen per Escape-Taste
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && navUl.classList.contains("open")) {
      closeMenu();
      menuToggle.focus();
    }
  });

  // Schließen bei Klick außerhalb des Menüs
  document.addEventListener("click", (e) => {
    if (navUl.classList.contains("open") && !navUl.contains(e.target as Node) && e.target !== menuToggle) {
      closeMenu();
    }
  });
}

// Theme toggle: light = sky (mint), dark = deep water (indigo).
// The moon/sun icon is switched by CSS; the label says what a click does.
function updateThemeLabel() {
  const themeToggle = document.getElementById("theme-toggle");
  if (!themeToggle) return;
  const strings = translations[currentLanguage];
  const isLight = document.documentElement.classList.contains("light-theme");
  const key = isLight ? "aria_theme_to_dark" : "aria_theme_to_light";
  const label = strings?.[key] ?? (isLight ? "Switch to dark mode" : "Switch to light mode");
  themeToggle.setAttribute("aria-label", label);
  themeToggle.setAttribute("title", label);
}

function setupTheme() {
  const themeToggle = document.getElementById("theme-toggle");
  if (!themeToggle) return;

  themeToggle.addEventListener("click", () => {
    const isLightNow =
      document.documentElement.classList.toggle("light-theme");
    const newTheme = isLightNow ? "light" : "dark";
    document.documentElement.dataset.theme = newTheme;
    document.documentElement.style.backgroundColor = isLightNow
      ? "#ffffff"
      : "#2b2d55";
    localStorage.setItem("theme", newTheme);
    updateThemeLabel();
  });
}

// --- Latest Shorts (fetched at build time by scripts/fetch-shorts.mjs) ---
type Short = { id: string; title: string };
const shortsModules = import.meta.glob<Short[]>("./data/shorts.json", {
  eager: true,
  import: "default",
});
const SHORTS: Short[] = Object.values(shortsModules)[0] ?? [];

function renderShorts() {
  const section = document.getElementById("shorts-section");
  const list = document.getElementById("shorts-list");
  if (!section || !list) return;
  if (!SHORTS.length) {
    section.hidden = true;
    return;
  }
  list.replaceChildren(
    ...SHORTS.map((short) => {
      const li = document.createElement("li");
      const link = document.createElement("a");
      link.className = "short-link";
      link.href = `https://www.youtube.com/shorts/${short.id}`;
      link.target = "_blank";
      link.rel = "noopener noreferrer";

      const thumb = document.createElement("span");
      thumb.className = "short-thumb";
      const img = document.createElement("img");
      img.src = `/images/shorts/${short.id}.jpg`;
      img.alt = "";
      img.loading = "lazy";
      img.width = 480;
      img.height = 360;
      const play = document.createElement("span");
      play.className = "short-play";
      play.setAttribute("aria-hidden", "true");
      play.innerHTML =
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"></path></svg>';
      thumb.append(img, play);

      const title = document.createElement("span");
      title.className = "short-title";
      title.textContent = short.title;

      link.append(thumb, title);
      li.append(link);
      return li;
    }),
  );
  section.hidden = false;
}

// Dynamisches Copyright-Jahr im Footer
function updateCopyrightYear() {
  const yearEl = document.getElementById("copyright-year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear().toString();
  }
}

// --- Initialization ---
let isFirstLoad = true;

function init() {
  if (isFirstLoad) {
    if (!history.state) {
      history.replaceState({ url: window.location.href }, "", window.location.href);
    }
    setupPageTransitions();
    setupEffects();
    setupNavigation();
    setupTheme();
    setupCookieBanner();
    setupLanguageSwitcher();
    setupScrollEffects();
    isFirstLoad = false;
  }

  // Page-specific initializations
  updateTexts();
  updateCopyrightYear();
  setupActiveNavHighlight();
  renderShorts();
  setupEasterEgg();
  setupContactForm();
  checkTwitchLiveStatus();

}

// --- Back-to-Top ---
function setupScrollEffects() {
  const backToTop = document.querySelector(".back-to-top") as HTMLElement;
  if (!backToTop) return;

  window.addEventListener("scroll", () => {
    const winScroll =
      document.body.scrollTop || document.documentElement.scrollTop;
    backToTop.classList.toggle("show", winScroll > 300);
  });

  backToTop.addEventListener("click", () => {
    // Jump instead of sliding: the design has no motion besides the opt-in effects.
    window.scrollTo({ top: 0, behavior: "auto" });
    // The button hides at the top; move keyboard focus to the page start instead of losing it.
    document.getElementById("main-content")?.focus({ preventScroll: true });
  });
}

// Pfad normalisieren für robuste Vergleiche (/index.html, /index, / -> / sowie Clean URLs /contact -> /contact)
const normalizePath = (path: string): string => {
  let p = path.replace(/\/+$/, "");
  if (p === "" || p === "/index" || p === "/index.html") return "/";
  if (p.endsWith(".html")) return p.slice(0, -5);
  return p;
};

// --- Active Nav Highlight ---
function setupActiveNavHighlight() {
  const currentNorm = normalizePath(window.location.pathname);
  const navLinks = document.querySelectorAll("#nav-menu a");

  navLinks.forEach((link) => {
    const href = link.getAttribute("href");
    if (!href) return;

    try {
      const url = new URL(href, window.location.origin);
      const targetNorm = normalizePath(url.pathname);
      if (currentNorm === targetNorm) {
        link.classList.add("active");
        link.setAttribute("aria-current", "page");
      } else {
        link.classList.remove("active");
        link.removeAttribute("aria-current");
      }
    } catch {
      // Ignorieren
    }
  });
}

// --- Smooth Page Transitions (SPA) ---
const pageCache = new Map<string, string>();
let currentLoadId = 0;

const getCacheKey = (urlStr: string): string => {
  try {
    const u = new URL(urlStr, window.location.origin);
    return normalizePath(u.pathname);
  } catch {
    return urlStr.split("#")[0];
  }
};

function setupPageTransitions() {
  const mainContent = document.getElementById("main-content");
  if (!mainContent) return;

  // Initial geladene Seite direkt im Cache ablegen, damit "Zurück" keinen erneuten Fetch braucht
  // Screen readers get no page-load announcement on SPA swaps, so the new title is read out here.
  const announcer = document.createElement("div");
  announcer.className = "visually-hidden";
  announcer.setAttribute("role", "status");
  announcer.setAttribute("aria-live", "polite");
  document.body.appendChild(announcer);

  const initialKey = getCacheKey(window.location.href);
  if (!pageCache.has(initialKey)) {
    pageCache.set(initialKey, document.documentElement.outerHTML);
  }

  const prefetchPage = async (url: string) => {
    const cacheKey = getCacheKey(url);
    if (pageCache.has(cacheKey)) return;
    try {
      const response = await fetch(url.split("#")[0]);
      if (response.ok) {
        const html = await response.text();
        pageCache.set(cacheKey, html);
      }
    } catch (err) {
      console.warn("Prefetch failed for:", url);
    }
  };

  const loadPage = async (url: string, pushState = true) => {
    const loadId = ++currentLoadId;
    const cacheKey = getCacheKey(url);
    const fetchUrl = url.split("#")[0];

    // Starte den Fetch sofort parallel zur Animation
    const fetchPromise = (async () => {
      let html = pageCache.get(cacheKey);
      if (!html) {
        const response = await fetch(fetchUrl);
        if (!response.ok) throw new Error("Network response was not ok");
        html = await response.text();
        pageCache.set(cacheKey, html);
      }
      return html;
    })();

    try {
      // No exit animation in this design: swap as soon as the page is loaded.
      const html = await fetchPromise;

      // Abbrechen, falls währenddessen bereits eine neuere Navigation gestartet wurde
      if (loadId !== currentLoadId) return;

      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const newContent = doc.getElementById("main-content");
      const newTitle = doc.title;

      if (newContent) {
        if (pushState) {
          history.pushState({ url }, "", url);
        }
        
        // Update <title> data-i18n attribute to ensure the correct translation key is used
        const newTitleEl = doc.querySelector("title");
        const currentTitleEl = document.querySelector("title");
        if (newTitleEl && currentTitleEl) {
          const i18nKey = newTitleEl.getAttribute("data-i18n");
          if (i18nKey) {
            currentTitleEl.setAttribute("data-i18n", i18nKey);
          } else {
            currentTitleEl.removeAttribute("data-i18n");
          }
        }
        document.title = newTitle;

        // Synchronize canonical and meta tags
        const newCanonical = doc.querySelector('link[rel="canonical"]');
        let currentCanonical = document.querySelector('link[rel="canonical"]');
        if (newCanonical) {
          if (!currentCanonical) {
            currentCanonical = document.createElement("link");
            currentCanonical.setAttribute("rel", "canonical");
            document.head.appendChild(currentCanonical);
          }
          currentCanonical.setAttribute("href", newCanonical.getAttribute("href") || "");
        } else if (currentCanonical) {
          currentCanonical.remove();
        }

        const newDesc = doc.querySelector('meta[name="description"]');
        const currentDesc = document.querySelector('meta[name="description"]');
        if (newDesc && currentDesc) {
          currentDesc.setAttribute("content", newDesc.getAttribute("content") || "");
        }

        const newRobots = doc.querySelector('meta[name="robots"]');
        let currentRobots = document.querySelector('meta[name="robots"]');
        if (newRobots) {
          if (!currentRobots) {
            currentRobots = document.createElement("meta");
            currentRobots.setAttribute("name", "robots");
            document.head.appendChild(currentRobots);
          }
          currentRobots.setAttribute("content", newRobots.getAttribute("content") || "index, follow");
        } else if (currentRobots) {
          currentRobots.remove();
        }

        const ogTags = ["og:title", "og:description", "og:url", "og:image"];
        ogTags.forEach((prop) => {
          const newOg = doc.querySelector(`meta[property="${prop}"]`);
          let currentOg = document.querySelector(`meta[property="${prop}"]`);
          if (newOg) {
            if (!currentOg) {
              currentOg = document.createElement("meta");
              currentOg.setAttribute("property", prop);
              document.head.appendChild(currentOg);
            }
            currentOg.setAttribute("content", newOg.getAttribute("content") || "");
          } else if (currentOg) {
            currentOg.remove();
          }
        });

        // Content tauschen
        mainContent.innerHTML = newContent.innerHTML;

        // Re-run initializations (übersetzt Texte und setzt document.title)
        init();
        announcer.textContent = document.title;

        // Kein eigenes page_view: GA4 zählt Seitenwechsel per pushState selbst
        // (Erweiterte Messung, Browserverlaufsereignisse). Ein zweites zählte doppelt.

        // Scroll to top or anchor if hash is present, and set focus once for accessibility
        try {
          const parsedUrl = new URL(url, window.location.origin);
          const targetEl = parsedUrl.hash
            ? document.querySelector(parsedUrl.hash)
            : null;
          if (targetEl) {
            targetEl.scrollIntoView({ behavior: "instant" as ScrollBehavior });
            if (targetEl instanceof HTMLElement) {
              targetEl.focus({ preventScroll: true });
            } else {
              mainContent.focus({ preventScroll: true });
            }
          } else {
            window.scrollTo(0, 0);
            mainContent.focus({ preventScroll: true });
          }
        } catch {
          window.scrollTo(0, 0);
          mainContent.focus({ preventScroll: true });
        }
      }
    } catch (error) {
      if (loadId !== currentLoadId) return;
      console.error("Failed to load page via SPA:", error);
      window.location.href = url; // Fallback
    }
  };

  window.addEventListener("popstate", (e) => {
    const url = e.state && e.state.url ? e.state.url : window.location.href;
    loadPage(url, false);
  });

  // Prefetching bei Mouseover und Touchstart für Mobilgeräte
  const handlePrefetch = (e: Event) => {
    const link = (e.target as HTMLElement).closest("a");
    if (!link || !link.href) return;
    const rawHref = link.getAttribute("href");
    if (!rawHref || rawHref.startsWith("#") || rawHref.startsWith("mailto:") || rawHref.startsWith("tel:")) return;

    try {
      const url = new URL(link.href);
      if (url.origin === window.location.origin) {
        // Nicht die aktuelle Seite prefetchen
        const isCurrent =
          normalizePath(url.pathname) === normalizePath(window.location.pathname);
        if (!isCurrent) {
          prefetchPage(link.href);
        }
      }
    } catch {
      // Ignorieren falls ungültig
    }
  };

  document.addEventListener("mouseover", handlePrefetch);
  document.addEventListener("touchstart", handlePrefetch, { passive: true });

  // Alle internen Links abfangen
  document.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    const link = target.closest("a");

    if (!link || !link.href) return;

    // Strg/Cmd/Umschalt/Alt- oder Mittelklick heisst "neuer Tab/Fenster":
    // das dem Browser ueberlassen, statt im selben Tab zu navigieren.
    if (e.defaultPrevented || e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    if (link.hasAttribute("download")) return;

    const rawHref = link.getAttribute("href");
    // Reine "#"-Links (z. B. Cookie-Einstellungen) sowie mailto:/tel: ignorieren
    if (!rawHref || rawHref.startsWith("#") || rawHref.startsWith("mailto:") || rawHref.startsWith("tel:")) return;

    const targetAttr = link.getAttribute("target");

    try {
      const url = new URL(link.href);

      if (url.origin === window.location.origin && targetAttr !== "_blank") {
        const currentNorm = normalizePath(window.location.pathname);
        const targetNorm = normalizePath(url.pathname);
        const isSamePage = currentNorm === targetNorm;

        // Anker-Links auf der gleichen Seite ignorieren (Browser-natives Scrollen bzw. Hash-Sprung)
        if (isSamePage && url.hash) {
          return;
        }

        // Klick auf die aktuelle Seite (z. B. Logo oder "Home" wenn schon auf der Startseite) -> nach oben scrollen
        if (isSamePage && !url.hash) {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: "auto" });
          return;
        }

        e.preventDefault();
        loadPage(link.href);
      }
    } catch (err) {
      // Ignorieren falls URL ungültig
    }
  });
}

// --- Background Effects & Bird Tracks ---
function setupEffects() {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // 1. Feather Particles Background
  if (!prefersReducedMotion) {
    const particlesContainer = document.createElement("div");
    particlesContainer.id = "particles-container";
    document.body.prepend(particlesContainer); // Ganz nach hinten

    // Pause (not continue) while the window is not focused; resume where they stopped.
    const updatePause = () =>
      document.documentElement.classList.toggle("effects-paused", !document.hasFocus());
    window.addEventListener("blur", updatePause);
    window.addEventListener("focus", updatePause);
    updatePause();

    const createFeather = () => {
      if (document.hidden || !document.hasFocus()) return;
      const feather = document.createElement("div");
      feather.className = "feather-particle";

      // Zufällige Startposition, Größe und Animationsdauer
      const startPosX = Math.random() * 100; // 0 bis 100vw
      const size = Math.random() * 0.3 + 0.8; // 0.8 to 1.1, small sizes looked like dust
      const duration = Math.random() * 10 + 10; // 10s bis 20s
      const delay = Math.random() * 5; // 0s bis 5s

      feather.style.left = `${startPosX}vw`;
      feather.style.setProperty("--feather-scale", `${size}`);
      feather.style.animationDuration = `${duration}s`;
      feather.style.animationDelay = `${delay}s`;

      particlesContainer.appendChild(feather);

      // Remove when the fall is over. Not a timer: a paused feather would vanish mid-air.
      feather.addEventListener("animationend", () => feather.remove());
    };

    // Erzeuge periodisch neue Federn
    setInterval(createFeather, 1500); // Seltener neue Federn für bessere Performance

    // Initial weniger Federn spawnen
    for (let i = 0; i < 8; i++) {
      createFeather();
    }
  }

  // 2. Bird Track Click Effect
  if (!prefersReducedMotion) {
    document.addEventListener("click", (e) => {
      // Enter/Space "clicks" have no pointer position (detail 0, x/y 0): no footprint in the corner.
      if (e.detail === 0) return;
      const track = document.createElement("div");
      track.className = "bird-track";

      // Position genau unter der Maus
      track.style.left = `${e.clientX}px`;
      track.style.top = `${e.clientY}px`;

      // Leichte, zufällige Rotation für organischen Look
      const rotation = Math.random() * 40 - 20; // -20deg bis +20deg
      track.style.setProperty("--track-rot", `${rotation}deg`);

      document.body.appendChild(track);

      // Element nach der Animation entfernen (0.8s)
      setTimeout(() => {
        track.remove();
      }, 800);
    });
  }
}

// --- Cookie Banner & Analytics ---
function setupCookieBanner(forceShow = false) {
  const consent = localStorage.getItem("cookieConsent");

  if (!forceShow) {
    if (consent === "all") {
      initAnalytics();
      return;
    } else if (consent === "essential") {
      return; // Nur essenziell, kein Analytics laden
    }
  }

  if (document.getElementById("cookie-banner")) return;

  // Banner in den DOM einfügen, falls noch keine Auswahl getroffen wurde oder forceShow true ist
  const banner = document.createElement("div");
  banner.id = "cookie-banner";
  banner.className = "cookie-banner";
  banner.setAttribute("role", "region");
  banner.setAttribute("aria-labelledby", "cookie-banner-title");
  banner.innerHTML = `
        <div class="cookie-content">
            <h3 id="cookie-banner-title" data-i18n="cookie_title">cookie_title</h3>
            <p data-i18n="cookie_text">cookie_text</p>
            <div class="cookie-links">
                <a href="/imprint#imprint" data-i18n="imprint_link">Impressum</a> |
                <a href="/imprint#privacy" data-i18n="privacy_link">Datenschutz</a>
            </div>
        </div>
        <div class="cookie-buttons">
            <button type="button" id="cookie-reject" class="btn btn-secondary" data-i18n="cookie_reject">Nur essenzielle</button>
            <button type="button" id="cookie-accept" class="btn" data-i18n="cookie_accept">Alle akzeptieren</button>
        </div>
    `;

  // Muss ans Ende: der Banner ist position: sticky und belegt Platz im
  // Seitenfluss - weiter oben eingefuegt schiebt er den Header nach unten.
  // Als benannte Region ist er fuer Screenreader trotzdem direkt ansteuerbar.
  document.body.appendChild(banner);
  updateTexts(); // Update texts for the dynamically created banner

  const closeBanner = (status: "all" | "essential") => {
    localStorage.setItem("cookieConsent", status);
    // If focus was inside the banner, keep it on the page instead of losing it.
    const hadFocus = banner.contains(document.activeElement);
    banner.remove();
    if (hadFocus) document.getElementById("main-content")?.focus({ preventScroll: true });
    if (status === "all") {
      initAnalytics();
    } else {
      disableAnalytics();
    }
  };

  document
    .getElementById("cookie-accept")
    ?.addEventListener("click", () => closeBanner("all"));
  document
    .getElementById("cookie-reject")
    ?.addEventListener("click", () => closeBanner("essential"));
}

document.addEventListener("click", (e) => {
  const target = e.target as HTMLElement;
  if (
    target.id === "open-cookie-banner" ||
    target.closest("#open-cookie-banner")
  ) {
    e.preventDefault();
    setupCookieBanner(true);
  }
});

// --- Easter Egg Logic ---
function setupEasterEgg() {
  const chickenEmojis = ["🐔", "🐣", "🐥", "🐤", "🦆", "🐧", "🐓", "🦅"];
  const triggerEasterEgg = () => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const emoji = document.createElement("span");
    emoji.className = "easter-chicken";
    emoji.setAttribute("aria-hidden", "true");
    emoji.textContent =
      chickenEmojis[Math.floor(Math.random() * chickenEmojis.length)];
    emoji.style.fontSize = Math.floor(Math.random() * 24) + 28 + "px";
    emoji.style.top = Math.floor(Math.random() * 70) + 5 + "%";
    if (Math.random() > 0.5) {
      emoji.style.left = "-80px";
      emoji.style.right = "auto";
      emoji.style.animationName = "chicken-run";
    } else {
      emoji.style.right = "-80px";
      emoji.style.left = "auto";
      emoji.style.animationName = "chicken-run-rtl";
    }
    document.body.appendChild(emoji);
    setTimeout(() => emoji.remove(), 9000);
  };
  document.querySelectorAll<HTMLElement>(".easter-hint-container").forEach((el) => {
    // Der Footer ueberlebt SPA-Wechsel; ohne diese Sperre kaeme pro Navigation
    // ein weiterer Listener dazu und jeder Klick loeste ein Vielfaches aus.
    if (el.dataset.easterBound) return;
    el.dataset.easterBound = "true";
    el.addEventListener("click", () => {
      for (let i = 0; i < 10; i++) setTimeout(triggerEasterEgg, i * 200);
    });
    (el as HTMLElement).style.cursor = "pointer";
  });
}

// --- Contact Form Logic ---
function setupContactForm() {
  const form = document.getElementById("contact-form") as HTMLFormElement;
  if (!form) return;
  let successMsg = document.querySelector(
    ".contact-success-msg",
  ) as HTMLElement;
  if (!successMsg) {
    successMsg = document.createElement("p");
    successMsg.className = "contact-success-msg";
    // Ohne Live-Region erfaehrt ein Screenreader nichts vom Versand (WCAG 4.1.3)
    successMsg.setAttribute("role", "status");
    successMsg.setAttribute("aria-live", "polite");
    const submitBtn = form.querySelector('[type="submit"]');
    submitBtn?.insertAdjacentElement("afterend", successMsg);
  }
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const strings = translations[currentLanguage];
    const name = (form.querySelector("#name") as HTMLInputElement).value.trim();
    const message = (
      form.querySelector("#message") as HTMLTextAreaElement
    ).value.trim();
    // Business and fans have their own addresses above the form;
    // the form is for everything else and goes to info@ (Jean, 26.10.2026).
    const recipient = "info@nhywyll.com";
    const subject = encodeURIComponent(
      `${strings?.["contact_subject_prefix"] ?? "Message from"} ${name}`,
    );
    const body = encodeURIComponent(message);
    window.location.href = `mailto:${recipient}?subject=${subject}&body=${body}`;
    successMsg.textContent =
      strings?.["contact_success"] ?? "Your mail program has been opened!";
    successMsg.style.display = "block";
    // Formular nicht sofort leeren (form.reset()), damit eingegebener Text nicht verloren
    // geht, falls das Betriebssystem/der Browser keinen Standard-Mail-Client konfiguriert hat.
    setTimeout(() => {
      successMsg.style.display = "none";
    }, 7000);
  });
}

// --- Twitch Live Status Indicator ---
let lastTwitchCheck = 0;
const TWITCH_CHECK_INTERVAL = 3 * 60 * 1000; // Check at most once every 3 minutes

async function checkTwitchLiveStatus() {
  // Two copies of each badge: one in the centered list, one for the phone bar.
  const live = document.querySelectorAll(".live-badge");
  const schedule = document.querySelectorAll(".schedule-badge");
  if (!live.length) return;

  const now = Date.now();
  if (now - lastTwitchCheck < TWITCH_CHECK_INTERVAL) {
    return;
  }
  lastTwitchCheck = now;

  try {
    const response = await fetch("https://decapi.me/twitch/uptime/nhywyll");
    if (response.ok) {
      const text = (await response.text()).trim();
      const lower = text.toLowerCase();
      // DecAPI returns "nhywyll is offline" when offline.
      // If live, it returns formatted uptime (e.g. "1 hour, 15 minutes" or "45 minutes, 10 seconds").
      // If rate-limited or error, it returns "[Error from Twitch API]..." or similar error strings.
      const isError = lower.includes("error") || lower.includes("429") || lower.includes("not found");
      const isOffline = lower.includes("offline");

      // Live: red LIVE button to the stream. Otherwise: next stream, linked to the schedule.
      const isLive = !isError && !isOffline && text.length > 0;
      live.forEach((el) => el.classList.toggle("hidden", !isLive));
      schedule.forEach((el) => el.classList.toggle("hidden", isLive));
    }
  } catch (error) {
    console.error("Error checking Twitch live status:", error);
  }
}

// --- Start ---
// Muss am Dateiende stehen: init() läuft als Modul oft sofort (readyState "interactive").
// Stünde der Aufruf weiter oben, wären die weiter unten deklarierten Konstanten
// (z. B. isProduction für die Analytics) noch nicht belegt -> "y is not a function",
// init() bricht ab und die Seite zeigt nur Übersetzungs-Schlüssel (Bug 2026-09-06 bis 09-15,
// betraf alle Besucher mit Cookie-Zustimmung „Alle akzeptieren").
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

// Global verfügbar machen für Notfälle
(window as any).setLanguage = (lang: string) => {
  if (!isSupportedLanguage(lang)) {
    console.warn(`Unbekannte Sprache "${lang}". Verfuegbar:`, Object.keys(translations));
    return;
  }
  currentLanguage = lang;
  localStorage.setItem("language", lang);
  updateTexts();
};

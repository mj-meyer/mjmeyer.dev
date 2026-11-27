type Cleanup = () => void;
type EffectInstance = {
  update(config: {
    paused: boolean;
    reduced: boolean;
    compact: boolean;
    color: string;
  }): void;
  dispose(): void;
};
let routeCleanup: Cleanup | undefined;
let routeRevision = 0;

function storedTheme() {
  try {
    const value = localStorage.getItem("garden-theme:v1");
    return value === "light" || value === "dark" ? value : "dark";
  } catch {
    return "dark";
  }
}
function renderTheme(theme: "light" | "dark", doc: Document = document) {
  const root = doc.documentElement;
  root.dataset.theme = theme;
  root.classList.toggle("garden-dark", theme === "dark");
  root.classList.toggle("garden-light", theme === "light");
}
function applyTheme(doc: Document = document) {
  renderTheme(storedTheme(), doc);
}
function isPlainClick(event: MouseEvent) {
  return (
    event.button === 0 &&
    !(event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
  );
}

function setupDialogs(signal: AbortSignal) {
  const openers = new Map<HTMLDialogElement, HTMLElement>();
  function open(dialog: HTMLDialogElement, opener: HTMLElement) {
    openers.set(dialog, opener);
    dialog.showModal();
    dialog
      .querySelector<HTMLElement>(".garden-dialog-close")
      ?.focus({ preventScroll: true });
  }
  for (const button of document.querySelectorAll<HTMLElement>(
    "[data-newsletter-open]"
  ))
    button.addEventListener(
      "click",
      () => {
        const dialog = document.querySelector<HTMLDialogElement>(
          "#garden-newsletter-dialog"
        );
        if (dialog) open(dialog, button);
      },
      { signal }
    );
  for (const dialog of document.querySelectorAll<HTMLDialogElement>(
    ".garden-dialog"
  )) {
    dialog
      .querySelectorAll<HTMLElement>(
        "[data-dialog-close], .garden-dialog-close"
      )
      .forEach(button =>
        button.addEventListener("click", () => dialog.close(), { signal })
      );
    dialog.addEventListener(
      "click",
      event => {
        const rect = dialog.getBoundingClientRect();
        if (
          event.target === dialog &&
          (event.clientX < rect.left ||
            event.clientX > rect.right ||
            event.clientY < rect.top ||
            event.clientY > rect.bottom)
        )
          dialog.close();
      },
      { signal }
    );
    dialog.addEventListener(
      "close",
      () => {
        const opener = openers.get(dialog);
        if (opener?.isConnected) opener.focus({ preventScroll: true });
      },
      { signal }
    );
  }
  document.addEventListener(
    "click",
    event => {
      const mouse = event as MouseEvent;
      const anchor =
        event.target instanceof Element
          ? event.target.closest<HTMLAnchorElement>("a[data-unpublished]")
          : null;
      if (!anchor || !isPlainClick(mouse)) return;
      const dialog = document.querySelector<HTMLDialogElement>(
        "#garden-unpublished-dialog"
      );
      if (!dialog) return;
      event.preventDefault();
      open(dialog, anchor);
    },
    { signal, capture: true }
  );
}

function setupUnavailablePage() {
  const label = document.querySelector<HTMLElement>("[data-unpublished-name]");
  if (!label) return;
  const value = new URLSearchParams(location.search).get("note")?.trim();
  if (!value) return;
  const readable = value.replace(/-/g, " ").replace(/\s+/g, " ").slice(0, 120);
  if (!readable) return;
  label.textContent = `“${readable}”`;
  label.hidden = false;
}

function setupTheme(signal: AbortSignal) {
  applyTheme();
  for (const button of document.querySelectorAll<HTMLButtonElement>(
    ".garden-theme-toggle"
  )) {
    const sync = () =>
      button.setAttribute(
        "aria-label",
        `Switch to ${document.documentElement.dataset.theme === "dark" ? "light" : "dark"} theme`
      );
    sync();
    button.addEventListener(
      "click",
      () => {
        const theme =
          document.documentElement.dataset.theme === "dark" ? "light" : "dark";
        renderTheme(theme);
        try {
          localStorage.setItem("garden-theme:v1", theme);
        } catch {
          /* Storage can be denied without blocking theme changes. */
        }
        sync();
        window.dispatchEvent(new Event("garden:appearance"));
      },
      { signal }
    );
  }
}

function setupCallouts(signal: AbortSignal, cleanups: Cleanup[]) {
  document
    .querySelectorAll<HTMLElement>(
      ".reader-prose .callout[data-expandable='true']"
    )
    .forEach((callout, index) => {
      const title = callout.querySelector<HTMLElement>(".callout-title");
      const content = callout.querySelector<HTMLElement>(".callout-content");
      if (!title || !content) return;
      const previous = {
        role: title.getAttribute("role"),
        tabIndex: title.getAttribute("tabindex"),
        expanded: title.getAttribute("aria-expanded"),
        controls: title.getAttribute("aria-controls"),
        contentId: content.id,
      };
      content.id ||= `reader-callout-${index + 1}`;
      title.setAttribute("role", "button");
      title.tabIndex = 0;
      title.setAttribute("aria-controls", content.id);
      const sync = () =>
        title.setAttribute(
          "aria-expanded",
          String(callout.dataset.expanded !== "false")
        );
      const toggle = () => {
        callout.dataset.expanded = String(callout.dataset.expanded === "false");
        sync();
      };
      sync();
      title.addEventListener("click", toggle, { signal });
      title.addEventListener(
        "keydown",
        event => {
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          toggle();
        },
        { signal }
      );
      cleanups.push(() => {
        for (const [name, value] of [
          ["role", previous.role],
          ["tabindex", previous.tabIndex],
          ["aria-expanded", previous.expanded],
          ["aria-controls", previous.controls],
        ] as const) {
          if (value === null) title.removeAttribute(name);
          else title.setAttribute(name, value);
        }
        content.id = previous.contentId;
      });
    });
}

function setupFeed(signal: AbortSignal) {
  for (const feed of document.querySelectorAll<HTMLElement>(
    "[data-activity-feed]"
  )) {
    const buttons =
      feed.querySelectorAll<HTMLButtonElement>("[data-feed-filter]");
    const items = feed.querySelectorAll<HTMLElement>("[data-feed-kind]");
    for (const button of buttons)
      button.addEventListener(
        "click",
        () => {
          const filter = button.dataset.feedFilter;
          let count = 0;
          for (const item of items) {
            item.hidden = filter !== "all" && item.dataset.feedKind !== filter;
            if (!item.hidden) count++;
          }
          for (const other of buttons)
            other.setAttribute("aria-pressed", String(other === button));
          const status = feed.querySelector(".garden-feed-status");
          if (status)
            status.textContent = `${count} ${filter === "all" ? "" : `${filter} `}${count === 1 ? "entry" : "entries"}`;
        },
        { signal }
      );
  }
}

function setupDiscovery(signal: AbortSignal) {
  for (const root of document.querySelectorAll<HTMLElement>(
    "[data-discovery-root]"
  )) {
    const form = root.querySelector<HTMLFormElement>(".discovery-find");
    const search = root.querySelector<HTMLInputElement>("input[name='q']");
    const filter = root.querySelector<HTMLSelectElement>("#discovery-filter");
    const sort = root.querySelector<HTMLSelectElement>("#discovery-sort");
    const list = root.querySelector<HTMLElement>("[data-discovery-list]");
    const empty = root.querySelector<HTMLElement>("[data-discovery-empty]");
    const status = root.querySelector<HTMLElement>("[data-discovery-status]");
    const reset = root.querySelector<HTMLButtonElement>(
      "[data-discovery-reset]"
    );
    if (!form || !search || !list || !empty || !status) continue;
    const entries = [
      ...list.querySelectorAll<HTMLElement>("[data-discovery-item]"),
    ];
    const defaultFilter = root.dataset.defaultFilter || "all";
    const filterParam = root.dataset.filterParam;
    const singular = root.dataset.singular || "item";
    const plural = root.dataset.plural || "items";

    const readUrl = () => {
      const params = new URL(location.href).searchParams;
      search.value = params.get("q") ?? "";
      if (filter && filterParam) {
        const requested = params.get(filterParam);
        filter.value =
          requested &&
          [...filter.options].some(option => option.value === requested)
            ? requested
            : defaultFilter;
      }
      if (sort)
        sort.value = params.get("sort") === "title" ? "title" : "updated";
    };
    const apply = (updateUrl: boolean) => {
      const query = search.value.trim().toLocaleLowerCase();
      const filterValue = filter?.value ?? "all";
      entries.sort((a, b) =>
        sort?.value === "title"
          ? (a.dataset.title ?? "").localeCompare(b.dataset.title ?? "")
          : Number(b.dataset.updated ?? 0) - Number(a.dataset.updated ?? 0) ||
            (a.dataset.title ?? "").localeCompare(b.dataset.title ?? "")
      );
      let count = 0;
      for (const entry of entries) {
        const matchesQuery = (entry.dataset.search ?? "")
          .toLocaleLowerCase()
          .includes(query);
        const matchesFilter =
          filterValue === "all" || entry.dataset.filterValue === filterValue;
        entry.hidden = !(matchesQuery && matchesFilter);
        if (!entry.hidden) count++;
        list.append(entry);
      }
      empty.hidden = count > 0;
      status.textContent = `${count} ${count === 1 ? singular : plural}`;
      if (!updateUrl) return;
      const url = new URL(location.href);
      if (search.value.trim()) url.searchParams.set("q", search.value.trim());
      else url.searchParams.delete("q");
      if (filter && filterParam) {
        if (filter.value === defaultFilter)
          url.searchParams.delete(filterParam);
        else url.searchParams.set(filterParam, filter.value);
      }
      if (sort?.value === "title") url.searchParams.set("sort", "title");
      else url.searchParams.delete("sort");
      history.replaceState(history.state, "", url);
    };
    const syncFromUrl = () => {
      readUrl();
      apply(false);
    };

    search.addEventListener("input", () => apply(true), { signal });
    filter?.addEventListener("change", () => apply(true), { signal });
    sort?.addEventListener("change", () => apply(true), { signal });
    form.addEventListener(
      "submit",
      event => {
        event.preventDefault();
        apply(true);
      },
      { signal }
    );
    reset?.addEventListener(
      "click",
      () => {
        search.value = "";
        if (filter) filter.value = defaultFilter;
        if (sort) sort.value = "updated";
        apply(true);
        search.focus({ preventScroll: true });
      },
      { signal }
    );
    window.addEventListener("popstate", syncFromUrl, { signal });
    syncFromUrl();
  }
}

function setupToc(signal: AbortSignal, cleanups: Cleanup[]) {
  const toc = document.querySelector<HTMLDetailsElement>("#reader-desktop-toc");
  const intro = document.querySelector("#reader-intro");
  if (toc && intro) {
    let autoCollapsed = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (
          autoCollapsed ||
          entry.boundingClientRect.bottom >= 32 ||
          toc.contains(document.activeElement)
        )
          return;
        toc.open = false;
        autoCollapsed = true;
      },
      { rootMargin: "-32px 0px 0px 0px", threshold: 0 }
    );
    observer.observe(intro);
    cleanups.push(() => observer.disconnect());
    toc.querySelectorAll("a").forEach(anchor =>
      anchor.addEventListener(
        "click",
        () => {
          toc.open = false;
          autoCollapsed = true;
        },
        { signal }
      )
    );
  }
  document
    .querySelectorAll<HTMLAnchorElement>(".reader-mobile-nav details a")
    .forEach(anchor =>
      anchor.addEventListener(
        "click",
        () => anchor.closest("details")?.removeAttribute("open"),
        { signal }
      )
    );
}

function enhanceFootnotes(wide: MediaQueryList): Cleanup {
  const prose = document.querySelector<HTMLElement>(".reader-prose");
  const footnotes = prose?.querySelector<HTMLElement>(".footnotes");
  if (!prose || !footnotes) return () => {};
  const restores: Cleanup[] = [];
  const sidenotes: HTMLElement[] = [];
  const references = [
    ...prose.querySelectorAll<HTMLAnchorElement>("a[data-footnote-ref]"),
  ];
  for (const [index, anchor] of references.entries()) {
    const id = decodeURIComponent(anchor.hash.slice(1));
    const item = footnotes.querySelector<HTMLElement>(`#${CSS.escape(id)}`);
    if (!item) continue;
    const body = item.cloneNode(true) as HTMLElement;
    body
      .querySelectorAll("a[data-footnote-backref]")
      .forEach(back => back.remove());
    const button = document.createElement("button");
    button.type = "button";
    button.className = "reader-footnote-trigger";
    button.dataset.readerFootnoteIndex = String(index);
    button.textContent = anchor.textContent || String(index + 1);
    button.setAttribute("aria-label", `Read footnote ${index + 1}`);
    anchor.replaceWith(button);
    restores.push(() => {
      if (button.isConnected) button.replaceWith(anchor);
    });
    if (wide.matches) {
      const note = document.createElement("aside");
      note.className = "reader-sidenote";
      note.dataset.readerFootnoteIndex = String(index);
      note.tabIndex = -1;
      note.setAttribute("role", "note");
      note.innerHTML = `<strong>${index + 1}</strong>${body.innerHTML}`;
      const back = document.createElement("button");
      back.type = "button";
      back.className = "reader-note-back";
      back.textContent = "Back to text";
      back.addEventListener("click", () =>
        button.focus({ preventScroll: true })
      );
      note.append(back);
      prose.parentElement?.append(note);
      sidenotes.push(note);
      button.addEventListener("click", () =>
        note.focus({ preventScroll: true })
      );
    } else {
      const details = document.createElement("details");
      details.className = "reader-inline-footnote";
      details.dataset.readerFootnoteIndex = String(index);
      const summary = document.createElement("summary");
      summary.textContent = `Footnote ${index + 1}`;
      const content = document.createElement("div");
      content.innerHTML = body.innerHTML;
      details.append(summary, content);
      const block = button.closest("p,li") ?? button.parentElement;
      block?.insertAdjacentElement("afterend", details);
      button.addEventListener("click", () => {
        details.open = !details.open;
        summary.focus({ preventScroll: true });
      });
      sidenotes.push(details);
    }
  }
  if (sidenotes.length) {
    footnotes.dataset.footnotesEnhanced = "true";
    if (wide.matches) {
      requestAnimationFrame(() => {
        let previousBottom = -Infinity;
        const proseTop = prose.getBoundingClientRect().top;
        sidenotes.forEach((note, index) => {
          const trigger = document.querySelectorAll<HTMLElement>(
            ".reader-footnote-trigger"
          )[index];
          if (!trigger) return;
          const desired = trigger.getBoundingClientRect().top - proseTop;
          const offset = Math.max(desired, previousBottom + 24);
          note.style.setProperty("--reader-note-offset", `${offset}px`);
          previousBottom = offset + note.getBoundingClientRect().height;
        });
      });
    }
  }
  return () => {
    delete footnotes.dataset.footnotesEnhanced;
    sidenotes.forEach(note => note.remove());
    restores.reverse().forEach(restore => restore());
  };
}

function setupFootnotes(cleanups: Cleanup[]) {
  const wide = matchMedia("(min-width: 1280px)");
  let cleanup = enhanceFootnotes(wide);
  const refresh = () => {
    const active = document.activeElement as HTMLElement | null;
    const focusedFootnote = active?.closest<HTMLElement>(
      "[data-reader-footnote-index]"
    );
    const focusedIndex = focusedFootnote?.dataset.readerFootnoteIndex;
    const focusNote = Boolean(
      active?.closest(".reader-sidenote, .reader-inline-footnote")
    );
    cleanup();
    cleanup = enhanceFootnotes(wide);
    if (focusedIndex === undefined) return;
    requestAnimationFrame(() => {
      const selector = focusNote
        ? wide.matches
          ? `.reader-sidenote[data-reader-footnote-index="${focusedIndex}"]`
          : `.reader-inline-footnote[data-reader-footnote-index="${focusedIndex}"] summary`
        : `.reader-footnote-trigger[data-reader-footnote-index="${focusedIndex}"]`;
      document.querySelector<HTMLElement>(selector)?.focus({
        preventScroll: true,
      });
    });
  };
  wide.addEventListener("change", refresh);
  cleanups.push(() => {
    wide.removeEventListener("change", refresh);
    cleanup();
  });
}

function setupEffects(
  signal: AbortSignal,
  cleanups: Cleanup[],
  revision: number
) {
  const page = document.querySelector<HTMLElement>(".garden-page");
  if (!page) return;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const compact = matchMedia("(max-width: 767px)");
  let instance: EffectInstance | undefined;
  const paused = () => {
    try {
      return sessionStorage.getItem("garden-motion:v1") === "paused";
    } catch {
      return false;
    }
  };
  const config = () => ({
    paused: paused(),
    reduced: reduced.matches,
    compact: compact.matches,
    color:
      document.documentElement.dataset.theme === "light"
        ? "#77438e"
        : "#d2afea",
  });
  const syncControls = () =>
    document
      .querySelectorAll<HTMLButtonElement>(".garden-motion-toggle")
      .forEach(button => {
        const state = config();
        const isPaused = state.paused || state.reduced;
        button.disabled = state.reduced;
        button.setAttribute("aria-pressed", String(isPaused));
        button.setAttribute(
          "aria-label",
          state.reduced
            ? "Motion disabled by reduced-motion preference"
            : state.paused
              ? "Resume background and heading motion"
              : "Pause background and heading motion"
        );
      });
  const update = () => {
    syncControls();
    instance?.update(config());
  };
  document
    .querySelectorAll<HTMLButtonElement>(".garden-motion-toggle")
    .forEach(button =>
      button.addEventListener(
        "click",
        () => {
          try {
            if (paused()) sessionStorage.removeItem("garden-motion:v1");
            else sessionStorage.setItem("garden-motion:v1", "paused");
          } catch {
            /* Motion controls still work for the current render. */
          }
          update();
        },
        { signal }
      )
    );
  reduced.addEventListener("change", update);
  compact.addEventListener("change", update);
  window.addEventListener("garden:appearance", update, { signal });
  cleanups.push(() => {
    reduced.removeEventListener("change", update);
    compact.removeEventListener("change", update);
    instance?.dispose();
    instance = undefined;
  });
  syncControls();
  void (async () => {
    try {
      if (import.meta.env.DEV) await import("@vitejs/plugin-react/preamble");
      const { mountGardenEffects } = await import(
        "../components/garden/effects/mount-effects.jsx"
      );
      if (revision !== routeRevision || signal.aborted || !page.isConnected)
        return;
      instance = mountGardenEffects(page);
      instance.update(config());
    } catch (error) {
      if (revision === routeRevision && !signal.aborted)
        console.warn(
          "Garden effects unavailable; content remains readable.",
          error
        );
    }
  })();
}

function setupPreviews(
  signal: AbortSignal,
  cleanups: Cleanup[],
  revision: number
) {
  const capable = matchMedia(
    "(min-width: 768px) and (hover: hover) and (pointer: fine)"
  );
  const dataNode = document.querySelector("#garden-preview-data");
  if (!dataNode) return;
  const previewData = JSON.parse(dataNode.textContent || "[]");
  let unmount: Cleanup | undefined;
  let loadToken = 0;
  async function sync() {
    const token = ++loadToken;
    if (!capable.matches) {
      unmount?.();
      unmount = undefined;
      return;
    }
    if (unmount) return;
    try {
      if (import.meta.env.DEV) await import("@vitejs/plugin-react/preamble");
      const { mountLinkPreviews } = await import(
        "../components/garden/LinkPreviews"
      );
      if (
        token !== loadToken ||
        revision !== routeRevision ||
        signal.aborted ||
        !dataNode?.isConnected ||
        !capable.matches
      )
        return;
      unmount = mountLinkPreviews(previewData);
    } catch (error) {
      if (revision === routeRevision && !signal.aborted)
        console.warn(
          "Link previews unavailable; native links remain available.",
          error
        );
    }
  }
  const refresh = () => void sync();
  capable.addEventListener("change", refresh);
  cleanups.push(() => {
    loadToken++;
    capable.removeEventListener("change", refresh);
    unmount?.();
    unmount = undefined;
  });
  void sync();
}

function setupRoute() {
  routeCleanup?.();
  if (!document.documentElement.hasAttribute("data-garden-site")) {
    routeCleanup = undefined;
    routeRevision++;
    return;
  }
  const revision = ++routeRevision;
  const abort = new AbortController();
  const cleanups: Cleanup[] = [];
  setupTheme(abort.signal);
  setupUnavailablePage();
  setupDialogs(abort.signal);
  setupCallouts(abort.signal, cleanups);
  setupFeed(abort.signal);
  setupDiscovery(abort.signal);
  setupToc(abort.signal, cleanups);
  setupFootnotes(cleanups);
  setupEffects(abort.signal, cleanups, revision);
  setupPreviews(abort.signal, cleanups, revision);
  document.querySelector("main")?.classList.add("garden-content-enter");
  routeCleanup = () => {
    abort.abort();
    for (const dialog of document.querySelectorAll<HTMLDialogElement>(
      "dialog[open]"
    ))
      dialog.close();
    cleanups.reverse().forEach(cleanup => cleanup());
  };
}

document.addEventListener("astro:before-swap", event => {
  const incoming = (event as Event & { newDocument: Document }).newDocument;
  if (incoming.documentElement.hasAttribute("data-garden-site"))
    applyTheme(incoming);
  routeCleanup?.();
  routeCleanup = undefined;
  routeRevision++;
});
document.addEventListener("astro:page-load", setupRoute);
if (document.readyState !== "loading") setupRoute();

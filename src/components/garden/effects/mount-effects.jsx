// Route-owned production mount for the accepted optional effects. Every DOM
// mutation is reversible so ClientRouter teardown can restore native content.
import { Component, lazy, Suspense, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { createPortal, flushSync } from "react-dom";
import TextType from "./TextType.jsx";
import BorderGlow from "./BorderGlow.jsx";
const PixelBlast = lazy(() => import("./PixelBlast.jsx"));
const TOPICS = [
  "software and life.",
  "software.",
  "big goals.",
  "making things.",
  "life’s seasons.",
];
class PixelFallback extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="garden-pixel-static" data-renderer="static" />
    ) : (
      this.props.children
    );
  }
}
function Layers({ config, heading, headingSlot, cards }) {
  const [visible, setVisible] = useState(!document.hidden);
  const [headingVisible, setHeadingVisible] = useState(true);
  useEffect(() => {
    const update = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", update);
    let observer;
    if (heading) {
      observer = new IntersectionObserver(([entry]) =>
        setHeadingVisible(entry.isIntersecting)
      );
      observer.observe(heading);
    }
    return () => {
      observer?.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, [heading]);
  const paused = config.paused || config.reduced;
  return (
    <>
      <div className="garden-pixel-field" aria-hidden="true">
        {config.compact || config.reduced ? (
          <div className="garden-pixel-static" data-renderer="static" />
        ) : (
          <PixelFallback>
            <Suspense
              fallback={
                <div className="garden-pixel-static" data-renderer="loading" />
              }
            >
              <PixelBlast color={config.color} paused={paused} />
            </Suspense>
          </PixelFallback>
        )}
      </div>
      {heading &&
        headingSlot &&
        createPortal(
          <TextType
            text={TOPICS}
            paused={paused || !visible || !headingVisible}
          />,
          headingSlot
        )}
      {!config.reduced &&
        !config.compact &&
        cards.map(({ target, slot }, index) =>
          createPortal(<BorderGlow target={target} />, slot, String(index))
        )}
    </>
  );
}
export function mountGardenEffects(page) {
  const heading = page.querySelector("[data-typing-heading]");
  const shell = document.querySelector(".garden-shell");
  const originalNodes = heading ? [...heading.childNodes] : [];
  const originalLabel = heading?.getAttribute("aria-label") ?? null;
  const originalTitle = heading?.textContent ?? "";
  let headingSlot = null,
    cards = [],
    disposed = false;
  const host = document.createElement("div");
  host.className = "garden-effects-root";
  host.dataset.gardenEffectsRoot = "true";
  page.prepend(host);
  const root = createRoot(host);
  function measure() {
    if (!shell) return;
    const rect = shell.getBoundingClientRect();
    host.style.setProperty("--garden-content-left", `${rect.left}px`);
    host.style.setProperty("--garden-content-right", `${rect.right}px`);
  }
  const resize = new ResizeObserver(measure);
  if (shell) resize.observe(shell);
  window.addEventListener("resize", measure);
  measure();
  function restoreHeading() {
    if (!heading || !headingSlot) return;
    heading.replaceChildren(...originalNodes);
    heading.classList.remove("garden-typing-heading");
    if (originalLabel === null) heading.removeAttribute("aria-label");
    else heading.setAttribute("aria-label", originalLabel);
    headingSlot = null;
  }
  function removeCards() {
    for (const { target, slot } of cards) {
      slot.remove();
      target.classList.remove("garden-glow-card");
    }
    cards = [];
  }
  return {
    update(config) {
      if (disposed) return;
      if (heading && !headingSlot) {
        const sizing = document.createElement("span");
        sizing.className = "garden-heading-sizing";
        sizing.textContent = originalTitle;
        sizing.setAttribute("aria-hidden", "true");
        const visual = document.createElement("span");
        visual.className = "garden-heading-visual";
        visual.setAttribute("aria-hidden", "true");
        headingSlot = document.createElement("span");
        visual.append(document.createTextNode("Notes on "), headingSlot);
        heading.replaceChildren(sizing, visual);
        heading.classList.add("garden-typing-heading");
        heading.setAttribute("aria-label", originalTitle);
      }
      if (!cards.length)
        cards = [
          ...page.querySelectorAll(
            ".garden-home-start .garden-paths a, .reader-entry-link"
          ),
        ].map(target => {
          const slot = document.createElement("span");
          slot.className = "garden-glow-slot";
          slot.setAttribute("aria-hidden", "true");
          target.append(slot);
          target.classList.add("garden-glow-card");
          return { target, slot };
        });
      flushSync(() =>
        root.render(
          <Layers
            config={config}
            heading={heading}
            headingSlot={headingSlot}
            cards={cards}
          />
        )
      );
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      root.unmount();
      resize.disconnect();
      window.removeEventListener("resize", measure);
      restoreHeading();
      removeCards();
      host.remove();
    },
  };
}

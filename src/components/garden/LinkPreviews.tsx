import { createPortal, flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import {
  PreviewRoot,
  PreviewTrigger,
  PreviewContent,
  createPreviewHandle,
} from "./ui/preview-card";
export type NotePreview = {
  id: string;
  title: string;
  description: string;
  kind: string;
  state: string;
};
export function mountLinkPreviews(data: NotePreview[]) {
  const metadata = new Map(data.map(note => [note.id, note]));
  const handle = createPreviewHandle<NotePreview>();
  const focused = document.activeElement;
  const links = [
    ...document.querySelectorAll<HTMLAnchorElement>(
      ".reader-detail a[data-preview-note]"
    ),
  ]
    .filter(anchor => metadata.has(anchor.dataset.previewNote!))
    .map((anchor, index) => {
      const host = document.createElement("span");
      host.className = "garden-preview-host";
      anchor.replaceWith(host);
      return {
        anchor,
        host,
        index,
        note: metadata.get(anchor.dataset.previewNote!)!,
      };
    });
  const element = document.createElement("div");
  element.hidden = true;
  element.dataset.gardenPreviewRoot = "true";
  document.body.append(element);
  const root = createRoot(element);
  function restore() {
    for (const { anchor, host } of links)
      if (host.isConnected) host.replaceWith(anchor);
    element.remove();
  }
  try {
    flushSync(() =>
      root.render(
        <>
          {links.map(({ anchor, host, index, note }) =>
            createPortal(
              <PreviewTrigger
                handle={handle}
                payload={note}
                delay={0}
                closeDelay={200}
                id={anchor.id || `garden-preview-link-${index}`}
                href={anchor.href}
                className={anchor.className || undefined}
                target={anchor.target || undefined}
                rel={anchor.rel || undefined}
                title={anchor.title || undefined}
                aria-label={anchor.getAttribute("aria-label") || undefined}
                data-preview-note={note.id}
                dangerouslySetInnerHTML={{ __html: anchor.innerHTML }}
              />,
              host,
              String(index)
            )
          )}
          <PreviewRoot handle={handle}>
            {({ payload }) => (
              <PreviewContent>
                {payload && (
                  <>
                    <div className="garden-preview-kind">
                      {payload.kind}
                      <span>{payload.state}</span>
                    </div>
                    <h2>{payload.title}</h2>
                    <p>{payload.description}</p>
                    <div className="garden-preview-destination">
                      /{payload.id}
                    </div>
                  </>
                )}
              </PreviewContent>
            )}
          </PreviewRoot>
        </>
      )
    );
    links
      .find(link => link.anchor === focused)
      ?.host.querySelector<HTMLAnchorElement>("a")
      ?.focus({ preventScroll: true });
  } catch (error) {
    root.unmount();
    restore();
    throw error;
  }
  return () => {
    const active = document.activeElement;
    let restoreFocus: HTMLAnchorElement | undefined;
    for (const { anchor, host } of links) {
      const current = host.querySelector<HTMLAnchorElement>("a");
      if (current) anchor.href = current.href;
      if (current === active) restoreFocus = anchor;
    }
    flushSync(() => root.unmount());
    restore();
    restoreFocus?.focus({ preventScroll: true });
  };
}

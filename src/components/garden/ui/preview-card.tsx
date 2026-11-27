// Local shadcn/Base UI composition. See PROVENANCE.md and LICENSE.md.
import { PreviewCard } from "@base-ui/react/preview-card";
export const PreviewRoot = PreviewCard.Root;
export const PreviewTrigger = PreviewCard.Trigger;
export const createPreviewHandle = PreviewCard.createHandle;
export function PreviewContent({ children }: { children: React.ReactNode }) {
  return (
    <PreviewCard.Portal>
      <PreviewCard.Positioner
        className="garden-preview-positioner"
        side="top"
        align="start"
        sideOffset={12}
        collisionPadding={20}
        positionMethod="fixed"
      >
        <PreviewCard.Popup
          className="garden-preview-card"
          data-slot="preview-card-content"
          aria-hidden="true"
        >
          {children}
        </PreviewCard.Popup>
      </PreviewCard.Positioner>
    </PreviewCard.Portal>
  );
}

import Datetime from "./Datetime";

const noteStateSymbol = {
  stream: "🌊",
  seedling: "🌱",
  budding: "🪴 ",
  evergreen: "🌳",
};

export interface Props {
  detail?: boolean;
  updatetime: string | Date;
  pubDatetime?: string | Date;
  noteState: "stream" | "seedling" | "budding" | "evergreen";
  size?: "sm" | "lg";
}

export default function Meta({
  detail = false,
  updatetime,
  pubDatetime,
  noteState,
  size = "sm",
}: Props) {
  return (
    <div
      className={`flex gap-4 text-xs opacity-50 lg:gap-0 ${
        detail
          ? "items-end max-lg:justify-between lg:absolute lg:-left-36 lg:top-16 lg:flex-col lg:text-right "
          : " items-center space-x-2"
      }`}
    >
      <div
        className={`flex flex-col ${
          detail
            ? "items-end border-skin-line pb-2 lg:mb-3 lg:border-b lg:w-full"
            : "items-start lg:w-36"
        }`}
      >
        {detail && <span>Last Tended</span>}
        <Datetime datetime={updatetime} size={size} />
      </div>
      {!detail && <span className="separator">&nbsp;|&nbsp;</span>}

      {detail && pubDatetime && (
        <>
          <div className="flex flex-col items-end border-skin-line pb-2 lg:mb-3 lg:w-32 lg:border-b">
            <span>Planted</span>
            <Datetime datetime={pubDatetime} size={size} />
          </div>
        </>
      )}

      <div
        className={`space-x-2 border-skin-line text-sm lg:w-full ${
          detail && "pb-2 lg:border-b"
        }`}
      >
        <span>{noteStateSymbol[noteState]}</span>
        <span className="uppercase">{noteState}</span>
      </div>
    </div>
  );
}

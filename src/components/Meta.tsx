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
}

export default function Meta({
  detail = false,
  updatetime,
  pubDatetime,
  noteState,
}: Props) {
  return (
    <div
      className={`flex gap-2 text-xs ${
        detail
          ? "items-end max-lg:justify-between lg:absolute lg:-left-32 lg:top-12 lg:flex-col lg:items-start lg:gap-0 lg:text-right"
          : "flex-row items-center opacity-70"
      }`}
    >
      <div
        className={`flex flex-col ${
          detail
            ? "items-end border-skin-line pb-2  lg:w-full lg:border-b lg:py-4"
            : "items-start "
        }`}
      >
        {detail && <span className="opacity-50">Last Tended</span>}
        <Datetime datetime={updatetime} />
      </div>
      {!detail && <span className="separator">&nbsp;|&nbsp;</span>}

      {detail && pubDatetime && (
        <>
          <div className="flex flex-col items-end border-skin-line pb-2 lg:w-full lg:border-b lg:py-4">
            <span className="opacity-50">Planted</span>
            <Datetime datetime={pubDatetime} />
          </div>
        </>
      )}

      <div
        className={`space-x-2 border-skin-line text-sm lg:w-28 ${
          detail && "pb-2 lg:border-b lg:py-4"
        }`}
      >
        <span>{noteStateSymbol[noteState]}</span>
        <span className="uppercase">{noteState}</span>
      </div>
    </div>
  );
}

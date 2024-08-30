import type { CollectionEntry } from "astro:content";
import {
  BadgeDollarSign,
  BookOpenText,
  Drill,
  FileQuestion,
  Flower,
  GraduationCap,
  Newspaper,
  Podcast,
  Sprout,
  SquareTerminal,
  TreePine,
  Twitter,
  Youtube,
} from "lucide-react";
import BlobIcon from "./BlobIcon.astro";

export interface Props {
  href?: string;
  frontmatter: CollectionEntry<"garden" | "stream">["data"];
  secHeading?: boolean;
  cardType?: "stream" | "garden";
}

type GardenFrontmatter = CollectionEntry<"garden">["data"];
type StreamFrontmatter = CollectionEntry<"stream">["data"];

export default function Card({ href, frontmatter, cardType }: Props) {
  const { title, updateDatetime, description } = frontmatter;

  const noteType =
    cardType === "garden"
      ? (frontmatter as GardenFrontmatter).noteState
      : (frontmatter as StreamFrontmatter).streamType;

  // const oldDetailComponent = () => (
  //   <li className="mx-8 scale-90 gap-4 w-full flex flex-row border-none py-4 rounded-lg border-skin-accent">
  //     <a
  //       href={href}
  //       className="flex gap-4 w-full flex-row relative text-sm group"
  //     >
  //       <Meta updatetime={updateDatetime} noteType={noteType} />
  //       <div className="flex flex-col gap-2 w-full border-l border-t rounded-tl-lg p-4 border-skin-accent/40 group-hover:bg-skin-accent/5">
  //         <h3 className="text-[1.1rem] font-medium text-skin-accent">
  //           {title}
  //         </h3>
  //         <p className="">{description}</p>
  //       </div>
  //     </a>
  //   </li>
  // );

  // false && oldDetailComponent();

  return (
    <li>
      <a href={href} className="text-skin-accent relative hover:underline">
        <span className="absolute scale-150 text-skin-base -top-4 -left-4 -rotate-[25deg]">
          <BlobIcon type={noteType} className="size-24" />
          {/* {noteStateSymbol[noteType]} */}
        </span>

        {title}
      </a>
    </li>
  );
}

const noteStateSymbol = {
  seedling: <Sprout className="size-4" />,
  budding: <Flower className="size-4" />,
  evergreen: <TreePine className="size-4" />,
  article: <Newspaper className="size-4" />,
  code: <SquareTerminal className="size-4" />,
  video: <Youtube className="size-4" />,
  podcast: <Podcast className="size-4" />,
  book: <BookOpenText className="size-4" />,
  course: <GraduationCap className="size-4" />,
  tool: <Drill className="size-4" />,
  service: <BadgeDollarSign className="size-4" />,
  twitter: <Twitter className="size-4" />,
  other: <FileQuestion className="size-4" />,
};

interface MetaProps {
  detail?: boolean;
  updatetime: string | Date;
  pubDatetime?: string | Date;
  noteType?:
    | CollectionEntry<"garden">["data"]["noteState"]
    | CollectionEntry<"stream">["data"]["streamType"]
    | undefined;
  // streamType?: CollectionEntry<"stream">["data"]["streamType"] | undefined;
}

function Meta({ updatetime, noteType }: MetaProps) {
  return (
    <>
      {noteType && (
        <div
          className={`flex gap-1 py-1 justify-end items-center rounded-t-md bg-skin-accent/20 absolute -top-6 right-0 border-skin-line font-montserrat text-skin-accent px-2 text-xs`}
        >
          <span className="uppercase">{noteType}</span>
          <span>{noteStateSymbol[noteType]}</span>
        </div>
      )}
      <div
        className={`flex absolute rounded-l-lg top-1 -left-[3.4rem] bg-skin-accent/20 p-2 gap-2 text-xs`}
      >
        <FormattedDatetime datetime={updatetime} />

        {/* {streamType && ( */}
        {/*   <div */}
        {/*     className={`space-x-2 border-skin-line text-sm lg:w-28 ${ */}
        {/*       detail && "pb-2 lg:border-b lg:py-4" */}
        {/*     }`} */}
        {/*   > */}
        {/*     {/* <span>{noteStateSymbol[noteState]}</span>  */}
        {/*     <span className="uppercase">{streamType}</span> */}
        {/*   </div> */}
        {/* )} */}
      </div>
    </>
  );
}

const FormattedDatetime = ({ datetime }: { datetime: string | Date }) => {
  const myDatetime = new Date(datetime);

  const year = myDatetime.toLocaleDateString([], {
    year: "numeric",
  });

  const month = myDatetime.toLocaleDateString([], {
    month: "short",
  });

  const day = myDatetime.toLocaleDateString([], {
    day: "numeric",
  });

  return (
    <span className="flex flex-col font-montserrat items-center text-center leading-none">
      <span className="text-3xl font-black text-skin-accent/40 leading-none tracking-wider">
        {day}
      </span>
      <span className="uppercase text-skin-base tracking-widest border-b pb-1 mb-1">
        {month}
      </span>
      <span className="tracking-wider text-skin-base">{year}</span>
    </span>
  );
};

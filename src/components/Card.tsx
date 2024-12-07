import type { CollectionEntry } from "astro:content";
// import Meta from "./Meta";

export interface Props {
  href?: string;
  frontmatter: CollectionEntry<"garden" | "stream">["data"];
  secHeading?: boolean;
}

export default function Card({ href, frontmatter, secHeading = true }: Props) {
  const { title, description } = frontmatter;

  // const state = frontmatter.noteState || frontmatter.streamType;
  return (
    <li className="my-6">
      <a
        href={href}
        className="inline-block text-xl font-medium text-skin-accent decoration-dashed underline-offset-4 focus-visible:no-underline focus-visible:underline-offset-0"
      >
        {secHeading ? (
          <h2 className="text-xl font-medium text-skin-accent decoration-dashed hover:underline">
            {title}
          </h2>
        ) : (
          <h3 className="text-xl font-medium text-skin-accent decoration-dashed hover:underline">
            {title}
          </h3>
        )}
      </a>
      {/* <Meta updatetime={updateDatetime} noteState={noteState} /> */}
      <p className="pt-2">{description}</p>
    </li>
  );
}

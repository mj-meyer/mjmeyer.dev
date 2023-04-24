import Datetime from "./Datetime";
import type { BlogFrontmatter } from "@content/_schemas";

export interface Props {
  href?: string;
  frontmatter: BlogFrontmatter;
  secHeading?: boolean;
}

export default function Card({ href, frontmatter, secHeading = true }: Props) {
  const { title, pubDatetime, description } = frontmatter;
  return (
    <li class="my-6">
      <a
        href={href}
        class="inline-block text-xl font-medium text-skin-accent decoration-dashed underline-offset-4 focus-visible:no-underline focus-visible:underline-offset-0"
      >
        {secHeading ? (
          <h2 class="text-xl font-medium decoration-dashed hover:underline text-skin-accent">
            {title}
          </h2>
        ) : (
          <h3 class="text-xl font-medium decoration-dashed hover:underline text-skin-accent">
            {title}
          </h3>
        )}
      </a>
      <Datetime datetime={pubDatetime} />
      <p>{description}</p>
    </li>
  );
}

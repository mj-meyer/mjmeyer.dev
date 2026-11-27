export const OG_SVG_CONTENT_TYPE = "image/svg+xml; charset=utf-8";

export function createOgImageResponse(svg: string): Response {
  return new Response(svg, {
    headers: {
      "Content-Type": OG_SVG_CONTENT_TYPE,
    },
  });
}

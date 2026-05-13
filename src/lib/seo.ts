import { urlFor } from "./sanity";

const normalizeWhitespace = (value: string) => value.replace(/\s+/g, " ").trim();

export const textFromPortableText = (blocks: any[] = []) =>
  normalizeWhitespace(
    blocks
      .filter((block) => block?._type === "block")
      .flatMap((block) => block.children ?? [])
      .map((child) => child.text ?? "")
      .join(" ")
  );

export const excerpt = (value = "", maxLength = 155) => {
  const text = normalizeWhitespace(value);

  if (text.length <= maxLength) {
    return text;
  }

  const truncated = text.slice(0, maxLength + 1);
  const lastSpace = truncated.lastIndexOf(" ");
  const cutoff = lastSpace > 80 ? lastSpace : maxLength;

  return `${truncated.slice(0, cutoff).replace(/[.,;:!?-]+$/, "")}...`;
};

export const excerptFromPortableText = (blocks: any[] = [], maxLength = 155) =>
  excerpt(textFromPortableText(blocks), maxLength);

export const imageUrlFromFigure = (figure: any, width = 1200) => {
  if (!figure?.asset) {
    return undefined;
  }

  return urlFor(figure).width(width).url();
};

export const firstImageUrlFromPortableText = (blocks: any[] = [], width = 1200) => {
  const firstFigure = blocks.find((block) => block?._type === "figure" && block.asset);
  return imageUrlFromFigure(firstFigure, width);
};

export const pageTitle = (siteTitle: string, title?: string) => {
  const cleanTitle = normalizeWhitespace(title ?? "");
  return cleanTitle && cleanTitle !== siteTitle ? `${cleanTitle} | ${siteTitle}` : siteTitle;
};

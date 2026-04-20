import { urlFor } from "./sanity";

const FIGURE_STYLE_BY_VARIANT: Record<string, string> = {
  newsSmall:
    "max-width: 20%;margin: 0 auto;text-align: center;display: block;box-shadow: 2px 2px 4px; margin: 2rem auto; border-radius: .5rem;",
  newsLarge:
    "max-width: 42%;margin: 0 auto;text-align: center;display: block;box-shadow: 2px 2px 4px; margin: 2rem auto; border-radius: .5rem;"
};

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const escapeAttribute = (value: string) => escapeHtml(value);

const wrapWithMarks = (html: string, marks: string[] = [], markDefs: any[] = []) => {
  return marks.reduce((result, mark) => {
    if (mark === "em") {
      return `<em>${result}</em>`;
    }

    if (mark === "strong") {
      return `<strong>${result}</strong>`;
    }

    const definition = markDefs.find((entry) => entry._key === mark);
    if (definition?._type === "link" && definition.href) {
      const blank = definition.blank
        ? ' target="_blank" rel="noreferrer noopener"'
        : "";
      return `<a href="${escapeAttribute(definition.href)}"${blank}>${result}</a>`;
    }

    return result;
  }, html);
};

const renderChildren = (children: any[] = [], markDefs: any[] = []) =>
  children
    .map((child) => {
      const text = escapeHtml(String(child.text ?? "")).replaceAll("\n", "<br>");
      return wrapWithMarks(text, child.marks, markDefs);
    })
    .join("");

const renderFigure = (block: any) => {
  if (!block?.asset) {
    return "";
  }

  const src = urlFor(block).url();
  const style = FIGURE_STYLE_BY_VARIANT[block.variant] ?? FIGURE_STYLE_BY_VARIANT.newsSmall;
  const alt = block.alt ? ` alt="${escapeAttribute(block.alt)}"` : ' alt=""';
  const title = block.titleText ? ` title="${escapeAttribute(block.titleText)}"` : "";

  return `<img src="${escapeAttribute(src)}"${title}${alt} style="${style}">`;
};

export const renderPortableText = (
  blocks: any[] = [],
  options: { paragraphClass?: string } = {}
) => {
  const paragraphClass = options.paragraphClass ?? "close-up-copy";

  return blocks
    .map((block) => {
      if (block?._type === "block") {
        const html = renderChildren(block.children, block.markDefs);
        const normalized = html.replaceAll("&nbsp;", "").replaceAll(/\s+/g, "");
        if (!normalized) {
          return "";
        }

        const classAttribute = paragraphClass
          ? ` class="${escapeAttribute(paragraphClass)}"`
          : "";

        return `<p${classAttribute}>${html}</p>`;
      }

      if (block?._type === "figure") {
        return renderFigure(block);
      }

      return "";
    })
    .filter(Boolean)
    .join("\n");
};

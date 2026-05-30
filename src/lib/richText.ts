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
  const altText = block.alt || block.titleText || "";
  const alt = altText ? ` alt="${escapeAttribute(altText)}"` : ' alt=""';
  const title = block.titleText ? ` title="${escapeAttribute(block.titleText)}"` : "";

  return `<img src="${escapeAttribute(src)}"${title}${alt} loading="lazy" decoding="async" style="${style}">`;
};

const renderTopicDivider = () =>
  '<div class="topic-divider" aria-hidden="true"></div>';

const renderPortableTextBlock = (block: any, paragraphClass: string) => {
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

  if (block?._type === "topicDivider") {
    return renderTopicDivider();
  }

  return "";
};

export const renderPortableText = (
  blocks: any[] = [],
  options: { paragraphClass?: string } = {}
) => {
  const paragraphClass = options.paragraphClass ?? "close-up-copy";

  return blocks
    .map((block) => renderPortableTextBlock(block, paragraphClass))
    .filter(Boolean)
    .join("\n");
};

const renderNewsPostBlocks = (blocks: any[] = [], paragraphClass: string) =>
  blocks
    .filter((block) => block?._type !== "topicDivider")
    .map((block) => renderPortableTextBlock(block, paragraphClass))
    .filter(Boolean)
    .join("\n");

const renderDelimitedPosts = (posts: string[]) =>
  posts
    .filter(Boolean)
    .map((post, index, allPosts) => {
      const divider = index < allPosts.length - 1 ? `\n${renderTopicDivider()}` : "";
      return `${post}${divider}`;
    })
    .join("\n");

export const renderNewsPosts = (
  posts: any[] = [],
  options: { paragraphClass?: string } = {}
) => {
  const paragraphClass = options.paragraphClass ?? "close-up-copy";

  return renderDelimitedPosts(
    posts.map((post) => renderNewsPostBlocks(post?.body ?? [], paragraphClass))
  );
};

export const renderNewsFeed = (
  blocks: any[] = [],
  options: { paragraphClass?: string } = {}
) => {
  const paragraphClass = options.paragraphClass ?? "close-up-copy";
  const posts: string[] = [];
  let currentPost: string[] = [];

  const pushPost = () => {
    const renderedPost = currentPost.join("\n").trim();
    if (renderedPost) {
      posts.push(renderedPost);
    }

    currentPost = [];
  };

  for (const block of blocks) {
    if (block?._type === "topicDivider") {
      pushPost();
      continue;
    }

    const rendered = renderPortableTextBlock(block, paragraphClass);
    if (!rendered) {
      continue;
    }

    currentPost.push(rendered);
  }

  pushPost();

  return renderDelimitedPosts(posts);
};

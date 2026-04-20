import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@sanity/client";
import { JSDOM } from "jsdom";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const legacyDir = path.join(rootDir, "legacy-site");
const publicDir = path.join(rootDir, "public");

const projectId = process.env.PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.PUBLIC_SANITY_DATASET;
const apiVersion = process.env.PUBLIC_SANITY_API_VERSION;
const token = process.env.SANITY_API_READ_TOKEN;

if (!projectId || !dataset || !apiVersion || !token) {
  throw new Error(
    "PUBLIC_SANITY_PROJECT_ID, PUBLIC_SANITY_DATASET, PUBLIC_SANITY_API_VERSION, and SANITY_API_READ_TOKEN are required."
  );
}

const client = createClient({
  projectId,
  dataset,
  apiVersion,
  token,
  useCdn: false
});

let keyCounter = 0;
const nextKey = () => `k${++keyCounter}`;

const imageCache = new Map();

const contentTypeByExtension = {
  ".gif": "image/gif",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp"
};

const requiredRoutes = [
  "index.html",
  "bio.html",
  "contact.html",
  "cut-paste.html",
  "cv.html",
  "pharmacy.html",
  "Material-Ends-and-Invisible-Portals.html"
];

const readLegacyHtml = async (filename) => {
  const fullPath = path.join(legacyDir, filename);
  const html = await fs.readFile(fullPath, "utf8");
  return { html, dom: new JSDOM(html) };
};

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const getTextContent = (node) =>
  node?.textContent?.replace(/\s+/g, " ").trim() ?? "";

const mergeAdjacentSpans = (spans) => {
  const merged = [];

  for (const span of spans) {
    if (!span.text) {
      continue;
    }

    const previous = merged.at(-1);
    if (
      previous &&
      JSON.stringify(previous.marks) === JSON.stringify(span.marks)
    ) {
      previous.text += span.text;
      continue;
    }

    merged.push(span);
  }

  return merged.map((span) => ({
    _key: nextKey(),
    _type: "span",
    marks: span.marks,
    text: span.text
  }));
};

const serializeInlineNode = (node, marks, markDefs) => {
  const { Node } = node.ownerDocument.defaultView;

  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent ? [{ text: node.textContent, marks }] : [];
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return [];
  }

  const element = node;
  const tagName = element.tagName.toLowerCase();

  if (tagName === "br") {
    return [{ text: "\n", marks }];
  }

  if (tagName === "img") {
    return [];
  }

  if (tagName === "a") {
    const markKey = nextKey();
    markDefs.push({
      _key: markKey,
      _type: "link",
      href: element.getAttribute("href"),
      blank: element.getAttribute("target") === "_blank"
    });

    return Array.from(element.childNodes).flatMap((child) =>
      serializeInlineNode(child, [...marks, markKey], markDefs)
    );
  }

  if (tagName === "em" || tagName === "i") {
    return Array.from(element.childNodes).flatMap((child) =>
      serializeInlineNode(child, [...marks, "em"], markDefs)
    );
  }

  if (tagName === "strong" || tagName === "b") {
    return Array.from(element.childNodes).flatMap((child) =>
      serializeInlineNode(child, [...marks, "strong"], markDefs)
    );
  }

  return Array.from(element.childNodes).flatMap((child) =>
    serializeInlineNode(child, marks, markDefs)
  );
};

const buildTextBlock = (nodes) => {
  const markDefs = [];
  const spans = mergeAdjacentSpans(
    nodes.flatMap((node) => serializeInlineNode(node, [], markDefs))
  );

  const hasContent = spans.some((span) => span.text.replace(/\u00a0/g, "").trim());
  if (!hasContent) {
    return null;
  }

  return {
    _key: nextKey(),
    _type: "block",
    style: "normal",
    markDefs,
    children: spans
  };
};

const detectImageVariant = (element, fallback = "newsSmall") => {
  const style = element.getAttribute("style") ?? "";

  if (style.includes("max-width: 42%")) {
    return "newsLarge";
  }

  if (style.includes("max-width: 20%")) {
    return "newsSmall";
  }

  return fallback;
};

const uploadImage = async (sourcePath, overrides = {}) => {
  const normalizedSource = sourcePath.replace(/^\//, "");
  const cacheKey = `${normalizedSource}:${JSON.stringify(overrides)}`;

  if (imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey);
  }

  const filePath = path.join(publicDir, normalizedSource);
  const fileBuffer = await fs.readFile(filePath);
  const extension = path.extname(filePath).toLowerCase();
  const filename = path.basename(filePath);

  let asset;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      asset = await client.assets.upload("image", fileBuffer, {
        filename,
        contentType: contentTypeByExtension[extension] ?? "application/octet-stream"
      });
      break;
    } catch (error) {
      const retryable = error.statusCode >= 500 && attempt < 4;
      if (!retryable) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
    }
  }

  const figure = {
    _type: "figure",
    asset: {
      _type: "reference",
      _ref: asset._id
    },
    alt: overrides.alt ?? "",
    titleText: overrides.titleText ?? "",
    variant: overrides.variant
  };

  imageCache.set(cacheKey, figure);
  return figure;
};

const parseParagraphNode = async (element, fallbackImageVariant = "newsSmall") => {
  const blocks = [];
  let buffer = [];

  for (const child of Array.from(element.childNodes)) {
    if (
      child.nodeType === child.ownerDocument.defaultView.Node.ELEMENT_NODE &&
      child.tagName.toLowerCase() === "img"
    ) {
      const textBlock = buildTextBlock(buffer);
      if (textBlock) {
        blocks.push(textBlock);
      }
      buffer = [];

      blocks.push(
        await uploadImage(child.getAttribute("src"), {
          alt: child.getAttribute("alt") ?? "",
          titleText: child.getAttribute("title") ?? "",
          variant: detectImageVariant(child, fallbackImageVariant)
        })
      );
      continue;
    }

    buffer.push(child);
  }

  const trailingBlock = buildTextBlock(buffer);
  if (trailingBlock) {
    blocks.push(trailingBlock);
  }

  return blocks;
};

const parsePortableTextNodes = async (nodes, fallbackImageVariant = "newsSmall") => {
  const blocks = [];

  for (const node of nodes) {
    const NodeCtor = node.ownerDocument.defaultView.Node;

    if (node.nodeType === NodeCtor.TEXT_NODE) {
      const textBlock = buildTextBlock([node]);
      if (textBlock) {
        blocks.push(textBlock);
      }
      continue;
    }

    if (node.nodeType !== NodeCtor.ELEMENT_NODE) {
      continue;
    }

    const element = node;
    const tagName = element.tagName.toLowerCase();

    if (tagName === "img") {
      blocks.push(
        await uploadImage(element.getAttribute("src"), {
          alt: element.getAttribute("alt") ?? "",
          titleText: element.getAttribute("title") ?? "",
          variant: detectImageVariant(element, fallbackImageVariant)
        })
      );
      continue;
    }

    if (tagName === "p") {
      blocks.push(...(await parseParagraphNode(element, fallbackImageVariant)));
      continue;
    }

    if (tagName === "hr") {
      continue;
    }

    const nestedBlocks = await parsePortableTextNodes(
      Array.from(element.childNodes),
      fallbackImageVariant
    );
    blocks.push(...nestedBlocks);
  }

  return blocks;
};

const parseNavItems = (document, selector) =>
  Array.from(document.querySelectorAll(selector)).map((item) => ({
    _key: nextKey(),
    label: item.textContent.replace(/\s+/g, " ").trim(),
    path: item.querySelector("a")?.getAttribute("href") ?? "/",
    hidden: item.classList.contains("hidden"),
    current: item.classList.contains("current")
  }));

const parsePublishingProjects = async (document) => {
  const cards = Array.from(document.querySelectorAll(".collage"));

  return Promise.all(
    cards.map(async (card, index) => {
      const link = card.querySelector("a");
      const subtitle = card.querySelector(".text-info")?.textContent?.trim() ?? "";
      const image = card.querySelector("img");

      return {
        _id: `publishingProject-${String(index + 1).padStart(2, "0")}`,
        _type: "publishingProject",
        title: link?.textContent?.trim() ?? `Project ${index + 1}`,
        subtitle,
        externalUrl: link?.getAttribute("href") ?? "",
        sortOrder: index + 1,
        layoutClass: card.className,
        image: await uploadImage(image?.getAttribute("src"), {
          alt: image?.getAttribute("alt") ?? "",
          variant: "publishingCard"
        })
      };
    })
  );
};

const parseResearchSections = (document) =>
  Array.from(document.querySelectorAll(".col-2-flex")).map((section) => ({
    _key: nextKey(),
    title: section.querySelector(".close-up-copy")?.textContent?.trim() ?? "",
    entries: Array.from(section.querySelectorAll(".pub-list li")).map((entry) => {
      const clone = entry.cloneNode(true);
      clone.querySelectorAll("p").forEach((paragraph) => paragraph.remove());
      const link = entry.querySelector("a.ex-link");

      return {
        _key: nextKey(),
        description: clone.textContent.replace(/\s+/g, " ").trim(),
        linkLabel: link?.textContent?.trim() ?? "",
        linkUrl: link?.getAttribute("href") ?? ""
      };
    })
  }));

const fetchCvEntries = async () => {
  const response = await fetch(
    "https://opensheet.vercel.app/1kwnCvmyaz4qPQro5WHX0AkxUB_CbVsrS-Kf5j3DD7No/Sheet1"
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch CV entries: ${response.status}`);
  }

  return response.json();
};

const createOrReplaceDocuments = async (documents) => {
  const batchSize = 25;

  for (let index = 0; index < documents.length; index += batchSize) {
    const transaction = client.transaction();
    for (const document of documents.slice(index, index + batchSize)) {
      transaction.createOrReplace(document);
    }
    await transaction.commit();
  }
};

const cleanupLegacyIds = async () => {
  const legacyIds = await client.fetch(
    `*[
      _id match "publishingProject.*" ||
      _id match "cvEntry.*" ||
      _id == "essayPage.material-ends-and-invisible-portals"
    ]._id`
  );

  if (!legacyIds.length) {
    return;
  }

  const transaction = client.transaction();
  for (const id of legacyIds) {
    transaction.delete(id);
  }
  await transaction.commit();
};

const main = async () => {
  for (const route of requiredRoutes) {
    await fs.access(path.join(legacyDir, route));
  }

  const [{ html: indexHtml, dom: indexDom }, { dom: bioDom }, { dom: contactDom }, { dom: publishingDom }, { dom: cvDom }, { dom: researchDom }, { dom: essayDom }] =
    await Promise.all([
      readLegacyHtml("index.html"),
      readLegacyHtml("bio.html"),
      readLegacyHtml("contact.html"),
      readLegacyHtml("cut-paste.html"),
      readLegacyHtml("cv.html"),
      readLegacyHtml("pharmacy.html"),
      readLegacyHtml("Material-Ends-and-Invisible-Portals.html")
    ]);

  const homeContentRoot = indexDom.window.document.querySelector("#news .col-md-12.align-center");
  const bioContentRoot = bioDom.window.document.querySelector("#bio .col-md-12.align-center");
  const contactContentRoot = contactDom.window.document.querySelector(".close-up-copy");
  const researchContentRoot = researchDom.window.document.querySelector(".col-md-12.align-center");
  const researchIntroParagraph = researchContentRoot.querySelector("p.close-up-copy");
  const essayContentRoot = essayDom.window.document.querySelector(".WordSection1");
  const essayChildren = Array.from(essayContentRoot.childNodes).filter((node) => {
    if (node.nodeType === node.ownerDocument.defaultView.Node.ELEMENT_NODE) {
      return !node.classList.contains("image-header");
    }

    return true;
  });

  const publishingProjects = await parsePublishingProjects(publishingDom.window.document);
  const cvEntries = await fetchCvEntries();
  const homeTitle = getTextContent(indexDom.window.document.querySelector("#news h2")) || "NEWS";
  const bioTitle = getTextContent(bioDom.window.document.querySelector("#bio h2")) || "BIO";
  const contactTitle = getTextContent(contactDom.window.document.querySelector("h2")) || "Contact";
  const publishingTitle =
    getTextContent(publishingDom.window.document.querySelector("h2")) || "PUBLISHING";
  const researchTitle =
    getTextContent(researchDom.window.document.querySelector("h2")) || "RESEARCH PRACTICE";
  const cvTitle = getTextContent(cvDom.window.document.querySelector("title")) || "Chanelle Adams";
  const cvHeading =
    getTextContent(cvDom.window.document.querySelector("#cv-header h5")) || cvTitle;

  const homeNavItems = parseNavItems(indexDom.window.document, "nav li");
  const publishingNavItems = parseNavItems(publishingDom.window.document, "nav li");
  const contactNavItems = parseNavItems(contactDom.window.document, "nav li");
  const researchNavItems = parseNavItems(researchDom.window.document, "nav li");
  const analyticsId =
    indexHtml.match(/gtag\('config', '([^']+)'\)/)?.[1] ?? "UA-118933367-1";

  const homeContentNodes = Array.from(homeContentRoot.childNodes).filter((node) => {
    if (
      node.nodeType === node.ownerDocument.defaultView.Node.ELEMENT_NODE &&
      node.classList.contains("updated-tag")
    ) {
      return false;
    }

    return true;
  });

  const documents = [
    {
      _id: "siteSettings",
      _type: "siteSettings",
      siteTitle: indexDom.window.document.title,
      twitterUrl:
        indexDom.window.document.querySelector('a[href*="twitter.com"]')?.getAttribute("href") ??
        "https://twitter.com/nellienooks",
      analyticsId,
      homeNavItems,
      publishingNavItems,
      contactNavItems,
      researchNavItems
    },
    {
      _id: "homePage",
      _type: "homePage",
      title: homeTitle,
      updatedLabel:
        homeContentRoot.querySelector(".updated-tag")?.textContent?.replace(/\s+/g, " ").trim() ??
        "",
      content: await parsePortableTextNodes(homeContentNodes, "newsSmall")
    },
    {
      _id: "bioPage",
      _type: "bioPage",
      title: bioTitle,
      body: await parsePortableTextNodes(
        Array.from(bioContentRoot.querySelectorAll("p.close-up-copy"))
      ),
      profileImage: await uploadImage("img/chanelle.jpg", {
        alt: "",
        variant: "profile"
      })
    },
    {
      _id: "contactPage",
      _type: "contactPage",
      title: contactTitle,
      body: await parsePortableTextNodes(
        Array.from(contactContentRoot.childNodes).filter(
          (node) =>
            !(
              node.nodeType === node.ownerDocument.defaultView.Node.ELEMENT_NODE &&
              node.tagName.toLowerCase() === "hr"
            )
        )
      )
    },
    ...publishingProjects,
    {
      _id: "publishingPage",
      _type: "publishingPage",
      title: publishingTitle,
      items: publishingProjects.map((project) => ({
        _key: nextKey(),
        _type: "reference",
        _ref: project._id
      }))
    },
    {
      _id: "researchPage",
      _type: "researchPage",
      title: researchTitle,
      intro: await parsePortableTextNodes([researchIntroParagraph]),
      posterImage: await uploadImage("img/poster.jpeg", {
        alt: "",
        variant: "poster"
      }),
      sections: parseResearchSections(researchDom.window.document)
    },
    {
      _id: "essayPage-material-ends-and-invisible-portals",
      _type: "essayPage",
      title:
        essayDom.window.document.querySelector(".image-header h1")?.textContent?.replace(/\s+/g, " ").trim() ??
        "Material Ends and Invisible Portals",
      routeSlug: "Material-Ends-and-Invisible-Portals.html",
      heroImage: await uploadImage("img/material-ends.jpg", {
        alt: "",
        variant: "newsLarge"
      }),
      body: await parsePortableTextNodes(essayChildren),
      backLinkLabel:
        essayDom.window.document.querySelector(".back")?.textContent?.replace(/\s+/g, " ").trim() ??
        "<--[back to publishing]--",
      backLinkPath:
        essayDom.window.document.querySelector(".back")?.getAttribute("href") ?? "/cut-paste.html"
    },
    {
      _id: "cvPage",
      _type: "cvPage",
      title: cvTitle,
      heading: cvHeading,
      contactEmail:
        cvDom.window.document.querySelector('#cv-header a[href^="mailto:"]')?.textContent?.trim() ??
        "contact.chanelleadams@gmail.com",
      categoryOrder: [
        "Education",
        "Residencies",
        "Awards and Grants",
        "Writing",
        "Performance",
        "Professional Experience",
        "Teaching",
        "Academic Panels",
        "Invited Talks",
        "Translation"
      ]
    },
    ...cvEntries.map((entry, index) => ({
      _id: `cvEntry-${slugify(entry.Category || "entry")}-${String(index + 1).padStart(3, "0")}`,
      _type: "cvEntry",
      category: entry.Category || "",
      title: entry.Title || "",
      organization: entry.Organization || "",
      description: entry.Description || "",
      date: entry.Date || "",
      url: entry.URL || "",
      sortOrder: index + 1
    }))
  ];

  await createOrReplaceDocuments(documents);
  await cleanupLegacyIds();

  console.log(
    JSON.stringify(
      {
        projectId,
        dataset,
        documentsImported: documents.length,
        imagesUploaded: imageCache.size,
        cvEntriesImported: cvEntries.length
      },
      null,
      2
    )
  );
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

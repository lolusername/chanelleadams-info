import { getCliClient } from "sanity/cli";

const client = getCliClient({ apiVersion: "2026-04-19" });

const isBlankTextBlock = (block) => {
  if (block?._type !== "block") {
    return false;
  }

  const text = (block.children ?? [])
    .map((child) => child.text ?? "")
    .join("")
    .replace(/\u00a0/g, " ")
    .trim();

  return !text;
};

const hasRenderableContentAfter = (blocks, startIndex) =>
  blocks.slice(startIndex + 1).some((block) => !isBlankTextBlock(block));

const homePage = await client.fetch('*[_id == "homePage"][0]{_id, content}');

if (!homePage) {
  throw new Error("Could not find the homePage document.");
}

const originalContent = homePage.content ?? [];
const content = [];
let changed = false;

originalContent.forEach((block, index) => {
  if (!isBlankTextBlock(block)) {
    content.push(block);
    return;
  }

  changed = true;

  const previous = content.at(-1);
  if (
    content.length > 0 &&
    previous?._type !== "topicDivider" &&
    hasRenderableContentAfter(originalContent, index)
  ) {
    content.push({
      _key: block._key ?? `legacy-topic-divider-${index}`,
      _type: "topicDivider"
    });
  }
});

if (!changed) {
  console.log("No legacy blank spacer blocks found. No changes made.");
  process.exit(0);
}

await client.patch(homePage._id).set({ content }).commit();

console.log(
  `Converted ${originalContent.length - content.length} duplicate/empty spacer blocks and kept ${
    content.filter((block) => block._type === "topicDivider").length
  } decal divider blocks.`
);

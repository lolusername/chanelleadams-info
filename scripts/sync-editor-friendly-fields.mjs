import { getCliClient } from "sanity/cli";

const client = getCliClient({ apiVersion: "2026-04-19" });

const keyFrom = (prefix, value, index) => {
  const stable = String(value ?? "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);

  return `${prefix}-${String(index + 1).padStart(3, "0")}${stable ? `-${stable}` : ""}`;
};

const isRenderableBlock = (block) => {
  if (!block || block._type === "topicDivider") {
    return false;
  }

  if (block._type !== "block") {
    return true;
  }

  return (block.children ?? [])
    .map((child) => child.text ?? "")
    .join("")
    .replace(/\u00a0/g, " ")
    .trim();
};

const splitNewsPosts = (content = []) => {
  const posts = [];
  let current = [];

  const pushCurrent = () => {
    const body = current.filter(isRenderableBlock);
    if (body.length) {
      const firstKey = body.find((block) => block?._key)?._key;
      posts.push({
        _key: keyFrom("news-post", firstKey, posts.length),
        _type: "newsPost",
        body
      });
    }

    current = [];
  };

  content.forEach((block) => {
    if (block?._type === "topicDivider") {
      pushCurrent();
      return;
    }

    current.push(block);
  });

  pushCurrent();
  return posts;
};

const homePage = await client.fetch('*[_id == "homePage"][0]{_id, content, posts}');
if (!homePage) {
  throw new Error("Could not find the homePage document.");
}

const cvPage = await client.fetch('*[_id == "cvPage"][0]{_id, entries}');
if (!cvPage) {
  throw new Error("Could not find the cvPage document.");
}

const cvEntries = await client.fetch('*[_type == "cvEntry"] | order(sortOrder asc, _createdAt asc){_id}');
const patches = [];

if (!Array.isArray(homePage.posts) || homePage.posts.length === 0) {
  const posts = splitNewsPosts(homePage.content ?? []);
  patches.push(client.patch(homePage._id).set({ posts }));
  console.log(`Prepared ${posts.length} drag-sortable news posts.`);
} else {
  console.log(`Home Page already has ${homePage.posts.length} news posts. No news sync needed.`);
}

if (!Array.isArray(cvPage.entries) || cvPage.entries.length === 0) {
  const entries = cvEntries.map((entry, index) => ({
    _key: keyFrom("cv-entry", entry._id, index),
    _type: "reference",
    _ref: entry._id
  }));
  patches.push(client.patch(cvPage._id).set({ entries }));
  console.log(`Prepared ${entries.length} drag-sortable CV entry references.`);
} else {
  console.log(`CV Page already has ${cvPage.entries.length} entry references. No CV sync needed.`);
}

if (patches.length === 0) {
  console.log("No changes made.");
  process.exit(0);
}

for (const patch of patches) {
  await patch.commit();
}

console.log("Synced editor-friendly fields.");

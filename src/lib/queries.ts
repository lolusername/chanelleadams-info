import groq from "groq";

const portableTextFields = `
  ...,
  markDefs[]{
    ...,
    href,
    blank
  },
  children[]{
    ...,
    marks
  },
  asset
`;

export const SITE_SETTINGS_QUERY = groq`*[_type == "siteSettings"][0]{
  siteTitle,
  twitterUrl,
  analyticsId,
  homeNavItems[]{
    label,
    path,
    hidden,
    current
  },
  publishingNavItems[]{
    label,
    path,
    hidden,
    current
  },
  contactNavItems[]{
    label,
    path,
    hidden,
    current
  },
  researchNavItems[]{
    label,
    path,
    hidden,
    current
  }
}`;

export const HOME_PAGE_QUERY = groq`*[_type == "homePage"][0]{
  title,
  updatedLabel,
  posts[]{
    body[]{
      ${portableTextFields}
    }
  },
  content[]{
    ${portableTextFields}
  }
}`;

export const BIO_PAGE_QUERY = groq`*[_type == "bioPage"][0]{
  title,
  body[]{
    ${portableTextFields}
  },
  profileImage{
    ...,
    asset
  }
}`;

export const CONTACT_PAGE_QUERY = groq`*[_type == "contactPage"][0]{
  title,
  body[]{
    ${portableTextFields}
  }
}`;

export const PUBLISHING_PAGE_QUERY = groq`*[_type == "publishingPage"][0]{
  title,
  items[]->{
    title,
    subtitle,
    externalUrl,
    sortOrder,
    layoutClass,
    image{
      ...,
      asset
    }
  }
}`;

export const RESEARCH_PAGE_QUERY = groq`*[_type == "researchPage"][0]{
  title,
  intro[]{
    ${portableTextFields}
  },
  posterImage{
    ...,
    asset
  },
  sections[]{
    title,
    entries[]{
      description,
      linkLabel,
      linkUrl
    }
  }
}`;

export const ESSAY_PAGE_QUERY = groq`*[_type == "essayPage" && routeSlug == "Material-Ends-and-Invisible-Portals.html"][0]{
  title,
  routeSlug,
  heroImage{
    ...,
    asset
  },
  body[]{
    ${portableTextFields}
  },
  backLinkLabel,
  backLinkPath
}`;

export const CV_PAGE_QUERY = groq`{
  "page": *[_type == "cvPage"][0]{
    title,
    heading,
    contactEmail,
    categoryOrder,
    entries[]->{
      category,
      title,
      organization,
      description,
      date,
      url,
      sortOrder
    }
  },
  "entries": *[_type == "cvEntry"] | order(sortOrder asc, _createdAt asc){
    category,
    title,
    organization,
    description,
    date,
    url,
    sortOrder
  }
}`;

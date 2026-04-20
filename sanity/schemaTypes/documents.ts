import { defineArrayMember, defineField, defineType } from "sanity";

const cvCategoryOptions = [
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
];

export const siteSettings = defineType({
  name: "siteSettings",
  title: "Site Settings",
  type: "document",
  fields: [
    defineField({
      name: "siteTitle",
      type: "string",
      validation: (rule) => rule.required()
    }),
    defineField({
      name: "twitterUrl",
      type: "url",
      validation: (rule) => rule.required()
    }),
    defineField({
      name: "analyticsId",
      type: "string",
      validation: (rule) => rule.required()
    }),
    defineField({
      name: "homeNavItems",
      type: "array",
      of: [defineArrayMember({ type: "navItem" })],
      validation: (rule) => rule.required().min(1)
    }),
    defineField({
      name: "publishingNavItems",
      type: "array",
      of: [defineArrayMember({ type: "navItem" })],
      validation: (rule) => rule.required().min(1)
    }),
    defineField({
      name: "contactNavItems",
      type: "array",
      of: [defineArrayMember({ type: "navItem" })],
      validation: (rule) => rule.required().min(1)
    }),
    defineField({
      name: "researchNavItems",
      type: "array",
      of: [defineArrayMember({ type: "navItem" })],
      validation: (rule) => rule.required().min(1)
    })
  ]
});

export const homePage = defineType({
  name: "homePage",
  title: "Home Page",
  type: "document",
  fields: [
    defineField({
      name: "title",
      type: "string",
      validation: (rule) => rule.required()
    }),
    defineField({
      name: "updatedLabel",
      type: "string",
      validation: (rule) => rule.required()
    }),
    defineField({
      name: "content",
      type: "portableText",
      validation: (rule) => rule.required()
    })
  ]
});

export const bioPage = defineType({
  name: "bioPage",
  title: "Bio Page",
  type: "document",
  fields: [
    defineField({
      name: "title",
      type: "string",
      validation: (rule) => rule.required()
    }),
    defineField({
      name: "body",
      type: "portableText",
      validation: (rule) => rule.required()
    }),
    defineField({
      name: "profileImage",
      type: "figure"
    })
  ]
});

export const contactPage = defineType({
  name: "contactPage",
  title: "Contact Page",
  type: "document",
  fields: [
    defineField({
      name: "title",
      type: "string",
      validation: (rule) => rule.required()
    }),
    defineField({
      name: "body",
      type: "portableText",
      validation: (rule) => rule.required()
    })
  ]
});

export const publishingProject = defineType({
  name: "publishingProject",
  title: "Publishing Project",
  type: "document",
  fields: [
    defineField({
      name: "title",
      type: "string",
      validation: (rule) => rule.required()
    }),
    defineField({
      name: "subtitle",
      type: "string"
    }),
    defineField({
      name: "externalUrl",
      type: "url",
      validation: (rule) => rule.required()
    }),
    defineField({
      name: "image",
      type: "figure",
      validation: (rule) => rule.required()
    }),
    defineField({
      name: "sortOrder",
      type: "number",
      validation: (rule) => rule.required()
    }),
    defineField({
      name: "layoutClass",
      type: "string",
      validation: (rule) => rule.required()
    })
  ],
  orderings: [
    {
      title: "Sort Order",
      name: "sortOrder",
      by: [{ field: "sortOrder", direction: "asc" }]
    }
  ]
});

export const publishingPage = defineType({
  name: "publishingPage",
  title: "Publishing Page",
  type: "document",
  fields: [
    defineField({
      name: "title",
      type: "string",
      validation: (rule) => rule.required()
    }),
    defineField({
      name: "items",
      type: "array",
      of: [defineArrayMember({ type: "reference", to: [{ type: "publishingProject" }] })],
      validation: (rule) => rule.required().min(1)
    })
  ]
});

export const researchPage = defineType({
  name: "researchPage",
  title: "Research Page",
  type: "document",
  fields: [
    defineField({
      name: "title",
      type: "string",
      validation: (rule) => rule.required()
    }),
    defineField({
      name: "intro",
      type: "portableText",
      validation: (rule) => rule.required()
    }),
    defineField({
      name: "posterImage",
      type: "figure",
      validation: (rule) => rule.required()
    }),
    defineField({
      name: "sections",
      type: "array",
      of: [defineArrayMember({ type: "researchSection" })],
      validation: (rule) => rule.required().min(1)
    })
  ]
});

export const essayPage = defineType({
  name: "essayPage",
  title: "Essay Page",
  type: "document",
  fields: [
    defineField({
      name: "title",
      type: "string",
      validation: (rule) => rule.required()
    }),
    defineField({
      name: "routeSlug",
      type: "string",
      readOnly: true,
      validation: (rule) => rule.required()
    }),
    defineField({
      name: "heroImage",
      type: "figure",
      validation: (rule) => rule.required()
    }),
    defineField({
      name: "body",
      type: "portableText",
      validation: (rule) => rule.required()
    }),
    defineField({
      name: "backLinkLabel",
      type: "string",
      validation: (rule) => rule.required()
    }),
    defineField({
      name: "backLinkPath",
      type: "string",
      validation: (rule) => rule.required()
    })
  ]
});

export const cvPage = defineType({
  name: "cvPage",
  title: "CV Page",
  type: "document",
  fields: [
    defineField({
      name: "title",
      type: "string",
      validation: (rule) => rule.required()
    }),
    defineField({
      name: "heading",
      type: "string",
      validation: (rule) => rule.required()
    }),
    defineField({
      name: "contactEmail",
      type: "string",
      validation: (rule) => rule.required()
    }),
    defineField({
      name: "categoryOrder",
      type: "array",
      of: [defineArrayMember({ type: "string" })],
      options: {
        sortable: true
      },
      validation: (rule) => rule.required().min(1)
    })
  ]
});

export const cvEntry = defineType({
  name: "cvEntry",
  title: "CV Entry",
  type: "document",
  fields: [
    defineField({
      name: "category",
      type: "string",
      options: {
        list: cvCategoryOptions
      },
      validation: (rule) => rule.required()
    }),
    defineField({
      name: "title",
      type: "string",
      validation: (rule) => rule.required()
    }),
    defineField({
      name: "organization",
      type: "string"
    }),
    defineField({
      name: "description",
      type: "text",
      rows: 3
    }),
    defineField({
      name: "date",
      type: "string"
    }),
    defineField({
      name: "url",
      type: "url"
    }),
    defineField({
      name: "sortOrder",
      type: "number",
      validation: (rule) => rule.required()
    })
  ],
  orderings: [
    {
      title: "Sort Order",
      name: "sortOrder",
      by: [{ field: "sortOrder", direction: "asc" }]
    }
  ]
});

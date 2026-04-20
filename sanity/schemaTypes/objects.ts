import { defineArrayMember, defineField, defineType } from "sanity";

export const navItem = defineType({
  name: "navItem",
  title: "Nav Item",
  type: "object",
  fields: [
    defineField({
      name: "label",
      type: "string",
      validation: (rule) => rule.required()
    }),
    defineField({
      name: "path",
      type: "string",
      validation: (rule) => rule.required()
    }),
    defineField({
      name: "hidden",
      type: "boolean",
      initialValue: false
    }),
    defineField({
      name: "current",
      type: "boolean",
      initialValue: false
    })
  ]
});

export const figure = defineType({
  name: "figure",
  title: "Figure",
  type: "image",
  options: {
    hotspot: false
  },
  fields: [
    defineField({
      name: "alt",
      type: "string"
    }),
    defineField({
      name: "titleText",
      type: "string"
    }),
    defineField({
      name: "variant",
      type: "string",
      options: {
        list: [
          { title: "News Small", value: "newsSmall" },
          { title: "News Large", value: "newsLarge" },
          { title: "Publishing Card", value: "publishingCard" },
          { title: "Poster", value: "poster" },
          { title: "Profile", value: "profile" }
        ]
      }
    })
  ]
});

export const portableText = defineType({
  name: "portableText",
  title: "Portable Text",
  type: "array",
  of: [
    defineArrayMember({
      type: "block",
      styles: [{ title: "Normal", value: "normal" }],
      lists: [],
      marks: {
        decorators: [
          { title: "Italic", value: "em" },
          { title: "Strong", value: "strong" }
        ],
        annotations: [
          {
            name: "link",
            type: "object",
            title: "Link",
            fields: [
              defineField({
                name: "href",
                type: "url",
                validation: (rule) => rule.required()
              }),
              defineField({
                name: "blank",
                type: "boolean",
                initialValue: false
              })
            ]
          }
        ]
      }
    }),
    defineArrayMember({
      type: "figure"
    })
  ]
});

export const researchEntry = defineType({
  name: "researchEntry",
  title: "Research Entry",
  type: "object",
  fields: [
    defineField({
      name: "description",
      type: "text",
      rows: 4,
      validation: (rule) => rule.required()
    }),
    defineField({
      name: "linkLabel",
      type: "string"
    }),
    defineField({
      name: "linkUrl",
      type: "url"
    })
  ]
});

export const researchSection = defineType({
  name: "researchSection",
  title: "Research Section",
  type: "object",
  fields: [
    defineField({
      name: "title",
      type: "string",
      validation: (rule) => rule.required()
    }),
    defineField({
      name: "entries",
      type: "array",
      of: [defineArrayMember({ type: "researchEntry" })],
      validation: (rule) => rule.required().min(1)
    })
  ]
});

import { config, fields, singleton } from "@keystatic/core";

// What Greg and Kristen can change on Boat's page (bre/shared/cms-journal/003 and the editable list
// agreed 2026-10-16). Everything else (title, main heading, search description, booking link,
// layout, photos, address, email) stays in code, changed through turph.
//
// Saves are commits to BBR-LP/BBR-website. For local testing without GitHub, run with
// NEXT_PUBLIC_KEYSTATIC_STORAGE=local: edits write to the content folder on disk and nothing is committed.
export default config({
  storage:
    process.env.NEXT_PUBLIC_KEYSTATIC_STORAGE === "local"
      ? { kind: "local" }
      : { kind: "github", repo: { owner: "BBR-LP", name: "BBR-website" }, pathPrefix: "apps/boat" },
  ui: {
    navigation: {
      "Things you change often": ["notice", "season", "hours", "prices"],
      "Now and then": ["faq", "contact", "story"],
    },
  },
  singletons: {
    notice: singleton({
      label: "Notice at the top of the page",
      path: "content/notice",
      format: { data: "json" },
      schema: {
        message: fields.text({
          label: "Message",
          description:
            "One short line across the top of every page: opening or closing news, or a closed-for-weather note. Leave empty to show nothing. Clear it when it is no longer true.",
          validation: { length: { max: 140 } },
        }),
      },
    }),
    season: singleton({
      label: "Season",
      path: "content/season",
      format: { data: "json" },
      schema: {
        opens: fields.text({
          label: "We open",
          description: "Finish the sentence \"We open ...\". For example: when the ice is off the lake",
          validation: { length: { min: 1 } },
        }),
        closes: fields.text({
          label: "We stay open until",
          description: "For example: mid-October",
          validation: { length: { min: 1 } },
        }),
      },
    }),
    hours: singleton({
      label: "Daily hours",
      path: "content/hours",
      format: { data: "json" },
      schema: {
        daily: fields.text({
          label: "Open every day",
          description: "For example: 10am until dark. \"Weather permitting\" is added for you.",
          validation: { length: { min: 1 } },
        }),
      },
    }),
    prices: singleton({
      label: "Prices",
      path: "content/prices",
      format: { data: "json" },
      schema: {
        rows: fields.array(
          fields.object({
            name: fields.text({ label: "Boat", validation: { length: { min: 1 } } }),
            price: fields.integer({ label: "Price per hour ($)", validation: { min: 1 } }),
          }),
          { label: "Boats and prices", itemLabel: (props) => props.fields.name.value },
        ),
        notes: fields.array(fields.text({ label: "Note", validation: { length: { min: 1 } } }), {
          label: "Notes under the prices",
          itemLabel: (props) => props.value,
        }),
      },
    }),
    faq: singleton({
      label: "Good to know (questions and answers)",
      path: "content/faq",
      format: { data: "json" },
      schema: {
        items: fields.array(
          fields.object({
            q: fields.text({ label: "Question", validation: { length: { min: 1 } } }),
            a: fields.text({ label: "Answer", multiline: true, validation: { length: { min: 1 } } }),
          }),
          {
            label: "Questions and answers",
            description: "The season question is added for you from the Season and Daily hours settings.",
            itemLabel: (props) => props.fields.q.value,
          },
        ),
      },
    }),
    contact: singleton({
      label: "Phone number",
      path: "content/contact",
      format: { data: "json" },
      schema: {
        phone: fields.text({ label: "Phone", description: "For example: 518-524-7890", validation: { length: { min: 10 } } }),
      },
    }),
    story: singleton({
      label: "Story and seasons",
      path: "content/story",
      format: { data: "json" },
      schema: {
        title: fields.text({ label: "Story heading", validation: { length: { min: 1 } } }),
        body: fields.text({ label: "Story", multiline: true, validation: { length: { min: 1 } } }),
        seasons: fields.array(
          fields.object({
            season: fields.text({ label: "When", description: "For example: Early summer" }),
            title: fields.text({ label: "Heading" }),
            line: fields.text({ label: "One line" }),
          }),
          {
            label: "Through the seasons (three cards)",
            validation: { length: { min: 3, max: 3 } },
            itemLabel: (props) => props.fields.title.value,
          },
        ),
      },
    }),
  },
});

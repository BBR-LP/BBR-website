import { fields, singleton } from "@keystatic/core";

// The editing-screen settings every rental site shares (bre/shared/cms-journal/004): the notice at
// the top, season, questions and answers, phone number, and the story with its season cards. Each
// app adds its own hours and prices. Email stays out: it is not editable (turph, 2026-10-16).
// Files land in the app's content folder, e.g. content/notice.json.

const json = { data: "json" } as const;
const required = { length: { min: 1 } };

export function commonSingletons(opts: { startLabel: string; startExample: string; endLabel: string; endExample: string }) {
  return {
    notice: singleton({
      label: "Notice at the top of the page",
      path: "content/notice",
      format: json,
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
      format: json,
      schema: {
        opens: fields.text({ label: opts.startLabel, description: `For example: ${opts.startExample}`, validation: required }),
        closes: fields.text({ label: opts.endLabel, description: `For example: ${opts.endExample}`, validation: required }),
      },
    }),
    faq: singleton({
      label: "Good to know (questions and answers)",
      path: "content/faq",
      format: json,
      schema: {
        items: fields.array(
          fields.object({
            q: fields.text({ label: "Question", validation: required }),
            a: fields.text({ label: "Answer", multiline: true, validation: required }),
          }),
          {
            label: "Questions and answers",
            description: "The season question is added for you from the Season and Hours settings.",
            itemLabel: (props) => props.fields.q.value,
          },
        ),
      },
    }),
    uploads: singleton({
      label: "Photo uploads on or off",
      path: "content/uploads",
      format: json,
      schema: {
        open: fields.checkbox({
          label: "Accept photo uploads",
          description: "Turn this off to stop new photos coming in, for example if someone is sending junk. It takes about a minute to take effect. Turn it back on any time.",
          defaultValue: true,
        }),
      },
    }),
    contact: singleton({
      label: "Phone number",
      path: "content/contact",
      format: json,
      schema: {
        phone: fields.text({ label: "Phone", description: "For example: 518-524-7890", validation: { length: { min: 10 } } }),
      },
    }),
    story: singleton({
      label: "Story and seasons",
      path: "content/story",
      format: json,
      schema: {
        title: fields.text({ label: "Story heading", validation: required }),
        body: fields.text({ label: "Story", multiline: true, validation: required }),
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
  };
}

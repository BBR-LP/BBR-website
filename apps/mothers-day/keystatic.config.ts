import { config, fields, singleton, collection } from "@keystatic/core";
import { commonSingletons, keystaticBrand, photoCollection } from "@bbr/ui/cms";

// Mother's Day 10K's editing screen. The race itself (date, events, start times, prices, whether
// registration is open) is not here: the page reads it from RunSignUp, so there is nothing to type
// and nothing to go stale. What people change here is the notice, the questions and answers, the
// story and the photos. The page title, main heading, search description, sign-up link, course and
// email stay in code, changed through turph.
//
// Saves are commits to BBR-LP/BBR-website. For local testing without GitHub, run with
// NEXT_PUBLIC_KEYSTATIC_STORAGE=local: edits write to the content folder on disk and nothing is committed.
const { notice } = commonSingletons({ startLabel: "", startExample: "", endLabel: "", endExample: "" });
const required = { length: { min: 1 } };

export default config({
  storage:
    process.env.NEXT_PUBLIC_KEYSTATIC_STORAGE === "local"
      ? { kind: "local" }
      : { kind: "github", repo: { owner: "BBR-LP", name: "BBR-website" }, pathPrefix: "apps/mothers-day" },
  ui: {
    brand: keystaticBrand("mothers-day"),
    navigation: {
      "Things you change often": ["notice"],
      "Now and then": ["faq", "story", "photos"],
    },
  },
  collections: {
    // The 10K page has a home banner, a story photo, a gallery and a shared-link picture; no season cards.
    photos: photoCollection({ slots: ["home-banner", "story", "gallery", "share"] }),
  },
  singletons: {
    notice,
    faq: singleton({
      label: "Good to know (questions and answers)",
      path: "content/faq",
      format: { data: "json" },
      schema: {
        items: fields.array(
          fields.object({
            q: fields.text({ label: "Question", validation: required }),
            a: fields.text({ label: "Answer", multiline: true, validation: required }),
          }),
          {
            label: "Questions and answers",
            description: "Race day, start times and prices are not here: they come from the sign-up page on their own.",
            itemLabel: (props) => props.fields.q.value,
          },
        ),
      },
    }),
    story: singleton({
      label: "Story",
      path: "content/story",
      format: { data: "json" },
      schema: {
        title: fields.text({ label: "Story heading", validation: required }),
        body: fields.text({ label: "Story", multiline: true, validation: required }),
      },
    }),
  },
});

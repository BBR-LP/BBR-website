import { config, fields, singleton } from "@keystatic/core";
import { commonSingletons } from "@bbr/ui/cms";

const common = commonSingletons({
  startLabel: "We open",
  startExample: "when the ice is off the lake",
  endLabel: "We stay open until",
  endExample: "mid-October",
});

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
    ...common,
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
  },
});

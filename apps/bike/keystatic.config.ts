import { config, fields, singleton } from "@keystatic/core";
import { commonSingletons, keystaticBrand, photoCollection } from "@bbr/ui/cms";

const common = commonSingletons({
  startLabel: "Rentals start",
  startExample: "when the snow is off the rail trail",
  endLabel: "Rentals run until",
  endExample: "about Halloween",
});

const price = (label: string) => fields.integer({ label, validation: { min: 1 } });

// What Greg and Kristen can change on Bike's page (bre/shared/cms-journal/004, same list as Boat).
// Everything else (title, main heading, search description, booking link, layout, photos, address,
// email) stays in code, changed through turph. The search description names the hours ("Open daily
// 9 to 5"); if the hours change, it is updated in @bbr/ui (registry) by turph.
//
// Saves are commits to BBR-LP/BBR-website. For local testing without GitHub, run with
// NEXT_PUBLIC_KEYSTATIC_STORAGE=local: edits write to the content folder on disk and nothing is committed.
export default config({
  storage:
    process.env.NEXT_PUBLIC_KEYSTATIC_STORAGE === "local"
      ? { kind: "local" }
      : { kind: "github", repo: { owner: "BBR-LP", name: "BBR-website" }, pathPrefix: "apps/bike" },
  ui: {
    brand: keystaticBrand("bike"),
    navigation: {
      "Things you change often": ["notice", "season", "hours", "rates"],
      "Now and then": ["faq", "contact", "story", "photos", "uploads"],
    },
  },
  collections: {
    photos: photoCollection(),
  },
  singletons: {
    ...common,
    hours: singleton({
      label: "Daily hours",
      path: "content/hours",
      format: { data: "json" },
      schema: {
        opens: fields.text({ label: "Open every day from", description: "For example: 9am", validation: { length: { min: 1 } } }),
        closes: fields.text({ label: "until", description: "For example: 5pm. \"Weather permitting\" is added for you.", validation: { length: { min: 1 } } }),
      },
    }),
    rates: singleton({
      label: "Rates",
      path: "content/rates",
      format: { data: "json" },
      schema: {
        rows: fields.array(
          fields.object({
            name: fields.text({ label: "Bike", validation: { length: { min: 1 } } }),
            electric: fields.checkbox({ label: "This is an e-bike", defaultValue: true }),
            twoHours: price("2 hours ($)"),
            fiveHours: price("5 hours ($)"),
            day: price("24 hours ($)"),
          }),
          { label: "Bikes and rates", itemLabel: (props) => props.fields.name.value },
        ),
        notes: fields.array(fields.text({ label: "Note", validation: { length: { min: 1 } } }), {
          label: "Notes under the rates",
          itemLabel: (props) => props.value,
        }),
      },
    }),
  },
});

import { collection, fields } from "@keystatic/core";
import { photoSlots } from "../template/photo-slots";

// One record per approved photo, per site (bre/decisions/013 A4, records per site). The web copy is made by
// photo-tools `publish` (2000 px, location data stripped), which also writes the record; Keystatic is where
// Kristen edits the alt text, which slot a photo fills, and retires it. Saves land in the app's folder:
// content/photos/<name>/index.json and the picture beside it in public/photos/library/<name>/.
//
// The slot names are the words Greg and Kristen see ("Home banner"), never a file path; the list is
// template/photo-slots.ts, which the pages read the same way.

// 2021 (the oldest race records we hold) up to this year, newest first. Worked out when the editing
// screen loads in the browser, so 2027 appears on 1 January 2027 with no change to the code.
export const FIRST_PHOTO_YEAR = 2021;
export const UNKNOWN_YEAR = "unknown";
export function photoYears(now = new Date()) {
  const years = [];
  for (let y = now.getFullYear(); y >= FIRST_PHOTO_YEAR; y--) years.push({ label: String(y), value: String(y) });
  return [...years, { label: `Before ${FIRST_PHOTO_YEAR}, or not known`, value: UNKNOWN_YEAR }];
}

// A site offers only the spots its page has (the 10K has no season cards): pass their values in `slots`.
export function photoCollection(opts: { slots?: readonly string[] } = {}) {
  return collection({
    label: "Photos",
    path: "content/photos/*/",
    slugField: "name",
    format: { data: "json" },
    entryLayout: "form",
    columns: ["status", "shotYear"],
    schema: {
      name: fields.slug({
        name: { label: "Name", description: "A short name so you can find it later. Set when the photo was added.", validation: { length: { min: 1 } } },
      }),
      file: fields.image({
        label: "Photo",
        description: "The web copy. Added for you; the original stays in Dropbox.",
        directory: "public/photos/library",
        publicPath: "/photos/library/",
        validation: { isRequired: true },
      }),
      alt: fields.text({
        label: "What the photo shows (for people who can't see it)",
        description: "One plain sentence. It is read aloud by screen readers and used by search engines. A first draft is filled in for you: fix it if it is wrong.",
        multiline: true,
        validation: { length: { min: 1 } },
      }),
      credit: fields.text({ label: "Photo credit", description: "Who took it. For example: Photo by Matt Murphy, or Photo by Kristen." }),
      people: fields.select({
        label: "People in it",
        description: "A photo with children needs a yes from Greg or Kristen before it is used.",
        options: [
          { label: "No one", value: "none" },
          { label: "A few people", value: "few" },
          { label: "A crowd", value: "crowd" },
          { label: "Someone you could recognise", value: "identifiable" },
          { label: "Children", value: "minors" },
        ],
        defaultValue: "none",
      }),
      shotYear: fields.select({
        label: "Year it was taken",
        description: "So an old year's banner doesn't stay up by accident. Filled in for you when we know it.",
        options: photoYears(),
        defaultValue: UNKNOWN_YEAR,
      }),
      slots: fields.multiselect({
        label: "Where to use it",
        description: "Choose where on the page it can appear. Leave empty and it is not shown anywhere yet.",
        options: photoSlots.filter((s) => !opts.slots || opts.slots.includes(s.value)).map((s) => ({ ...s })),
      }),
      focal: fields.select({
        label: "Which part to keep when the photo is cropped",
        options: [
          { label: "The middle", value: "center" },
          { label: "The top", value: "top" },
          { label: "The bottom", value: "bottom" },
          { label: "The left", value: "left" },
          { label: "The right", value: "right" },
        ],
        defaultValue: "center",
      }),
      status: fields.select({
        label: "Status",
        description: "Retire a photo to take it off the pages. It stays on file and can be brought back.",
        options: [
          { label: "Waiting for a yes", value: "candidate" },
          { label: "OK to use", value: "approved" },
          { label: "Retired", value: "retired" },
        ],
        defaultValue: "approved",
      }),
      reviewBy: fields.date({ label: "Look at it again by", description: "It comes back for a yes or no at the start of that season." }),
      original: fields.text({
        label: "Where the original is (leave as it is)",
        description: "Its place in Dropbox and a fingerprint. Filled in for you; for our records only.",
      }),
    },
  });
}

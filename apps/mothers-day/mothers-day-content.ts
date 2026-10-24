import { createReader } from "@keystatic/core/reader";
import { pickGallery, pickPhotos, readPhotoRecords, type SiteContent } from "@bbr/ui";
import keystaticConfig from "./keystatic.config";

// Mother's Day 10K's page. The race itself (date, events, start times, prices, whether registration is
// open) is read live from RunSignUp (race 180657) by the template; nothing about it is typed here.
// What the owners change (notice, questions, story, photos) is read from ./content, edited at
// /keystatic. Everything else changes through turph: the page title, main heading, search description
// (in @bbr/ui), sign-up link, course and email. Facts come from the live page
// (bre/mothers-day/research/001-content-inventory.md, pulled 2026-10-13); wording is a draft for Greg
// and Kristen to react to; photos are stand-ins until there are real ones (bre decision 013).

const reader = createReader(process.cwd(), keystaticConfig);

// RunSignUp's current address for the race (the old "mayday10klakeplacid" address still works but is stale).
const SIGN_UP = "https://runsignup.com/Race/NY/LakePlacid/mothersdayracelakeplacidny";

const need = <T>(value: T | null, name: string): T => {
  if (value === null) throw new Error(`Missing content/${name}.json; add it or restore it from git history.`);
  return value;
};

export async function getMothersDayContent(): Promise<SiteContent> {
  const [notice, faq, story] = await Promise.all([reader.singletons.notice.read(), reader.singletons.faq.read(), reader.singletons.story.read()]);
  const f = need(faq, "faq");
  const st = need(story, "story");

  // A photo a person has chosen in the editing screen (Photos, "Where to use it") replaces the stand-in
  // for that spot; with none chosen the stand-in stays.
  const photoRecords = await readPhotoRecords(reader.collections.photos);
  const picks = pickPhotos(photoRecords);

  return {
    notice: notice?.message?.trim() || undefined,
    title: "Mother's Day 10K and 5K in Lake Placid | Run the Adirondack Rail Trail",
    shareImage: picks.share?.src,
    nav: [{ label: "Race day", href: "#race" }, { label: "The race", href: "#story" }, { label: "The course", href: "#location" }, { label: "Good to know", href: "#good-to-know" }],
    cta: "Register",
    ctaHref: SIGN_UP,
    hero: {
      photo: picks["home-banner"] ?? { brief: "Runners on the Adirondack Rail Trail on a spring morning" },
      heading: "Mother's Day 10K and 5K on the Adirondack Rail Trail, Lake Placid",
      headline: "Run the Rail Trail the day before Mother's Day.",
      line: "A 10K and a 5K, out and back from Bike Lake Placid, with food, drink, music and awards at the finish.",
    },
    raceId: 180657,
    story: { photo: picks.story ?? { brief: "Families, strollers and dogs at the start line" }, title: st.title, body: st.body },
    gallery: { title: "On the trail", photos: pickGallery(photoRecords) },
    location: {
      kind: "course",
      title: "The course",
      intro: "Both races run out and back on the Adirondack Rail Trail, starting and finishing at Bike Lake Placid.",
      places: [{ label: "Start and finish", name: "Bike Lake Placid, 455 Old Military Rd", query: "Bike Lake Placid, 455 Old Military Rd, Lake Placid, NY" }],
      details: [
        "Participants park in the Lake Placid Firehouse lot, near the starting line.",
        "There is one aid station, at the turnaround in the middle of the Ray Brook straightaway.",
        "The aid station and finish are cup-less: bring a reusable bottle or a hydration pack.",
        "Registration is limited to keep the trail from getting crowded, and wave starts may be used.",
      ],
      maps: [], // the only course map on the old page is the 2026 file; none until the 2027 course is confirmed
    },
    goodToKnow: f.items.map((i) => ({ q: i.q, a: i.a })),
    // The email is not editable (turph, 2026-10-16): it stays here. The only address on the old page.
    contact: { email: "info@lakeplacidmarathon.com" },
  };
}

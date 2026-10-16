// Race details read straight from RunSignUp's public race API (no key needed for reads; checked
// 2026-10-13). Phase 1 of bre/shared/cms-journal/002: the sites never show a stale race date.

export type RaceEvent = { name: string; date: string; start: string; fee: string | null; isoStart: string; distance: string };
export type Address = { street: string; city: string; state: string; zipcode: string };
export type Race = { name: string; date: string; open: boolean; url: string; address: Address; events: RaceEvent[] };

type ApiEvent = {
  name: string;
  distance: string; // "26.2 Miles"
  start_time: string; // "6/13/2027 08:00"
  registration_periods?: { registration_opens: string; registration_closes: string; race_fee: string }[];
};

// "6/13/2027 08:00" -> Date (local wall-clock time; only formatted back out, never compared across zones)
function parse(s: string) {
  const [d, t = "00:00"] = s.split(" ");
  const [m, day, y] = d.split("/").map(Number);
  const [h, min] = t.split(":").map(Number);
  return new Date(y, m - 1, day, h, min);
}

// "6/13/2027 08:00" -> "2027-06-13T08:00:00-04:00", with Lake Placid's offset on that date (for search engines).
function iso(s: string) {
  const d = parse(s);
  const offset = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", timeZoneName: "longOffset" })
    .formatToParts(d).find((p) => p.type === "timeZoneName")?.value.replace("GMT", "") || "-05:00";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00${offset}`;
}

// The fee for whichever registration period is open today, or the next one to open.
function currentFee(periods: ApiEvent["registration_periods"] = []) {
  const now = new Date();
  const p = periods.find((p) => parse(p.registration_closes) >= now);
  return p ? p.race_fee.replace(/\.00$/, "") : null; // "$35.00" -> "$35"
}

export async function getRace(raceId: number): Promise<Race | null> {
  try {
    const res = await fetch(`https://runsignup.com/rest/race/${raceId}?format=json&future_events_only=T`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const { race } = await res.json();
    if (!race?.next_date) return null;
    return {
      name: race.name,
      date: parse(race.next_date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }),
      open: race.is_registration_open === "T",
      url: race.url,
      address: race.address,
      events: (race.events as ApiEvent[]).map((e) => {
        const start = parse(e.start_time);
        return {
          // "Marathon: Sunday, June 13, 2027" -> "Marathon"; "Mothers Day 10K Race" -> "10K"
          name: e.name.split(":")[0].replace(/^Mothers Day\s+|\s+Race$/gi, "").trim(),
          date: start.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
          start: start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
          fee: currentFee(e.registration_periods),
          isoStart: iso(e.start_time),
          distance: e.distance,
        };
      }),
    };
  } catch {
    return null; // the page shows its fallback line instead of race details
  }
}

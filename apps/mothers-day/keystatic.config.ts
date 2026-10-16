import { config, fields, singleton } from "@keystatic/core";

// Content for this site lives in the BBR-website repo (public) and is edited at /keystatic by people
// with write access to it. `pathPrefix` is this app's folder, since the repo holds all four sites.
export default config({
  storage: {
    kind: "github",
    repo: { owner: "BBR-LP", name: "BBR-website" },
    pathPrefix: "apps/mothers-day",
  },
  singletons: {
    notice: singleton({
      label: "Notice on the home page",
      path: "content/notice",
      format: { data: "json" },
      schema: {
        message: fields.text({
          label: "Message",
          description: "One short line shown on the home page. Leave empty to show nothing.",
        }),
      },
    }),
  },
});

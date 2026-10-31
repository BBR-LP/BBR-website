import { fields, singleton } from "@keystatic/core";
import { MERCH_LIMIT } from "../template/merch";

// The store items shown on a race's page (bre/shared/merch-journal/001): a heading, the race's store
// page on RunSignUp, and up to MERCH_LIMIT items with a photo and a name. No prices: those are in the
// store, which every item links to. Only Run's and the 10K's editing screens include this; Bike and
// Boat sell no merch (Greg, 2026-10-31) and must not show the setting. Lands in content/merch.json;
// photos go to public/photos/merch/.
//
// Nothing here is marked required: Keystatic's reader throws on a saved file that fails a validation,
// which would turn the whole page into an error for one half-filled item. merchContent() skips an item
// with no photo and shows no section with no store link instead.
export function merchSingleton() {
  return singleton({
    label: "Store items on the page",
    path: "content/merch",
    format: { data: "json" },
    schema: {
      title: fields.text({
        label: "Heading",
        description: "Above the items. For example: Race gear",
        defaultValue: "From the store",
      }),
      shopHref: fields.url({
        label: "Store page",
        description: "Your race's store on RunSignUp. Every item on the page opens it; prices are shown there, not on the page. With no link here, nothing is shown.",
      }),
      items: fields.array(
        fields.object({
          name: fields.text({ label: "Item", description: "As it is named in the store." }),
          photo: fields.image({
            label: "Photo",
            description: "A square photo of the item looks best. An item with no photo or no name is not shown.",
            directory: "public/photos/merch",
            publicPath: "/photos/merch/",
          }),
        }),
        {
          label: `Items (up to ${MERCH_LIMIT})`,
          description: "A few favourites, not the whole store. Remove an item here when it leaves the store.",
          itemLabel: (props) => props.fields.name.value,
          validation: { length: { max: MERCH_LIMIT } },
        },
      ),
    },
  });
}

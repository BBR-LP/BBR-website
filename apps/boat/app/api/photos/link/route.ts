import { createUploadLinkHandler } from "@bbr/ui/upload";
import uploads from "../../../../content/uploads.json";

// Hands out one-time Dropbox upload links for the /photos page (bre/decisions/013 A11).
export const POST = createUploadLinkHandler({ site: "boat", open: uploads.open !== false });

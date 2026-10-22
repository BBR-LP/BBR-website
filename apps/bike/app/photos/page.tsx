import { UploadPage, uploadMetadata } from "@bbr/ui/upload";
import uploads from "../../content/uploads.json";

export const metadata = uploadMetadata("bike");

// ?s=staff comes from the QR sticker; it only decides which folder a photo lands in.
export default async function Photos({ searchParams }: { searchParams: Promise<{ s?: string }> }) {
  return <UploadPage slug="bike" open={uploads.open !== false} source={(await searchParams).s} />;
}

import { createReader } from "@keystatic/core/reader";
import { ComingSoon } from "@bbr/ui";
import keystaticConfig from "../keystatic.config";

const reader = createReader(process.cwd(), keystaticConfig);

export default async function Home() {
  const notice = await reader.singletons.notice.read();
  return <ComingSoon name="Mother's Day 10K" note={notice?.message || undefined} />;
}

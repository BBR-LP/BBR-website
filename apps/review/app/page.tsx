import { ReviewGrid } from "@/components/ReviewGrid";
import { configured, loadBatch, readDecisions } from "@/lib/review";
import { sections } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Home() {
  if (!configured()) {
    return (
      <main className="mx-auto max-w-xl p-8">
        <h1 className="text-2xl font-semibold">Photo review</h1>
        <p className="mt-3 text-stone-600">This page is not switched on yet.</p>
      </main>
    );
  }
  const batch = await loadBatch();
  const secs = sections(batch.photos).map((s) => ({
    ...s,
    items: s.items.map(({ reasons: _r, ...p }) => p),
  }));
  return <ReviewGrid sections={secs} initial={await readDecisions()} made={batch.made} />;
}

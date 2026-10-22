import { ReviewGrid } from "@/components/ReviewGrid";
import { access } from "@/lib/auth";
import { NoBatch, Unauthorized } from "@/lib/review";
import { sections } from "@/lib/types";

export const dynamic = "force-dynamic";

function Message({ children, signIn }: { children: React.ReactNode; signIn?: boolean }) {
  return (
    <main className="mx-auto max-w-xl p-8">
      <h1 className="text-2xl font-semibold">Photo review</h1>
      <p className="mt-3 text-stone-700">{children}</p>
      {signIn && (
        <a href="/api/auth/login" className="mt-6 inline-block rounded-lg bg-stone-900 px-5 py-3 text-base font-semibold text-white">
          Sign in with GitHub
        </a>
      )}
      {signIn && <p className="mt-4 text-sm text-stone-500">Use the same GitHub login as the website editing screen.</p>}
    </main>
  );
}

export default async function Home() {
  const a = await access();
  if ("error" in a) {
    return a.status === 401 ? <Message signIn>Sign in to choose photos.</Message> : <Message>This page is not switched on yet.</Message>;
  }
  try {
    const batch = await a.store.loadBatch();
    const secs = sections(batch.photos).map((s) => ({ ...s, items: s.items.map(({ reasons: _r, ...p }) => p) }));
    return <ReviewGrid sections={secs} initial={await a.store.readDecisions()} made={batch.made} login={a.login} />;
  } catch (e) {
    if (e instanceof Unauthorized) return <Message signIn>Your sign-in has run out. Please sign in again.</Message>;
    if (e instanceof NoBatch) return <Message>{e.message}</Message>;
    return <Message>The photos could not be loaded just now. Please try again in a minute.</Message>;
  }
}

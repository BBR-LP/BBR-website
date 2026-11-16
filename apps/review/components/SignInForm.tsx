"use client";
import { useState } from "react";

export function SignInForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    try {
      const r = await fetch("/api/auth/request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      setState(r.ok ? "sent" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <p role="status" className="mt-6 rounded-md border border-emerald-300 bg-emerald-50 px-4 py-3 text-emerald-900">
        If that address is on the list, a link is on its way. Open the email and tap the link. It works for 15 minutes.
      </p>
    );
  }
  return (
    <form onSubmit={submit} className="mt-6 flex flex-col gap-3">
      <label className="text-sm text-stone-600" htmlFor="email">Your email</label>
      <input
        id="email"
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="rounded-md border border-stone-300 px-3 py-3 text-base"
      />
      <button type="submit" disabled={state === "sending"} className="rounded-lg bg-stone-900 px-5 py-3 text-base font-semibold text-white disabled:opacity-60">
        {state === "sending" ? "Sending…" : "Email me a link"}
      </button>
      {state === "error" && <p role="alert" className="text-sm text-rose-700">That did not go through. Please try again in a minute.</p>}
    </form>
  );
}

// Shared placeholder page. Proves each site pulls from the shared package; replaced by the real template.
export function ComingSoon({ name, note, staffLoginHref }: { name: string; note?: string; staffLoginHref?: string }) {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <h1 style={{ margin: 0 }}>{name}</h1>
        <p>New site coming soon.</p>
        {note && <p>{note}</p>}
        {staffLoginHref && <p style={{ marginTop: "2rem", fontSize: "0.875rem" }}><a href={staffLoginHref} rel="nofollow" data-untracked style={{ color: "inherit", opacity: 0.7 }}>Staff login</a></p>}
      </div>
    </main>
  );
}

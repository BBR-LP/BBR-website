// Shared placeholder page. Proves each site pulls from the shared package; replaced by the real template.
export function ComingSoon({ name }: { name: string }) {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <h1 style={{ margin: 0 }}>{name}</h1>
        <p>New site coming soon.</p>
      </div>
    </main>
  );
}

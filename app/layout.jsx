export const metadata = {
  title: "Materials",
  description: "Course materials distribution",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='0.9em' font-size='90'>📚</text></svg>" />
      </head>
      <body>
        <div style={{ maxWidth: 920, margin: "0 auto", padding: 16 }}>
          <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "12px 0" }}>
            <a href="/" style={{ fontWeight: 700, fontSize: 18 }}>Materials</a>
            <nav style={{ display: "flex", gap: 12 }}>
              <a href="/" style={{ textDecoration: "none" }}>Home</a>
              <a href="/admin" style={{ textDecoration: "none" }}>Admin</a>
            </nav>
          </header>
          <main>{children}</main>
          <footer style={{ marginTop: 48, color: "#666", fontSize: 12 }}>© {new Date().getFullYear()} Materials</footer>
        </div>
      </body>
    </html>
  );
}

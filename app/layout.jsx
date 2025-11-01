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
        <header style={{ position: 'sticky', top: 0, zIndex: 100 }}>
          <div style={{ maxWidth: 920, margin: "0 auto", padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <a href="/" style={{ fontWeight: 700, fontSize: 20, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 24 }}>📚</span>
              <span>Materials</span>
            </a>
            <nav style={{ display: "flex", gap: 20 }}>
              <a href="/">홈</a>
              <a href="/admin">관리자</a>
            </nav>
          </div>
        </header>
        <main style={{ maxWidth: 920, margin: "0 auto", padding: "0 16px" }}>
          {children}
        </main>
        <footer>
          © {new Date().getFullYear()} Materials · 강의자료 배포 시스템
        </footer>
      </body>
    </html>
  );
}

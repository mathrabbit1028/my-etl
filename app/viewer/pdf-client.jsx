"use client";
import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Use local worker bundled with pdfjs-dist
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();
}

export default function PdfClient({ url }) {
  const containerRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!url) return;
    let cancelled = false;

    async function load() {
      try {
        const loadingTask = pdfjsLib.getDocument({ url });
        const pdf = await loadingTask.promise;
        const pages = pdf.numPages;
        const container = containerRef.current;
        container.innerHTML = '';
        for (let p = 1; p <= pages; p++) {
          const page = await pdf.getPage(p);
          const viewport = page.getViewport({ scale: 1.2 });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          container.appendChild(canvas);
          await page.render({ canvasContext: context, viewport }).promise;
        }
      } catch (e) {
        if (!cancelled) setError(e?.message || 'PDF 로드 실패');
      }
    }

    load();
    return () => { cancelled = true; };
  }, [url]);

  return (
    <div className="grid" style={{ gap: 16, marginTop: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>📄 PDF Viewer</h1>
        <a href="javascript:history.back()" style={{ fontSize: 14 }}>← 뒤로가기</a>
      </div>
      {error && (
        <div className="card" style={{ background: 'var(--danger-light)', color: 'var(--danger-dark)', borderColor: 'var(--danger)' }}>
          ⚠️ {error}
        </div>
      )}
      <div ref={containerRef} className="grid" style={{ gap: 16 }} />
    </div>
  );
}

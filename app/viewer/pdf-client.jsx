"use client";
import { useEffect, useRef, useState } from 'react';

export default function PdfClient({ url }) {
  const containerRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!url) return;
    let cancelled = false;

    async function load() {
      try {
        const pdfjsLib = await import('pdfjs-dist');
        const workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;
        pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
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
    <div className="grid" style={{ gap: 12 }}>
      <h1>PDF Viewer</h1>
      {error && <div className="card" style={{ color: 'crimson' }}>{error}</div>}
      <div ref={containerRef} className="grid" style={{ gap: 12 }} />
    </div>
  );
}

export const dynamic = 'force-dynamic';
import { Suspense } from 'react';
import PdfClient from './pdf-client';

export default function PdfViewerPage({ searchParams }) {
  const url = searchParams?.url;
  if (!url) return <p>url 파라미터가 필요합니다.</p>;
  return (
    <Suspense fallback={<p>로딩 중...</p>}>
      <PdfClient url={url} />
    </Suspense>
  );
}

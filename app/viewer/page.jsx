export const dynamic = 'force-dynamic';
import { Suspense } from 'react';
import PdfClient from './pdf-client';
import { getMaterialById } from '../../lib/db';

export default async function PdfViewerPage({ searchParams }) {
  const resolvedParams = await searchParams;
  let url = resolvedParams?.url;
  const idParam = resolvedParams?.id;
  if (!url && idParam) {
    const id = parseInt(idParam, 10);
    if (Number.isInteger(id) && id > 0) {
      const material = await getMaterialById(id);
      url = material?.blob_url || null;
    }
  }
  if (!url) return <p>url 파라미터가 필요합니다.</p>;
  return (
    <Suspense fallback={<p>로딩 중...</p>}>
      <PdfClient url={url} />
    </Suspense>
  );
}

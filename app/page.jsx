import './globals.css';
import { listTopicsWithMaterials } from '../lib/db';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const topics = await listTopicsWithMaterials();
  return (
    <div className="grid" style={{ gap: 16 }}>
      <h1>강의자료</h1>
      {topics.length === 0 && <p>아직 토픽이 없습니다. 관리자 페이지에서 추가하세요.</p>}
      {topics.map((t) => (
        <section key={t.id} className="card">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <h2 style={{ margin: 0 }}>{t.title}</h2>
          </div>
          {t.materials.length === 0 ? (
            <p style={{ color: '#666' }}>자료가 없습니다.</p>
          ) : (
            <ul>
              {t.materials.map((m) => (
                <li key={m.id} style={{ marginBottom: 6 }}>
                  <span style={{ marginRight: 8 }}>{m.title}</span>
                  <a href={m.blob_url} target="_blank" rel="noreferrer">다운로드</a>
                  {m.file_type?.includes('pdf') && (
                    <>
                      {' '}|{' '}
                      <a href={`/viewer?id=${m.id}`} target="_blank">PDF 보기</a>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}

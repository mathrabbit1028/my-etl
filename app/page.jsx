import './globals.css';
import { listTopicsWithMaterials } from '../lib/db';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const topics = await listTopicsWithMaterials();
  return (
    <div className="grid" style={{ gap: 20, marginTop: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>📖 강의자료</h1>
        <span style={{ color: 'var(--gray-600)', fontSize: 14 }}>
          총 {topics.length}개 토픽 · {topics.reduce((sum, t) => sum + t.materials.length, 0)}개 자료
        </span>
      </div>
      {topics.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--gray-600)' }}>
          <p style={{ margin: 0, fontSize: 16 }}>아직 토픽이 없습니다.</p>
          <p style={{ margin: '8px 0 0 0', fontSize: 14 }}>관리자 페이지에서 토픽과 자료를 추가하세요.</p>
        </div>
      )}
      {topics.map((t) => (
        <section key={t.id} className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2>{t.title}</h2>
            <span style={{ color: 'var(--gray-600)', fontSize: 13 }}>{t.materials.length}개 자료</span>
          </div>
          {t.materials.length === 0 ? (
            <p style={{ color: 'var(--gray-600)', margin: 0, fontSize: 14 }}>자료가 없습니다.</p>
          ) : (
            <ul>
              {t.materials.map((m) => (
                <li key={m.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontWeight: 500, marginRight: 12 }}>{m.title}</span>
                      <span style={{ color: 'var(--gray-600)', fontSize: 13 }}>
                        {m.file_type?.split('/')[1]?.toUpperCase() || 'FILE'}
                        {m.file_size && ` · ${(m.file_size / 1024).toFixed(0)}KB`}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                      {m.file_type?.includes('pdf') && (
                        <a href={`/viewer?id=${m.id}`} style={{ fontSize: 14 }}>
                          👁️ PDF 보기
                        </a>
                      )}
                      <a href={m.blob_url} download={m.file_name} rel="noreferrer" style={{ fontSize: 14 }}>
                        ⬇️ 다운로드
                      </a>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}

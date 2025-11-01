"use client";
import { useOptimistic, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

function TopicForm({ onCreated }) {
  const [title, setTitle] = useState('');
  const [pending, startTransition] = useTransition();

  async function create(e) {
    e.preventDefault();
    if (!title.trim()) return;
    const res = await fetch('/api/topics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert('토픽 생성 실패: ' + (err.error || res.status));
      return;
    }
    setTitle('');
    onCreated && onCreated();
  }

  return (
    <form onSubmit={create} className="card row" style={{ gap: 12, background: 'white', border: '1px solid var(--gray-300)' }}>
      <input placeholder="새 토픽 제목" value={title} onChange={(e)=>setTitle(e.target.value)} style={{ flex: 1 }} />
      <button type="submit" disabled={pending}>{pending ? '추가 중...' : '➕ 토픽 추가'}</button>
    </form>
  );
}

function MaterialUploader({ topicId, onChanged }) {
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);

  async function upload(e) {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.set('topicId', String(topicId));
      fd.set('title', title.trim()); // 서버에서 비어있으면 파일명 사용
      fd.set('file', file);
      const save = await fetch('/api/materials/upload', { method: 'POST', body: fd });
      if (!save.ok) throw new Error('업로드 실패');
      setTitle('');
      setFile(null);
      onChanged && onChanged();
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={upload} className="row" style={{ gap: 12, flexWrap: 'wrap', padding: 12, background: 'var(--gray-50)', borderRadius: 6 }}>
      <input placeholder="자료 제목 (비워두면 파일명 사용)" value={title} onChange={(e)=>setTitle(e.target.value)} style={{ minWidth: 200 }} />
      <input type="file" onChange={(e)=>setFile(e.target.files?.[0] || null)} />
      <button type="submit" disabled={busy}>{busy ? '업로드 중...' : '📤 업로드'}</button>
    </form>
  );
}

function TopicCard({ topic, onChanged }) {
  async function delTopic() {
    if (!confirm('토픽을 삭제하시겠습니까? 포함된 자료도 함께 삭제됩니다.')) return;
    const res = await fetch(`/api/topics/${topic.id}`, { method: 'DELETE' });
    if (!res.ok) {
      let msg = '삭제 실패';
      try { const j = await res.json(); if (j?.error) msg += `: ${j.error}`; } catch {}
      return alert(msg);
    }
    onChanged && onChanged();
  }

  async function delMaterial(id) {
    if (!confirm('자료를 삭제하시겠습니까?')) return;
    const res = await fetch(`/api/materials/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      let msg = '삭제 실패';
      try { const j = await res.json(); if (j?.error) msg += `: ${j.error}`; } catch {}
      return alert(msg);
    }
    onChanged && onChanged();
  }

  return (
    <section className="card" style={{ marginBottom: 16 }}>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          📁 {topic.title}
          <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--gray-600)' }}>
            ({topic.materials.length}개 자료)
          </span>
        </h2>
        <button onClick={delTopic} style={{ background: 'var(--danger-light)', color: 'var(--danger-dark)' }}>
          🗑️ 토픽 삭제
        </button>
      </div>
      <div style={{ marginBottom: 12 }}>
        <MaterialUploader topicId={topic.id} onChanged={onChanged} />
      </div>
      {topic.materials.length > 0 && (
        <ul style={{ marginTop: 16 }}>
          {topic.materials.map(m => (
            <li key={m.id} className="row" style={{ justifyContent: 'space-between', padding: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, marginBottom: 4 }}>{m.title}</div>
                <div style={{ fontSize: 13, color: 'var(--gray-600)' }}>
                  {m.file_name} · {m.file_type?.split('/')[1]?.toUpperCase() || 'FILE'}
                  {m.file_size && ` · ${(m.file_size / 1024).toFixed(0)}KB`}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <a href={m.blob_url} download={m.file_name} rel="noreferrer" style={{ fontSize: 14 }}>
                  ⬇️ 다운로드
                </a>
                {m.file_type?.includes('pdf') && (
                  <a href={`/viewer?id=${m.id}`} target="_blank" style={{ fontSize: 14 }}>
                    👁️ 보기
                  </a>
                )}
                <button onClick={()=>delMaterial(m.id)} style={{ background: 'var(--danger-light)', color: 'var(--danger-dark)', padding: '6px 12px' }}>
                  🗑️
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function AdminClient({ initialTopics }) {
  const router = useRouter();
  const [topics, setTopics] = useState(initialTopics);

  async function refresh() {
    const res = await fetch('/api/topics');
    const data = await res.json();
    setTopics(data.topics || []);
    router.refresh();
  }

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    window.location.href = '/';
  }

  return (
    <div className="grid" style={{ gap: 20, marginTop: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>🔧 관리자</h1>
        <button onClick={logout} style={{ background: 'var(--gray-700)' }}>🚪 로그아웃</button>
      </div>
      <TopicForm onCreated={refresh} />
      {topics.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--gray-600)' }}>
          <p style={{ margin: 0, fontSize: 16 }}>아직 토픽이 없습니다.</p>
          <p style={{ margin: '8px 0 0 0', fontSize: 14 }}>상단 입력창에서 토픽을 추가하세요.</p>
        </div>
      ) : (
        topics.map(t => <TopicCard key={t.id} topic={t} onChanged={refresh} />)
      )}
    </div>
  );
}

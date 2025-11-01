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
    <form onSubmit={create} className="card row" style={{ gap: 8 }}>
      <input placeholder="새 토픽 제목" value={title} onChange={(e)=>setTitle(e.target.value)} />
      <button type="submit" disabled={pending}>추가</button>
    </form>
  );
}

function MaterialUploader({ topicId, onChanged }) {
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);

  async function upload(e) {
    e.preventDefault();
    if (!file || !title.trim()) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.set('topicId', String(topicId));
      fd.set('title', title);
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
    <form onSubmit={upload} className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
      <input placeholder="자료 제목" value={title} onChange={(e)=>setTitle(e.target.value)} />
      <input type="file" onChange={(e)=>setFile(e.target.files?.[0] || null)} />
      <button type="submit" disabled={busy}>업로드</button>
    </form>
  );
}

function TopicCard({ topic, onChanged }) {
  async function delTopic() {
    if (!confirm('토픽을 삭제하시겠습니까? 포함된 자료도 함께 삭제됩니다.')) return;
    const res = await fetch(`/api/topics/${topic.id}`, { method: 'DELETE' });
    if (!res.ok) return alert('삭제 실패');
    onChanged && onChanged();
  }

  async function delMaterial(id) {
    if (!confirm('자료를 삭제하시겠습니까?')) return;
    const res = await fetch(`/api/materials/${id}`, { method: 'DELETE' });
    if (!res.ok) return alert('삭제 실패');
    onChanged && onChanged();
  }

  return (
    <section className="card" style={{ marginBottom: 12 }}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0 }}>{topic.title}</h2>
        <button onClick={delTopic} style={{ background: '#fee2e2' }}>토픽 삭제</button>
      </div>
      <div style={{ marginTop: 8 }}>
        <MaterialUploader topicId={topic.id} onChanged={onChanged} />
      </div>
      <ul>
        {topic.materials.map(m => (
          <li key={m.id} className="row" style={{ justifyContent: 'space-between' }}>
            <div>
              <strong>{m.title}</strong>
              {' '}
              <a href={m.blob_url} target="_blank" rel="noreferrer">다운로드</a>
              {m.file_type?.includes('pdf') && (
                <>
                  {' '}|{' '}
                  <a href={`/viewer?url=${encodeURIComponent(m.blob_url)}`} target="_blank">PDF 보기</a>
                </>
              )}
            </div>
            <button onClick={()=>delMaterial(m.id)} style={{ background: '#fee2e2' }}>삭제</button>
          </li>
        ))}
      </ul>
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
    <div className="grid" style={{ gap: 16 }}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <TopicForm onCreated={refresh} />
        <button onClick={logout}>로그아웃</button>
      </div>
      {topics.map(t => (
        <TopicCard key={t.id} topic={t} onChanged={refresh} />
      ))}
      {topics.length === 0 && <p>아직 토픽이 없습니다. 상단에서 추가하세요.</p>}
    </div>
  );
}

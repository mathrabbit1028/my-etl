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
    <div className="card">
      <h3 style={{ margin: '0 0 12px 0', fontSize: 16, fontWeight: 600 }}>➕ 새 토픽 추가</h3>
      <form onSubmit={create} className="row" style={{ gap: 12 }}>
        <input 
          placeholder="토픽 제목을 입력하세요" 
          value={title} 
          onChange={(e)=>setTitle(e.target.value)} 
          style={{ flex: 1 }} 
        />
        <button type="submit" disabled={pending}>
          {pending ? '추가 중...' : '추가'}
        </button>
      </form>
    </div>
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
    <form onSubmit={upload} style={{ 
      padding: 16, 
      background: 'white', 
      border: '2px dashed var(--gray-300)', 
      borderRadius: 8,
      transition: 'all 0.2s ease'
    }}>
      <div className="grid" style={{ gap: 12 }}>
        <div className="row" style={{ gap: 12, flexWrap: 'wrap' }}>
          <input 
            placeholder="자료 제목 (비워두면 파일명 사용)" 
            value={title} 
            onChange={(e)=>setTitle(e.target.value)} 
            style={{ flex: 1, minWidth: 200 }} 
          />
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <label style={{ 
              padding: '8px 16px', 
              background: 'var(--gray-100)', 
              borderRadius: 6, 
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 500,
              display: 'inline-block'
            }}>
              📎 파일 선택
              <input 
                type="file" 
                onChange={(e)=>setFile(e.target.files?.[0] || null)} 
                style={{ display: 'none' }}
              />
            </label>
            {file && <span style={{ fontSize: 13, color: 'var(--gray-600)' }}>{file.name}</span>}
          </div>
        </div>
        <button 
          type="submit" 
          disabled={busy || !file}
          className="btn-block btn-success"
          style={{ padding: '10px 16px', fontWeight: 600 }}
        >
          {busy ? '⏳ 업로드 중...' : file ? '📤 업로드' : '파일을 선택하세요'}
        </button>
      </div>
    </form>
  );
}

function TopicCard({ topic, onChanged, onMoveUp, onMoveDown, canMoveUp, canMoveDown }) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(topic.title);
  const [saving, setSaving] = useState(false);

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

  async function saveTitle() {
    if (!editTitle.trim()) {
      alert('제목을 입력하세요');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/topics/${topic.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle.trim() })
      });
      if (!res.ok) throw new Error('수정 실패');
      setEditing(false);
      onChanged && onChanged();
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  function cancelEdit() {
    setEditTitle(topic.title);
    setEditing(false);
  }

  async function delMaterial(id) {
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
    <section className="card" style={{ marginBottom: 20 }}>
      <div style={{ 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16
      }}>
        <div style={{ flex: 1 }}>
          {editing ? (
            <div className="row" style={{ gap: 8 }}>
              <input 
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                style={{ flex: 1, maxWidth: 400, fontSize: 16, fontWeight: 600 }}
                autoFocus
              />
              <button onClick={saveTitle} disabled={saving} style={{ padding: '6px 12px', fontSize: 14 }}>
                {saving ? '⏳' : '✓ 저장'}
              </button>
              <button onClick={cancelEdit} className="btn-danger-light btn-sm">
                ✕ 취소
              </button>
            </div>
          ) : (
            <div>
              <h2 style={{ margin: 0, fontSize: 20, display: 'inline-block', marginRight: 12 }}>
                📁 {topic.title}
              </h2>
              <button 
                onClick={() => setEditing(true)} 
                style={{ fontSize: 13, padding: '4px 10px', background: 'var(--gray-100)', color: 'var(--gray-700)' }}
              >
                ✏️ 수정
              </button>
            </div>
          )}
          <p className="small muted" style={{ margin: '4px 0 0 0' }}>
            {topic.materials.length}개 자료 · 마지막 수정: {new Date(topic.created_at).toLocaleDateString('ko-KR')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onMoveUp} disabled={!canMoveUp} className="btn-sm" style={{ background: 'var(--gray-100)', color: 'var(--gray-700)' }}>
            ↑
          </button>
          <button onClick={onMoveDown} disabled={!canMoveDown} className="btn-sm" style={{ background: 'var(--gray-100)', color: 'var(--gray-700)' }}>
            ↓
          </button>
          <button onClick={delTopic} className="btn-danger-light" style={{ padding: '8px 16px' }}>
            🗑️ 삭제
          </button>
        </div>
      </div>
      
      <div style={{ marginBottom: 16 }}>
        <MaterialUploader topicId={topic.id} onChanged={onChanged} />
      </div>

      {topic.materials.length > 0 && (
        <ul className="materials">
          {topic.materials.map((m, idx) => (
            <li key={m.id}>
              <div className="row-between">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                  <div className={`file-icon ${m.file_type?.includes('pdf') ? 'file-icon--pdf' : m.file_type?.includes('image') ? 'file-icon--image' : 'file-icon--other'}`}>
                    {m.file_type?.includes('pdf') ? '📄' : 
                     m.file_type?.includes('image') ? '🖼️' : 
                     m.file_type?.includes('video') ? '🎥' : '📎'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, marginBottom: 2 }}>{m.title}</div>
                    <div className="small muted">
                      {m.file_type?.split('/')[1]?.toUpperCase() || 'FILE'}
                      {m.file_size && ` · ${(m.file_size / 1024).toFixed(0)}KB`}
                    </div>
                  </div>
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
                  <button onClick={()=>delMaterial(m.id)} className="btn-sm btn-danger-light">
                    🗑️
                  </button>
                </div>
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
  const [reordering, setReordering] = useState(false);

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

  async function moveTopicUp(index) {
    if (index <= 0) return;
    setReordering(true);
    const newOrder = [...topics];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    setTopics(newOrder);
    await saveTopicOrder(newOrder);
    setReordering(false);
  }

  async function moveTopicDown(index) {
    if (index >= topics.length - 1) return;
    setReordering(true);
    const newOrder = [...topics];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    setTopics(newOrder);
    await saveTopicOrder(newOrder);
    setReordering(false);
  }

  async function saveTopicOrder(orderedTopics) {
    const topicIds = orderedTopics.map(t => t.id);
    const res = await fetch('/api/topics/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topicIds })
    });
    if (!res.ok) {
      alert('순서 변경 실패');
      await refresh();
    }
  }

  return (
    <div className="grid" style={{ gap: 20, marginTop: 24 }}>
      <div className="page-header">
        <div>
          <h1 style={{ margin: 0 }}>🔧 관리자 대시보드</h1>
          <p className="muted small" style={{ margin: '4px 0 0 0' }}>
            토픽 {topics.length}개 · 전체 자료 {topics.reduce((sum, t) => sum + t.materials.length, 0)}개
          </p>
        </div>
        <button onClick={logout} className="btn-dark" style={{ padding: '10px 20px' }}>
          🚪 로그아웃
        </button>
      </div>

      <TopicForm onCreated={refresh} />

      {topics.length === 0 ? (
        <div className="card" style={{ 
          textAlign: 'center', 
          padding: 60, 
          background: 'white'
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📚</div>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--gray-900)' }}>
            아직 토픽이 없습니다
          </p>
          <p style={{ margin: '8px 0 0 0', fontSize: 14, color: 'var(--gray-600)' }}>
            상단의 "새 토픽 추가"에서 첫 번째 토픽을 만들어보세요
          </p>
        </div>
      ) : (
        topics.map((t, idx) => (
          <TopicCard 
            key={t.id} 
            topic={t} 
            onChanged={refresh}
            onMoveUp={() => moveTopicUp(idx)}
            onMoveDown={() => moveTopicDown(idx)}
            canMoveUp={idx > 0 && !reordering}
            canMoveDown={idx < topics.length - 1 && !reordering}
          />
        ))
      )}
    </div>
  );
}

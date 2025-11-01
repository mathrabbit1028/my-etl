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
    <div className="card" style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)', border: 'none', color: 'white' }}>
      <h3 style={{ margin: '0 0 12px 0', fontSize: 16, fontWeight: 600 }}>➕ 새 토픽 추가</h3>
      <form onSubmit={create} className="row" style={{ gap: 12 }}>
        <input 
          placeholder="토픽 제목을 입력하세요" 
          value={title} 
          onChange={(e)=>setTitle(e.target.value)} 
          style={{ flex: 1, background: 'rgba(255,255,255,0.9)', border: 'none' }} 
        />
        <button type="submit" disabled={pending} style={{ background: 'white', color: 'var(--primary)', fontWeight: 600 }}>
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
          style={{ 
            width: '100%',
            padding: '10px 16px',
            background: file ? 'var(--success)' : 'var(--gray-300)',
            fontWeight: 600
          }}
        >
          {busy ? '⏳ 업로드 중...' : file ? '📤 업로드' : '파일을 선택하세요'}
        </button>
      </div>
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
    <section className="card" style={{ 
      marginBottom: 20,
      border: '2px solid var(--gray-200)',
      overflow: 'hidden'
    }}>
      <div style={{ 
        padding: 20, 
        background: 'linear-gradient(to right, var(--gray-50), white)',
        borderBottom: '1px solid var(--gray-200)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, fontSize: 20 }}>
            📁 {topic.title}
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: 13, color: 'var(--gray-600)' }}>
            {topic.materials.length}개 자료 · 마지막 수정: {new Date(topic.created_at).toLocaleDateString('ko-KR')}
          </p>
        </div>
        <button 
          onClick={delTopic} 
          style={{ 
            background: 'transparent',
            color: 'var(--danger)',
            border: '1px solid var(--danger)',
            padding: '8px 16px'
          }}
        >
          🗑️ 삭제
        </button>
      </div>
      
      <div style={{ padding: 20, background: 'var(--gray-50)' }}>
        <MaterialUploader topicId={topic.id} onChanged={onChanged} />
      </div>

      {topic.materials.length > 0 && (
        <div style={{ padding: '0 20px 20px 20px' }}>
          <div style={{ 
            display: 'grid', 
            gap: 8,
            marginTop: 12
          }}>
            {topic.materials.map((m, idx) => (
              <div 
                key={m.id} 
                style={{ 
                  padding: 16,
                  background: 'white',
                  border: '1px solid var(--gray-200)',
                  borderRadius: 8,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--gray-200)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: 8,
                    background: m.file_type?.includes('pdf') ? '#fee2e2' : 
                               m.file_type?.includes('image') ? '#dbeafe' : '#f3f4f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                    flexShrink: 0
                  }}>
                    {m.file_type?.includes('pdf') ? '📄' : 
                     m.file_type?.includes('image') ? '🖼️' : 
                     m.file_type?.includes('video') ? '🎥' : '📎'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 15 }}>{m.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--gray-600)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span>{m.file_name}</span>
                      <span>·</span>
                      <span>{m.file_type?.split('/')[1]?.toUpperCase() || 'FILE'}</span>
                      {m.file_size && (
                        <>
                          <span>·</span>
                          <span>{(m.file_size / 1024).toFixed(0)}KB</span>
                        </>
                      )}
                      <span>·</span>
                      <span>{new Date(m.created_at).toLocaleDateString('ko-KR')}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                  <a 
                    href={m.blob_url} 
                    download={m.file_name} 
                    rel="noreferrer" 
                    style={{ 
                      padding: '6px 12px',
                      background: 'var(--gray-100)',
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: 500,
                      textDecoration: 'none'
                    }}
                  >
                    ⬇️
                  </a>
                  {m.file_type?.includes('pdf') && (
                    <a 
                      href={`/viewer?id=${m.id}`} 
                      target="_blank" 
                      style={{ 
                        padding: '6px 12px',
                        background: 'var(--gray-100)',
                        borderRadius: 6,
                        fontSize: 13,
                        fontWeight: 500,
                        textDecoration: 'none'
                      }}
                    >
                      👁️
                    </a>
                  )}
                  <button 
                    onClick={()=>delMaterial(m.id)} 
                    style={{ 
                      background: 'transparent',
                      color: 'var(--danger)',
                      padding: '6px 12px',
                      border: '1px solid var(--danger-light)',
                      fontSize: 13
                    }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
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
    <div className="grid" style={{ gap: 24, marginTop: 24 }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: '20px 24px',
        background: 'white',
        borderRadius: 12,
        boxShadow: 'var(--shadow)'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, display: 'flex', alignItems: 'center', gap: 12 }}>
            🔧 관리자 대시보드
          </h1>
          <p style={{ margin: '4px 0 0 0', color: 'var(--gray-600)', fontSize: 14 }}>
            토픽 {topics.length}개 · 전체 자료 {topics.reduce((sum, t) => sum + t.materials.length, 0)}개
          </p>
        </div>
        <button 
          onClick={logout} 
          style={{ 
            background: 'var(--gray-700)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '10px 20px'
          }}
        >
          🚪 로그아웃
        </button>
      </div>

      <TopicForm onCreated={refresh} />

      {topics.length === 0 ? (
        <div className="card" style={{ 
          textAlign: 'center', 
          padding: 60, 
          background: 'white',
          border: '2px dashed var(--gray-300)'
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
        topics.map(t => <TopicCard key={t.id} topic={t} onChanged={refresh} />)
      )}
    </div>
  );
}

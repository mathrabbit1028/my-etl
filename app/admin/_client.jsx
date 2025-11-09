"use client";
import { useOptimistic, useState, useTransition, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

function TopicForm({ onCreated, owner = 'default' }) {
  const [title, setTitle] = useState('');
  const [pending, startTransition] = useTransition();

  async function create(e) {
    e.preventDefault();
    if (!title.trim()) return;
    const res = await fetch('/api/topics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, owner })
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
  const [directMode, setDirectMode] = useState(true); // enable direct upload by default
  const [progress, setProgress] = useState(0);
  const xhrRef = useRef(null);

  async function upload(e) {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    try {
      if (directMode) {
        // 1. Request direct upload URL & token
        const metaRes = await fetch('/api/upload-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ originalName: file.name, contentType: file.type })
        });
        const meta = await metaRes.json();
        if (!metaRes.ok) throw new Error(meta.error || 'URL 발급 실패');
        // 2. POST file directly to Blob with progress
        const uploaded = await new Promise((resolve, reject) => {
          try {
            const xhr = new XMLHttpRequest();
            xhrRef.current = xhr;
            xhr.open('POST', meta.uploadUrl, true);
            xhr.setRequestHeader('Content-Type', meta.contentType || 'application/octet-stream');
            xhr.setRequestHeader('Authorization', `Bearer ${meta.token}`);
            xhr.upload.onprogress = (ev) => {
              if (ev.lengthComputable) {
                const pct = Math.max(0, Math.min(100, Math.round((ev.loaded / ev.total) * 100)));
                setProgress(pct);
              }
            };
            xhr.onerror = () => reject(new Error('업로드 실패'));
            xhr.onabort = () => reject(new Error('업로드 취소됨'));
            xhr.onreadystatechange = () => {
              if (xhr.readyState === 4) {
                if (xhr.status >= 200 && xhr.status < 300) {
                  try { resolve(JSON.parse(xhr.responseText || '{}')); }
                  catch { resolve({}); }
                } else {
                  reject(new Error(`업로드 실패 (${xhr.status})`));
                }
              }
            };
            xhr.send(file);
          } catch (err) {
            reject(err);
          }
        });
        const blobUrl = uploaded?.url || uploaded?.downloadUrl || uploaded?.pathname || null;
        if (!blobUrl) throw new Error('Blob URL 없음');
        // 3. Save material metadata
        const saveRes = await fetch('/api/materials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topicId,
            title: title.trim() || file.name,
            fileName: file.name,
            fileType: file.type || 'application/octet-stream',
            fileSize: file.size,
            blobUrl
          })
        });
        const saved = await saveRes.json();
        if (!saveRes.ok) throw new Error(saved.error || '메타 저장 실패');
      } else {
        // fallback: legacy server-side multipart
        const fd = new FormData();
        fd.set('topicId', String(topicId));
        fd.set('title', title.trim());
        fd.set('file', file);
        const save = await fetch('/api/materials/upload', { method: 'POST', body: fd });
        if (!save.ok) throw new Error('업로드 실패');
      }
      setTitle('');
      setFile(null);
      setProgress(0);
      xhrRef.current = null;
      onChanged && onChanged();
    } catch (e) {
      console.error('UPLOAD_ERROR', e);
      alert(e.message);
    } finally {
      setBusy(false);
    }
  }

  function cancelUpload() {
    try { xhrRef.current?.abort(); } catch {}
    setBusy(false);
    setProgress(0);
    xhrRef.current = null;
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
        <div className="row" style={{ gap: 8 }}>
          <button 
            type="submit" 
            disabled={busy || !file}
            className="btn-success"
            style={{ padding: '10px 16px', fontWeight: 600, flex: 1 }}
          >
            {busy ? (progress>0 ? `⏳ 업로드 ${progress}%` : '⏳ 업로드 준비중...') : file ? (directMode ? '📤 Direct 업로드' : '📤 서버 업로드') : '파일을 선택하세요'}
          </button>
          <button type="button" className="btn-sm btn-ghost" disabled={busy} onClick={()=>setDirectMode(m=>!m)}>
            {directMode ? '⇄ 서버 방식' : '⇄ Direct'}
          </button>
          {directMode && busy && progress>0 && (
            <button type="button" className="btn-sm btn-danger-light" onClick={cancelUpload}>취소</button>
          )}
        </div>
        {directMode && busy && (
          <div className="grid" style={{ gap: 4 }}>
            <div className="progress"><div className="bar" style={{ width: `${progress}%` }} /></div>
            <div className="progress-text">{progress}%</div>
          </div>
        )}
      </div>
    </form>
  );
}

function TopicCard({ topic, onChanged, onMoveUp, onMoveDown, canMoveUp, canMoveDown, owners, ownerSlug }) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(topic.title);
  const [saving, setSaving] = useState(false);
  const [changingOwner, setChangingOwner] = useState(false);

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

  async function changeTopicOwner(newOwner) {
    if (!newOwner) return;
    setChangingOwner(true);
    try {
      const res = await fetch(`/api/topics/${topic.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner: newOwner })
      });
      if (!res.ok) throw new Error('사람 변경 실패');
      onChanged && onChanged();
    } catch (e) {
      alert(e.message);
    } finally {
      setChangingOwner(false);
    }
  }

  return (
    <section className="card" style={{ marginBottom: 20 }}>
      <div className="row-between" style={{ marginBottom: 16 }}>
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
              <button onClick={() => setEditing(true)} className="btn-sm btn-ghost">✏️ 수정</button>
            </div>
          )}
          <p className="small muted" style={{ margin: '4px 0 0 0' }}>
            {topic.materials.length}개 자료 · 마지막 수정: {new Date(topic.created_at).toLocaleDateString('ko-KR')}
          </p>
        </div>
        <div className="toolbar">
          <select 
            value={ownerSlug}
            onChange={(e)=>changeTopicOwner(e.target.value)}
            disabled={changingOwner}
            className="select-sm"
            title="이 토픽의 사람 변경"
          >
            {owners.map(o => (
              <option key={o.id} value={o.slug}>{o.slug==='default' ? '기타' : o.name}</option>
            ))}
          </select>
          <button onClick={onMoveUp} disabled={!canMoveUp} className="btn-sm btn-ghost">↑</button>
          <button onClick={onMoveDown} disabled={!canMoveDown} className="btn-sm btn-ghost">↓</button>
          <button onClick={delTopic} className="btn-sm btn-danger-light">🗑️ 삭제</button>
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
                <div className="toolbar" style={{ gap: 12 }}>
                  {m.file_type?.includes('pdf') && (
                    <a href={`/viewer?id=${m.id}`} style={{ fontSize: 14 }}>
                      👁️ PDF 보기
                    </a>
                  )}
                  <a href={m.blob_url} download={m.file_name} rel="noreferrer" style={{ fontSize: 14 }}>
                    ⬇️ 다운로드
                  </a>
                  <OwnerSelectForMaterial owners={owners} currentOwner={ownerSlug} materialId={m.id} onChanged={onChanged} />
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

function OwnerSelectForMaterial({ owners, currentOwner, materialId, onChanged }) {
  const [busy, setBusy] = useState(false);

  async function onChangeOwner(e) {
    const newOwner = e.target.value;
    if (!newOwner || newOwner === currentOwner) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/materials/${materialId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner: newOwner })
      });
      if (!res.ok) throw new Error('사람 변경 실패');
      onChanged && onChanged();
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <select value={currentOwner} onChange={onChangeOwner} disabled={busy} style={{ padding: '6px 8px', border: '1px solid var(--gray-300)', borderRadius: 6, fontSize: 13 }} title="파일의 사람 변경 (새 사람의 미분류로 이동)">
      {owners.map(o => (
  <option key={o.id} value={o.slug}>{o.slug==='default' ? '기타' : o.name}</option>
      ))}
    </select>
  );
}

function OwnerAdder({ onAdded }) {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  async function add(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      const res = await fetch('/api/owners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() })
      });
      if (!res.ok) throw new Error('추가 실패');
      setName('');
      onAdded && onAdded();
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={add} className="grid" style={{ gap: 8, marginTop: 12 }}>
      <input placeholder="이름 (예: 홍길동)" value={name} onChange={(e)=>setName(e.target.value)} />
      <button type="submit" disabled={busy} className="btn-sm">{busy ? '추가 중...' : '사람 추가'}</button>
    </form>
  );
}

function OwnerItem({ o, active, onSelect, onChanged }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(o.name);
  const [busy, setBusy] = useState(false);
  const isDefault = o.slug === 'default';

  async function save(e) {
    e?.preventDefault?.();
    if (!name.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/owners/${o.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() })
      });
      if (!res.ok) throw new Error('수정 실패');
      setEditing(false);
      onChanged && onChanged();
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (isDefault) return;
    if (!confirm('사람을 삭제하시겠습니까? 해당 사람의 토픽은 기본 소유자로 이동합니다.')) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/owners/${o.id}`, { method: 'DELETE' });
      const ok = res.ok;
      if (!ok) {
        let msg = '삭제 실패';
        try { const j = await res.json(); if (j?.error) msg += `: ${j.error}`; } catch {}
        throw new Error(msg);
      }
      onChanged && onChanged();
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
      {editing ? (
        <div className={`owner-item ${active ? 'active' : ''}`} style={{ flex: 1 }}>
          <form onSubmit={save} className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
            <input type="text" value={name} onChange={(e)=>setName(e.target.value)} style={{ flex: '1 1 auto', minWidth: 140, maxWidth: '100%' }} />
            <button className="btn-sm" disabled={busy}>{busy ? '저장중' : '✓'}</button>
            <button type="button" className="btn-sm btn-danger-light" onClick={()=>{ setEditing(false); setName(o.name); }}>✕</button>
          </form>
        </div>
      ) : (
        <a href={`#`} onClick={(e)=>{ e.preventDefault(); onSelect(o.slug); }} className={`owner-item ${active ? 'active' : ''}`} style={{ flex: 1 }}>
          <span>{isDefault ? '기타' : o.name}</span>
        </a>
      )}
      {!editing && (
        <div className="row" style={{ gap: 6 }}>
          <button className="btn-sm btn-ghost" onClick={()=>setEditing(true)}>✏️</button>
          <button className="btn-sm btn-danger-light" disabled={isDefault} onClick={remove}>🗑️</button>
        </div>
      )}
    </div>
  );
}

export default function AdminClient({ initialOwners = [], initialOwner = 'default', initialTopics }) {
  const router = useRouter();
  const [topics, setTopics] = useState(initialTopics);
  const [owners, setOwners] = useState(initialOwners);
  const [owner, setOwner] = useState(initialOwner);
  const [reordering, setReordering] = useState(false);

  async function refresh(nextOwner) {
    const current = nextOwner || owner;
    const res = await fetch(`/api/topics?owner=${current}`);
    const data = await res.json();
    setTopics(data.topics || []);
    router.refresh();
  }

  // Auto-refresh when selected owner changes to avoid double-click issue
  useEffect(() => {
    (async () => { await refresh(owner); })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [owner]);

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

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 16 }}>
        <aside className="card" style={{ padding: 12 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>사람</div>
          <div className="grid" style={{ gap: 8 }}>
            {owners.map(o => (
              <OwnerItem 
                key={o.id} 
                o={o} 
                active={o.slug === owner} 
                onSelect={(slug)=>{ setOwner(slug); history.replaceState(null, '', `/admin?owner=${slug}`); }} 
                onChanged={async ()=>{ const r = await fetch('/api/owners'); const j = await r.json(); setOwners(j.owners||[]); if (!j.owners?.some(ow=>ow.slug===owner)) { setOwner('default'); history.replaceState(null, '', `/admin?owner=default`); } }} 
              />
            ))}
          </div>
          <OwnerAdder onAdded={async ()=>{ const r = await fetch('/api/owners'); const j = await r.json(); setOwners(j.owners||[]); }} />
        </aside>

        <div className="grid" style={{ gap: 16 }}>
          <TopicForm onCreated={refresh} owner={owner} />

          {topics.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 60, background: 'white' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📚</div>
              <p style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--gray-900)' }}>
                아직 토픽이 없습니다
              </p>
              <p style={{ margin: '8px 0 0 0', fontSize: 14, color: 'var(--gray-600)' }}>
                좌측에서 사람을 선택하거나 새 토픽을 추가하세요
              </p>
            </div>
          ) : (
            topics.map((t, idx) => (
              <TopicCard 
                key={t.id} 
                topic={t} 
                onChanged={()=>refresh(owner)}
                onMoveUp={() => moveTopicUp(idx)}
                onMoveDown={() => moveTopicDown(idx)}
                canMoveUp={idx > 0 && !reordering}
                canMoveDown={idx < topics.length - 1 && !reordering}
                owners={owners}
                ownerSlug={owner}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

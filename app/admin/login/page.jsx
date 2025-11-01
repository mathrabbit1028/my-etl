"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      if (!res.ok) throw new Error('로그인 실패');
      router.push('/admin');
      router.refresh();
    } catch (e) {
      setError(e.message || '로그인 실패');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid" style={{ maxWidth: 420, margin: '60px auto', gap: 20 }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: 32, marginBottom: 8 }}>🔐 관리자 로그인</h1>
        <p style={{ color: 'var(--gray-600)', margin: 0 }}>강의자료 관리를 위해 로그인하세요</p>
      </div>
      {error && (
        <div className="card" style={{ background: 'var(--danger-light)', color: 'var(--danger-dark)', borderColor: 'var(--danger)' }}>
          ⚠️ {error}
        </div>
      )}
      <form onSubmit={submit} className="card grid" style={{ gap: 16 }}>
        <label className="grid" style={{ gap: 6 }}>
          <span style={{ fontWeight: 500, fontSize: 14 }}>관리자 비밀번호</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="비밀번호를 입력하세요" />
        </label>
        <button type="submit" disabled={loading} style={{ padding: '12px 16px', fontSize: 16 }}>
          {loading ? '로그인 중...' : '🔓 로그인'}
        </button>
      </form>
    </div>
  );
}

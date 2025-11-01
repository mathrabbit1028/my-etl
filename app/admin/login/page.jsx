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
    <div className="grid" style={{ maxWidth: 420, margin: '40px auto', gap: 12 }}>
      <h1>관리자 로그인</h1>
      {error && <div className="card" style={{ color: 'crimson' }}>{error}</div>}
      <form onSubmit={submit} className="card grid" style={{ gap: 12 }}>
        <label className="grid" style={{ gap: 6 }}>
          <span>관리자 비밀번호</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        <button type="submit" disabled={loading}>{loading ? '로그인 중...' : '로그인'}</button>
      </form>
    </div>
  );
}

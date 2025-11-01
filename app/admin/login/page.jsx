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
    <div style={{ maxWidth: 460, margin: '80px auto', padding: '0 16px' }}>
      <div className="card" style={{ padding: 40 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔐</div>
          <h1 style={{ fontSize: 24, marginBottom: 8 }}>관리자 로그인</h1>
          <p style={{ color: 'var(--gray-600)', margin: 0, fontSize: 14 }}>강의자료 관리를 위해 로그인하세요</p>
        </div>
        
        {error && (
          <div style={{ 
            padding: 12, 
            background: 'var(--danger-light)', 
            color: 'var(--danger-dark)', 
            borderRadius: 6,
            marginBottom: 20,
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            ⚠️ {error}
          </div>
        )}
        
        <form onSubmit={submit} className="grid" style={{ gap: 20 }}>
          <div className="grid" style={{ gap: 8 }}>
            <label style={{ fontWeight: 500, fontSize: 14, color: 'var(--gray-700)' }}>
              관리자 비밀번호
            </label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              placeholder="비밀번호를 입력하세요"
              style={{ fontSize: 15, padding: '10px 12px' }}
            />
          </div>
          <button type="submit" disabled={loading} style={{ padding: '12px 16px', fontSize: 15, fontWeight: 600 }}>
            {loading ? '⏳ 로그인 중...' : '로그인'}
          </button>
        </form>
        
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <a href="/" style={{ fontSize: 14, color: 'var(--gray-600)' }}>← 홈으로 돌아가기</a>
        </div>
      </div>
    </div>
  );
}

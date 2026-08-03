'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInError) {
      setError(
        signInError.message === 'Invalid login credentials'
          ? 'E-mail ou senha incorretos.'
          : signInError.message
      );
      return;
    }
    router.push('/app');
    router.refresh();
  }

  return (
    <div className="page-narrow">
      <div className="auth-brand">
        <div className="brand-mark" style={{ background: 'var(--blue-soft)', color: 'var(--blue)', border: 'none' }}>M+S</div>
      </div>
      <div className="auth-card">
        <h1>Entrar</h1>
        <p className="sub">Acesse seu Simulador de Margem e Sell-out.</p>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">E-mail</label>
            <input
              id="email" type="email" required value={email}
              onChange={(e) => setEmail(e.target.value)} placeholder="voce@empresa.com"
            />
          </div>
          <div className="field">
            <label htmlFor="password">Senha</label>
            <input
              id="password" type="password" required value={password}
              onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <div className="form-actions">
            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </div>
        </form>

        <div className="auth-switch">
          Ainda não tem conta? <Link href="/cadastro">Criar conta grátis</Link>
        </div>
      </div>
    </div>
  );
}

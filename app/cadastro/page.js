'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmMsg, setConfirmMsg] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
    setLoading(false);

    if (signUpError) {
      setError(
        signUpError.message.includes('already registered')
          ? 'Este e-mail já tem uma conta. Tente entrar.'
          : signUpError.message
      );
      return;
    }

    if (data.session) {
      router.push('/app');
      router.refresh();
    } else {
      setConfirmMsg('Conta criada! Verifique seu e-mail para confirmar o cadastro antes de entrar.');
    }
  }

  if (confirmMsg) {
    return (
      <div className="page-narrow">
        <div className="auth-card">
          <h1>Quase lá</h1>
          <p className="sub">{confirmMsg}</p>
          <div className="auth-switch">
            <Link href="/entrar">Ir para o login</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-narrow">
      <div className="auth-brand">
        <div className="brand-mark" style={{ background: 'var(--blue-soft)', color: 'var(--blue)', border: 'none' }}>L</div>
      </div>
      <div className="auth-card">
        <h1>Criar conta grátis</h1>
        <p className="sub">Comece a simular condições comerciais em minutos.</p>

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
              id="password" type="password" required minLength={6} value={password}
              onChange={(e) => setPassword(e.target.value)} placeholder="mínimo 6 caracteres"
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <div className="form-actions">
            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? 'Criando conta...' : 'Criar conta grátis'}
            </button>
          </div>
        </form>

        <div className="auth-switch">
          Já tem conta? <Link href="/entrar">Entrar</Link>
        </div>
      </div>
    </div>
  );
}

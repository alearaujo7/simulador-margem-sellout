import Link from 'next/link';
import { createPublicClient } from '../../../lib/supabase/publicClient';
import { computeMetrics, formatBRL, formatPct, buildSummary } from '../../../lib/calc';
import LetrumMark from '../../LetrumMark';

export const dynamic = 'force-dynamic';

async function getSharedSimulation(token) {
  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc('get_shared_simulation', { p_token: token });
  if (error || !data || data.length === 0) return null;
  return data[0];
}

export default async function SharedSimulationPage({ params }) {
  const { token } = params;
  const record = await getSharedSimulation(token);

  if (!record) {
    return (
      <div className="page-narrow">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <h1>Link não encontrado</h1>
          <p className="sub">Este link de simulação não existe mais ou não é mais compartilhado.</p>
          <Link href="/" className="btn btn-primary">Ir para o início</Link>
        </div>
      </div>
    );
  }

  const m = computeMetrics(record);
  const summary = buildSummary(record, m);

  return (
    <div className="page">
      <header className="top-bar">
        <div className="top-bar-left">
          <LetrumMark size={46} />
          <div>
            <h1>{record.produto}</h1>
            <p className="tagline">Simulação compartilhada, somente leitura</p>
          </div>
        </div>
      </header>

      <section className="cards-section">
        <div className="cards-row">
          <div className="card" data-tone="blue"><div className="card-label">Margem atual</div><div className="card-value">{formatPct(m.margemAtual)}</div></div>
          <div className="card" data-tone="green"><div className="card-label">Nova margem</div><div className="card-value">{formatPct(m.novaMargem)}</div></div>
          <div className="card" data-tone="blue"><div className="card-label">Markup</div><div className="card-value">{formatPct(m.markup)}</div></div>
          <div className="card" data-tone="amber"><div className="card-label">Investimento total</div><div className="card-value">{formatBRL(m.investimentoTotal)}</div></div>
        </div>
      </section>

      <section className="panel">
        <h2>Antes e depois do sell-out</h2>
        <div className="compare-grid">
          <div className="compare-col before">
            <h3>Antes</h3>
            <div className="compare-row"><span>Custo atual</span><span>{formatBRL(record.custo)}</span></div>
            <div className="compare-row"><span>Margem atual</span><span>{formatPct(m.margemAtual)}</span></div>
            <div className="compare-row"><span>Lucro por unidade</span><span>{formatBRL(m.lucroUnitario)}</span></div>
            <div className="compare-row"><span>Lucro total no volume</span><span>{formatBRL(m.lucroTotalAntes)}</span></div>
          </div>
          <div className="compare-arrow" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M4 12H20M20 12L14 6M20 12L14 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <div className="compare-col after">
            <h3>Depois</h3>
            <div className="compare-row"><span>Custo efetivo</span><span>{formatBRL(m.novoCusto)}</span></div>
            <div className="compare-row"><span>Nova margem</span><span>{formatPct(m.novaMargem)}</span></div>
            <div className="compare-row"><span>Novo lucro por unidade</span><span>{formatBRL(m.novoLucroUnitario)}</span></div>
            <div className="compare-row"><span>Novo lucro total</span><span>{formatBRL(m.lucroTotalDepois)}</span></div>
          </div>
        </div>
      </section>

      <section className="panel">
        <h2>Resumo comercial</h2>
        <p className="summary-text">{summary}</p>
      </section>

      <footer className="page-footer">
        Gerado com o Letrum, <Link href="/" style={{ color: 'var(--blue)' }}>crie sua conta grátis</Link>.
      </footer>
    </div>
  );
}

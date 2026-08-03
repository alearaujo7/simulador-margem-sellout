'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';
import {
  computeMetrics, validate, formatBRL, formatPct, formatPPCard, numPT, buildSummary,
} from '../../lib/calc';

function IconEye() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M2 12C2 12 5.5 5.5 12 5.5C18.5 5.5 22 12 22 12C22 12 18.5 18.5 12 18.5C5.5 18.5 2 12 2 12Z" stroke="currentColor" strokeWidth="1.8" /><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" /></svg>;
}
function IconEdit() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M4 20L4.6 16.6L15.4 5.8C15.98 5.22 16.92 5.22 17.5 5.8L18.2 6.5C18.78 7.08 18.78 8.02 18.2 8.6L7.4 19.4L4 20Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>;
}
function IconCopy() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.8" /><path d="M5 15H4.5C3.67 15 3 14.33 3 13.5V4.5C3 3.67 3.67 3 4.5 3H13.5C14.33 3 15 3.67 15 4.5V5" stroke="currentColor" strokeWidth="1.8" /></svg>;
}
function IconTrash() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M4 7H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><path d="M9 7V4.5C9 3.67 9.67 3 10.5 3H13.5C14.33 3 15 3.67 15 4.5V7" stroke="currentColor" strokeWidth="1.8" /><path d="M6 7L7 20H17L18 7" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>;
}
function IconShare() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="18" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.8" /><circle cx="6" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.8" /><circle cx="18" cy="19" r="2.5" stroke="currentColor" strokeWidth="1.8" /><path d="M8.2 10.8L15.8 6.2M8.2 13.2L15.8 17.8" stroke="currentColor" strokeWidth="1.8" /></svg>;
}

function moneyDisplay(cents) {
  return (cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function parseDigits(value) {
  let d = value.replace(/\D/g, '');
  d = d.replace(/^0+(?=\d)/, '');
  if (d === '') d = '0';
  return parseInt(d, 10);
}
function friendlyError(error) {
  if (!error) return 'Não foi possível concluir a ação. Tente novamente.';
  if (error.hint) return error.hint;
  return error.message || 'Não foi possível concluir a ação. Tente novamente.';
}
function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

const emptyForm = { produto: 'Produto exemplo', custoCents: 1131, precoCents: 1890, selloutCents: 60, volume: 5000 };

export default function AppPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [plan, setPlan] = useState('free');
  const [history, setHistory] = useState([]);

  const [produto, setProduto] = useState(emptyForm.produto);
  const [custoCents, setCustoCents] = useState(emptyForm.custoCents);
  const [precoCents, setPrecoCents] = useState(emptyForm.precoCents);
  const [selloutCents, setSelloutCents] = useState(emptyForm.selloutCents);
  const [volume, setVolume] = useState(emptyForm.volume);

  const [editingId, setEditingId] = useState(null);
  const [saveMessage, setSaveMessage] = useState(null);
  const [toast, setToast] = useState(null);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [modalRecord, setModalRecord] = useState(null);

  const loadHistory = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from('simulations').select('*').order('created_at', { ascending: false });
    setHistory(data || []);
  }, []);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
      if (currentUser) {
        const { data: profile } = await supabase.from('profiles').select('plan').eq('id', currentUser.id).single();
        setPlan(profile?.plan || 'free');
      }
      await loadHistory();
      setLoading(false);
    })();
  }, [loadHistory]);

  const v = { produto, custo: custoCents / 100, preco: precoCents / 100, sellout: selloutCents / 100, volume };
  const m = computeMetrics(v);
  const alerts = validate(v);
  const hasBlockingError = alerts.some((a) => a.level === 'error');
  const summaryText = buildSummary(v, m);

  const scaleMax = Math.max(60, Math.ceil((Math.max(m.margemAtual, m.novaMargem, 0) + 10) / 10) * 10);
  const beforePct = Math.min(100, Math.max(0, m.margemAtual)) / scaleMax * 100;
  const afterPct = Math.min(100, Math.max(0, m.novaMargem)) / scaleMax * 100;

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  function resetForm() {
    setProduto('');
    setCustoCents(0);
    setPrecoCents(0);
    setSelloutCents(0);
    setVolume(0);
    setEditingId(null);
    setSaveMessage(null);
  }

  function loadIntoForm(record) {
    setEditingId(record.id);
    setProduto(record.produto);
    setCustoCents(Math.round(record.custo * 100));
    setPrecoCents(Math.round(record.preco * 100));
    setSelloutCents(Math.round(record.sellout * 100));
    setVolume(record.volume);
    setSaveMessage(null);
    document.getElementById('painel-simulacao')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function handleSave() {
    if (!produto.trim()) {
      setSaveMessage({ text: 'Informe o nome do produto antes de salvar.', ok: false });
      return;
    }
    if (hasBlockingError) {
      setSaveMessage({ text: 'Corrija os alertas acima antes de salvar.', ok: false });
      return;
    }
    const supabase = createClient();
    const payload = { produto: v.produto, custo: v.custo, preco: v.preco, sellout: v.sellout, volume: v.volume };

    if (editingId) {
      const { error } = await supabase.from('simulations').update(payload).eq('id', editingId);
      if (error) { setSaveMessage({ text: friendlyError(error), ok: false }); return; }
      setEditingId(null);
    } else {
      const { error } = await supabase.from('simulations').insert({ ...payload, user_id: user.id });
      if (error) { setSaveMessage({ text: friendlyError(error), ok: false }); return; }
    }
    setSaveMessage({ text: 'Simulação salva com sucesso.', ok: true });
    await loadHistory();
    setTimeout(() => setSaveMessage(null), 2500);
  }

  async function handleDuplicate(record) {
    const supabase = createClient();
    const { error } = await supabase.from('simulations').insert({
      user_id: user.id, produto: record.produto, custo: record.custo, preco: record.preco,
      sellout: record.sellout, volume: record.volume,
    });
    if (error) { setToast({ text: friendlyError(error), ok: false }); return; }
    await loadHistory();
  }

  async function handleDelete(record) {
    const ok = window.confirm(`Excluir a simulação "${record.produto}"? Essa ação não pode ser desfeita.`);
    if (!ok) return;
    const supabase = createClient();
    const { error } = await supabase.from('simulations').delete().eq('id', record.id);
    if (error) { setToast({ text: friendlyError(error), ok: false }); return; }
    await loadHistory();
  }

  async function handleToggleShare(record) {
    const supabase = createClient();
    if (record.is_shared) {
      const { error } = await supabase.from('simulations').update({ is_shared: false }).eq('id', record.id);
      if (error) { setToast({ text: friendlyError(error), ok: false }); return; }
      await loadHistory();
      return;
    }
    const { data, error } = await supabase
      .from('simulations').update({ is_shared: true }).eq('id', record.id).select().single();
    if (error) { setToast({ text: friendlyError(error), ok: false }); return; }
    await loadHistory();
    const link = `${window.location.origin}/s/${data.share_token}`;
    try {
      await navigator.clipboard.writeText(link);
      setToast({ text: 'Link copiado: ' + link, ok: true });
    } catch {
      setToast({ text: 'Link gerado: ' + link, ok: true });
    }
    setTimeout(() => setToast(null), 6000);
  }

  async function handleCopySummary() {
    try {
      await navigator.clipboard.writeText(summaryText);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    } catch {
      // navegador sem permissão de clipboard — ignora silenciosamente
    }
  }

  if (loading) {
    return <div className="page"><p style={{ color: 'var(--text-secondary)' }}>Carregando...</p></div>;
  }

  const qtd = history.length;
  let volumeTotal = 0, investimentoTotal = 0, ganhoTotal = 0;
  const rows = history.map((r) => {
    const rm = computeMetrics(r);
    volumeTotal += r.volume;
    investimentoTotal += rm.investimentoTotal;
    ganhoTotal += rm.ganhoAdicional;
    return { r, rm };
  });

  return (
    <div className="page">
      <header className="top-bar">
        <div className="top-bar-left">
          <div className="brand-mark">M+S</div>
          <div>
            <h1>Simulador de Margem e Sell-out</h1>
            <p className="tagline">{user?.email}</p>
          </div>
        </div>
        <div className="top-bar-actions">
          <span className={`plan-badge ${plan === 'pro' ? 'pro' : ''}`}>{plan === 'pro' ? 'Plano Pro' : 'Plano Grátis'}</span>
          <button type="button" className="btn btn-ghost" onClick={handleLogout}>Sair</button>
        </div>
      </header>

      {plan !== 'pro' && (
        <div className="upgrade-banner">
          <div>
            <strong>Plano Grátis:</strong>
            <p>até 5 simulações salvas e sem link de compartilhamento.</p>
          </div>
          <a className="btn btn-primary btn-small" href="mailto:contato@seudominio.com?subject=Upgrade%20para%20o%20plano%20Pro">
            Fazer upgrade
          </a>
        </div>
      )}

      {alerts.length > 0 && (
        <div className="alert-area">
          {alerts.map((a, i) => (
            <div key={i} className="alert alert--error">{a.msg}</div>
          ))}
        </div>
      )}

      {toast && <div className={`alert ${toast.ok ? 'alert--success' : 'alert--error'}`}>{toast.text}</div>}

      <div className="layout" id="painel-simulacao">
        <section className="panel">
          <h2>Condição comercial</h2>
          <p className="panel-hint">Preencha os campos abaixo. Os resultados atualizam automaticamente.</p>
          {editingId && <span className="edit-badge">Editando simulação salva</span>}

          <div className="field">
            <label htmlFor="produto">Nome do produto</label>
            <input id="produto" type="text" value={produto} onChange={(e) => setProduto(e.target.value)} placeholder="Ex.: Refrigerante 2L" />
          </div>

          <div className="field-grid">
            <div className="field">
              <label htmlFor="custo">Custo atual do cliente</label>
              <div className="money-input"><span className="prefix">R$</span>
                <input id="custo" type="text" inputMode="decimal" value={moneyDisplay(custoCents)} onChange={(e) => setCustoCents(parseDigits(e.target.value))} />
              </div>
            </div>
            <div className="field">
              <label htmlFor="preco">Preço de venda ao consumidor</label>
              <div className="money-input"><span className="prefix">R$</span>
                <input id="preco" type="text" inputMode="decimal" value={moneyDisplay(precoCents)} onChange={(e) => setPrecoCents(parseDigits(e.target.value))} />
              </div>
            </div>
            <div className="field">
              <label htmlFor="sellout">Sell-out por unidade</label>
              <div className="money-input"><span className="prefix">R$</span>
                <input id="sellout" type="text" inputMode="decimal" value={moneyDisplay(selloutCents)} onChange={(e) => setSelloutCents(parseDigits(e.target.value))} />
              </div>
            </div>
            <div className="field">
              <label htmlFor="volume">Volume estimado (unidades)</label>
              <input id="volume" className="volume-input" type="text" inputMode="numeric" value={volume.toLocaleString('pt-BR')} onChange={(e) => setVolume(parseDigits(e.target.value))} />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-primary" onClick={handleSave}>
              {editingId ? 'Atualizar simulação' : 'Salvar simulação'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={resetForm}>Limpar simulação</button>
            {editingId && <button type="button" className="btn btn-ghost" onClick={() => { setEditingId(null); setSaveMessage(null); }}>Cancelar edição</button>}
            {saveMessage && <span className={`save-message ${saveMessage.ok ? 'ok' : ''}`}>{saveMessage.text}</span>}
          </div>
        </section>

        <section className="panel gauge-panel">
          <h2>Termômetro de margem</h2>
          <p className="panel-hint">A barra verde mostra até onde a margem vai com o sell-out.</p>
          <div className="gauge">
            <div className="gauge-row">
              <span className="gauge-tag">Atual</span>
              <div className="gauge-track"><div className="gauge-fill gauge-fill--before" style={{ width: beforePct + '%' }} /></div>
              <span className="gauge-value">{formatPct(m.margemAtual)}</span>
            </div>
            <div className="gauge-row">
              <span className="gauge-tag">Novo</span>
              <div className="gauge-track">
                <div className={`gauge-fill gauge-fill--after ${m.aumentoMargemPP < 0 ? 'negative' : ''}`} style={{ width: afterPct + '%' }} />
                <div className="gauge-marker" style={{ left: beforePct + '%' }} />
              </div>
              <span className="gauge-value">{formatPct(m.novaMargem)}</span>
            </div>
            <div className={`gauge-delta ${m.aumentoMargemPP < 0 ? 'negative' : ''}`}>
              {formatPPCard(m.aumentoMargemPP)} de {m.aumentoMargemPP >= 0 ? 'melhoria' : 'queda'} na margem
            </div>
          </div>
        </section>
      </div>

      <section className="cards-section">
        <div className="cards-row">
          <div className="card" data-tone="blue"><div className="card-label">Margem atual</div><div className="card-value">{formatPct(m.margemAtual)}</div><div className="card-sub">antes do incentivo</div></div>
          <div className="card" data-tone="green"><div className="card-label">Nova margem</div><div className="card-value">{formatPct(m.novaMargem)}</div><div className="card-sub">depois do sell-out</div></div>
          <div className="card" data-tone={m.aumentoMargemPP < 0 ? 'red' : 'green'}><div className="card-label">Melhoria de margem</div><div className="card-value">{formatPPCard(m.aumentoMargemPP)}</div><div className="card-sub">pontos percentuais</div></div>
          <div className="card" data-tone="blue"><div className="card-label">Markup</div><div className="card-value">{formatPct(m.markup)}</div><div className="card-sub">sobre o custo atual</div></div>
        </div>
        <div className="cards-row">
          <div className="card" data-tone="blue"><div className="card-label">Lucro por unidade (atual)</div><div className="card-value">{formatBRL(m.lucroUnitario)}</div><div className="card-sub">preço − custo</div></div>
          <div className="card" data-tone="green"><div className="card-label">Novo lucro por unidade</div><div className="card-value">{formatBRL(m.novoLucroUnitario)}</div><div className="card-sub">com o sell-out</div></div>
          <div className="card" data-tone="amber"><div className="card-label">Investimento total em sell-out</div><div className="card-value">{formatBRL(m.investimentoTotal)}</div><div className="card-sub">custo da empresa no volume</div></div>
          <div className="card" data-tone="green"><div className="card-label">Ganho total do cliente</div><div className="card-value">{formatBRL(m.ganhoAdicional)}</div><div className="card-sub">no volume estimado</div></div>
        </div>
      </section>

      <section className="panel">
        <h2>Antes e depois do sell-out</h2>
        <div className="compare-grid">
          <div className="compare-col before">
            <h3>Antes</h3>
            <div className="compare-row"><span>Custo atual</span><span>{formatBRL(v.custo)}</span></div>
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
        <p className="panel-hint">Frase pronta para usar na negociação.</p>
        <p className="summary-text">{summaryText}</p>
        <div className="summary-actions">
          <button type="button" className="btn btn-primary" onClick={handleCopySummary}>Copiar resumo</button>
          <span className={`copy-feedback ${copyFeedback ? 'show' : ''}`}>Copiado!</span>
        </div>
      </section>

      <section className="panel">
        <h2>Histórico de simulações</h2>
        <div className="history-stats">
          <div className="stat"><div className="stat-label">Simulações salvas</div><div className="stat-value">{qtd.toLocaleString('pt-BR')}</div></div>
          <div className="stat"><div className="stat-label">Volume total simulado</div><div className="stat-value">{volumeTotal.toLocaleString('pt-BR')}</div></div>
          <div className="stat"><div className="stat-label">Investimento total</div><div className="stat-value">{formatBRL(investimentoTotal)}</div></div>
          <div className="stat"><div className="stat-label">Ganho total dos clientes</div><div className="stat-value">{formatBRL(ganhoTotal)}</div></div>
        </div>

        {qtd === 0 ? (
          <p className="empty-state">Nenhuma simulação salva ainda. Preencha o formulário acima e clique em &quot;Salvar simulação&quot;.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Produto</th><th>Custo</th><th>Preço</th><th>Margem atual</th><th>Sell-out</th>
                  <th>Nova margem</th><th>Volume</th><th>Investimento</th><th>Data</th><th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ r, rm }) => (
                  <tr key={r.id}>
                    <td className="cell-produto">{r.produto} {r.is_shared && <span className="share-pill">compartilhado</span>}</td>
                    <td>{formatBRL(r.custo)}</td>
                    <td>{formatBRL(r.preco)}</td>
                    <td>{formatPct(rm.margemAtual)}</td>
                    <td>{formatBRL(r.sellout)}</td>
                    <td>{formatPct(rm.novaMargem)}</td>
                    <td>{r.volume.toLocaleString('pt-BR')}</td>
                    <td>{formatBRL(rm.investimentoTotal)}</td>
                    <td>{formatDate(r.created_at)}</td>
                    <td>
                      <div className="row-actions">
                        <button type="button" className="icon-btn" title="Visualizar" onClick={() => setModalRecord({ r, rm })}><IconEye /></button>
                        <button type="button" className="icon-btn" title="Editar" onClick={() => loadIntoForm(r)}><IconEdit /></button>
                        <button type="button" className="icon-btn" title="Duplicar" onClick={() => handleDuplicate(r)}><IconCopy /></button>
                        <button type="button" className={`icon-btn ${r.is_shared ? 'active' : ''}`} title={r.is_shared ? 'Parar de compartilhar' : 'Compartilhar'} onClick={() => handleToggleShare(r)}><IconShare /></button>
                        <button type="button" className="icon-btn danger" title="Excluir" onClick={() => handleDelete(r)}><IconTrash /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <footer className="page-footer">Simulador de Margem e Sell-out — os dados ficam salvos na sua conta.</footer>

      {modalRecord && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(15,27,51,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 50 }} onClick={(e) => { if (e.target === e.currentTarget) setModalRecord(null); }}>
          <div className="modal-box" style={{ background: '#fff', borderRadius: 18, maxWidth: 520, width: '100%', maxHeight: '86vh', overflowY: 'auto', padding: 24, boxShadow: '0 24px 60px -12px rgba(15,27,51,0.35)' }}>
            <button type="button" onClick={() => setModalRecord(null)} aria-label="Fechar" style={{ float: 'right', background: 'none', border: 'none', fontSize: 20, color: 'var(--text-muted)' }}>&times;</button>
            <h3>{modalRecord.r.produto || 'Simulação'}</h3>
            <div className="compare-row"><span>Data</span><span>{formatDate(modalRecord.r.created_at)}</span></div>
            <div className="compare-row"><span>Custo atual</span><span>{formatBRL(modalRecord.r.custo)}</span></div>
            <div className="compare-row"><span>Preço de venda</span><span>{formatBRL(modalRecord.r.preco)}</span></div>
            <div className="compare-row"><span>Sell-out por unidade</span><span>{formatBRL(modalRecord.r.sellout)}</span></div>
            <div className="compare-row"><span>Volume</span><span>{modalRecord.r.volume.toLocaleString('pt-BR')}</span></div>
            <div className="compare-row"><span>Margem atual</span><span>{formatPct(modalRecord.rm.margemAtual)}</span></div>
            <div className="compare-row"><span>Nova margem</span><span>{formatPct(modalRecord.rm.novaMargem)}</span></div>
            <div className="compare-row"><span>Investimento total</span><span>{formatBRL(modalRecord.rm.investimentoTotal)}</span></div>
            <p className="summary-text" style={{ marginTop: 14 }}>{buildSummary(modalRecord.r, modalRecord.rm)}</p>
          </div>
        </div>
      )}
    </div>
  );
}

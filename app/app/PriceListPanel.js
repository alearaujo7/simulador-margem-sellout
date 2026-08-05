'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '../../lib/supabase/client';
import { formatBRL } from '../../lib/calc';

function IconPlus() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>;
}
function IconSearch() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="1.8" /><path d="M20 20L15.2 15.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>;
}
function IconTrashSmall() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M4 7H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><path d="M9 7V4.5C9 3.67 9.67 3 10.5 3H13.5C14.33 3 15 3.67 15 4.5V7" stroke="currentColor" strokeWidth="1.8" /><path d="M6 7L7 20H17L18 7" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>;
}

function normalizeHeader(h) {
  return String(h == null ? '' : h)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]/g, '');
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

export default function PriceListPanel({ onUseProduct }) {
  const [userId, setUserId] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(false);

  const [novoProduto, setNovoProduto] = useState('');
  const [novoCodigo, setNovoCodigo] = useState('');
  const [novoCustoCents, setNovoCustoCents] = useState(0);
  const [novoPrecoCents, setNovoPrecoCents] = useState(0);
  const [adding, setAdding] = useState(false);
  const [formMessage, setFormMessage] = useState(null);
  const produtoInputRef = useRef(null);

  async function loadItems(uid) {
    const supabase = createClient();
    const { data } = await supabase
      .from('price_items').select('*').eq('user_id', uid).order('produto', { ascending: true });
    setItems(data || []);
  }

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        await loadItems(user.id);
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAdd() {
    if (!novoProduto.trim()) {
      setFormMessage({ ok: false, text: 'Informe o nome do produto.' });
      return;
    }
    if (novoPrecoCents <= 0) {
      setFormMessage({ ok: false, text: 'Informe um preço válido.' });
      return;
    }
    setAdding(true);
    setFormMessage(null);
    const supabase = createClient();
    const { error } = await supabase.from('price_items').insert({
      user_id: userId,
      codigo: novoCodigo.trim() || null,
      produto: novoProduto.trim(),
      custo: novoCustoCents > 0 ? novoCustoCents / 100 : null,
      preco: novoPrecoCents / 100,
    });
    setAdding(false);
    if (error) {
      const msg = error.code === '23505'
        ? 'Esse código já está na sua lista. Use outro código ou deixe em branco.'
        : (error.message || 'Não foi possível adicionar o produto.');
      setFormMessage({ ok: false, text: msg });
      return;
    }
    setNovoProduto('');
    setNovoCodigo('');
    setNovoCustoCents(0);
    setNovoPrecoCents(0);
    setFormMessage({ ok: true, text: 'Produto adicionado.' });
    setTimeout(() => setFormMessage(null), 2000);
    await loadItems(userId);
    produtoInputRef.current?.focus();
  }

  async function handleDeleteItem(item) {
    const ok = window.confirm(`Remover "${item.produto}" da sua lista de preços?`);
    if (!ok) return;
    const supabase = createClient();
    await supabase.from('price_items').delete().eq('id', item.id);
    await loadItems(userId);
  }

  async function handleClearAll() {
    const ok = window.confirm('Apagar TODA a sua lista de preços? Essa ação não pode ser desfeita.');
    if (!ok) return;
    const supabase = createClient();
    await supabase.from('price_items').delete().eq('user_id', userId);
    await loadItems(userId);
  }

  const searchNorm = normalizeHeader(search);
  const filtered = search.trim() === '' ? [] : items.filter((it) => {
    return normalizeHeader(it.codigo || '').includes(searchNorm) || normalizeHeader(it.produto).includes(searchNorm);
  }).slice(0, 8);

  function handlePick(item) {
    onUseProduct(item);
    setSearch('');
  }

  if (loading) return null;

  return (
    <section className="panel">
      <h2>Minha lista de preços</h2>
      <p className="panel-hint">Adicione os produtos que você mais usa e busque pelo código ou nome pra preencher a simulação rapidinho.</p>

      <div className="field-grid" style={{ marginTop: 16 }}>
        <div className="field">
          <label htmlFor="novoProduto">Nome do produto</label>
          <input
            id="novoProduto" ref={produtoInputRef} type="text" value={novoProduto}
            onChange={(e) => setNovoProduto(e.target.value)} placeholder="Ex.: Sabonete Dove 90g"
          />
        </div>
        <div className="field">
          <label htmlFor="novoCodigo">Código ou EAN (opcional)</label>
          <input
            id="novoCodigo" type="text" value={novoCodigo}
            onChange={(e) => setNovoCodigo(e.target.value)} placeholder="Ex.: 7891000100103"
          />
        </div>
        <div className="field">
          <label htmlFor="novoCusto">Custo (opcional)</label>
          <div className="money-input"><span className="prefix">R$</span>
            <input id="novoCusto" type="text" inputMode="decimal" value={moneyDisplay(novoCustoCents)} onChange={(e) => setNovoCustoCents(parseDigits(e.target.value))} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="novoPreco">Preço</label>
          <div className="money-input"><span className="prefix">R$</span>
            <input id="novoPreco" type="text" inputMode="decimal" value={moneyDisplay(novoPrecoCents)} onChange={(e) => setNovoPrecoCents(parseDigits(e.target.value))} />
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-primary btn-small" onClick={handleAdd} disabled={adding}>
          <IconPlus />{adding ? 'Adicionando...' : 'Adicionar produto'}
        </button>
        {formMessage && <span className={`save-message ${formMessage.ok ? 'ok' : ''}`}>{formMessage.text}</span>}
      </div>

      {items.length === 0 ? (
        <p className="empty-state">Nenhum produto na sua lista ainda. Adicione o primeiro acima.</p>
      ) : (
        <>
          <div className="field" style={{ marginTop: 18 }}>
            <label htmlFor="buscaProduto">Buscar por código, EAN ou nome</label>
            <div className="money-input">
              <span className="prefix"><IconSearch /></span>
              <input
                id="buscaProduto" type="text" style={{ textAlign: 'left' }}
                placeholder="Ex.: 7891000100103 ou parte do nome"
                value={search} onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {search.trim() !== '' && (
            <div className="table-wrap" style={{ marginTop: 10 }}>
              {filtered.length === 0 ? (
                <p className="empty-state">Nenhum produto encontrado para &quot;{search}&quot;.</p>
              ) : (
                <table style={{ minWidth: 0 }}>
                  <tbody>
                    {filtered.map((it) => (
                      <tr key={it.id} style={{ cursor: 'pointer' }} onClick={() => handlePick(it)}>
                        <td className="cell-produto">{it.produto}</td>
                        <td>{it.codigo || '-'}</td>
                        <td>{formatBRL(it.preco)}</td>
                        <td style={{ textAlign: 'right' }}><button type="button" className="btn btn-primary btn-small" onClick={(e) => { e.stopPropagation(); handlePick(it); }}>Usar</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          <div className="form-actions" style={{ marginTop: 16 }}>
            <button type="button" className="btn btn-ghost btn-small" onClick={() => setExpanded((v) => !v)}>
              {expanded ? 'Ocultar lista completa' : `Ver lista completa (${items.length.toLocaleString('pt-BR')})`}
            </button>
            <button type="button" className="btn btn-ghost btn-small" onClick={handleClearAll}>Apagar toda a lista</button>
          </div>

          {expanded && (
            <div className="table-wrap" style={{ marginTop: 14 }}>
              <table>
                <thead>
                  <tr><th>Produto</th><th>Código</th><th>Custo</th><th>Preço</th><th>Ações</th></tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <tr key={it.id}>
                      <td className="cell-produto">{it.produto}</td>
                      <td>{it.codigo || '-'}</td>
                      <td>{it.custo !== null && it.custo !== undefined ? formatBRL(it.custo) : '-'}</td>
                      <td>{formatBRL(it.preco)}</td>
                      <td>
                        <div className="row-actions">
                          <button type="button" className="btn btn-ghost btn-small" onClick={() => handlePick(it)}>Usar</button>
                          <button type="button" className="icon-btn danger" title="Remover" onClick={() => handleDeleteItem(it)}><IconTrashSmall /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  );
}

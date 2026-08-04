'use client';

import { useEffect, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { createClient } from '../../lib/supabase/client';
import { formatBRL } from '../../lib/calc';

function IconUpload() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 16V4M12 4L7 9M12 4L17 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><path d="M4 16V18.5C4 19.88 5.12 21 6.5 21H17.5C18.88 21 20 19.88 20 18.5V16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>;
}
function IconSearch() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="1.8" /><path d="M20 20L15.2 15.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>;
}
function IconTrashSmall() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M4 7H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><path d="M9 7V4.5C9 3.67 9.67 3 10.5 3H13.5C14.33 3 15 3.67 15 4.5V7" stroke="currentColor" strokeWidth="1.8" /><path d="M6 7L7 20H17L18 7" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>;
}

function normalizeHeader(h) {
  return String(h || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove acentos
    .toLowerCase().replace(/[^a-z0-9]/g, '');
}

const CODIGO_ALIASES = ['codigo', 'cod', 'ean', 'sku', 'codbarras', 'codigobarras'];
const PRODUTO_ALIASES = ['produto', 'descricao', 'nome', 'item', 'mercadoria'];
const PRECO_ALIASES = ['preco', 'precovenda', 'venda', 'precodevenda', 'pvenda'];
const CUSTO_ALIASES = ['custo', 'custoatual', 'custounitario', 'precocusto'];

function parseNumber(val) {
  if (typeof val === 'number') return val;
  if (!val) return null;
  const s = String(val).trim().replace(/[R$\s]/g, '');
  if (s === '') return null;
  // aceita tanto "1.234,56" quanto "1234.56"
  const normalized = s.includes(',') ? s.replace(/\./g, '').replace(',', '.') : s;
  const n = parseFloat(normalized);
  return isNaN(n) ? null : n;
}

function parseWorkbookRows(workbook) {
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  if (json.length === 0) return { rows: [], skipped: 0 };

  const sampleKeys = Object.keys(json[0]);
  const keyMap = {};
  sampleKeys.forEach((key) => {
    const norm = normalizeHeader(key);
    if (!keyMap.codigo && CODIGO_ALIASES.includes(norm)) keyMap.codigo = key;
    if (!keyMap.produto && PRODUTO_ALIASES.includes(norm)) keyMap.produto = key;
    if (!keyMap.preco && PRECO_ALIASES.includes(norm)) keyMap.preco = key;
    if (!keyMap.custo && CUSTO_ALIASES.includes(norm)) keyMap.custo = key;
  });

  const rows = [];
  let skipped = 0;
  json.forEach((row) => {
    const codigo = keyMap.codigo ? String(row[keyMap.codigo]).trim() : '';
    const produto = keyMap.produto ? String(row[keyMap.produto]).trim() : '';
    const preco = keyMap.preco ? parseNumber(row[keyMap.preco]) : null;
    const custo = keyMap.custo ? parseNumber(row[keyMap.custo]) : null;
    if (!codigo || !produto || preco === null) {
      skipped += 1;
      return;
    }
    rows.push({ codigo, produto, preco, custo });
  });
  return { rows, skipped, keyMap };
}

export default function PriceListPanel({ onUseProduct }) {
  const [userId, setUserId] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState(null);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(false);
  const fileInputRef = useRef(null);

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

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    setUploading(true);
    setUploadMessage(null);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const { rows, skipped } = parseWorkbookRows(workbook);

      if (rows.length === 0) {
        setUploadMessage({ ok: false, text: 'Não encontrei colunas de código, produto e preço nesse arquivo. Confira os títulos das colunas.' });
        setUploading(false);
        return;
      }

      const payload = rows.map((r) => ({ ...r, user_id: userId }));
      const supabase = createClient();
      // envia em lotes de 500 para evitar payloads gigantes
      for (let i = 0; i < payload.length; i += 500) {
        const batch = payload.slice(i, i + 500);
        const { error } = await supabase.from('price_items').upsert(batch, { onConflict: 'user_id,codigo' });
        if (error) throw error;
      }

      await loadItems(userId);
      setUploadMessage({
        ok: true,
        text: `${rows.length.toLocaleString('pt-BR')} produtos importados.${skipped > 0 ? ` ${skipped} linha(s) ignorada(s) por falta de código, produto ou preço.` : ''}`,
      });
    } catch (err) {
      setUploadMessage({ ok: false, text: err.message || 'Não foi possível importar o arquivo.' });
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
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
    return normalizeHeader(it.codigo).includes(searchNorm) || normalizeHeader(it.produto).includes(searchNorm);
  }).slice(0, 8);

  function handlePick(item) {
    onUseProduct(item);
    setSearch('');
  }

  if (loading) return null;

  return (
    <section className="panel">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h2>Minha lista de preços</h2>
          <p className="panel-hint">Importe sua planilha e busque um produto pelo código ou EAN para preencher a simulação.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="btn btn-ghost btn-small" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            <IconUpload />{uploading ? 'Importando...' : 'Importar Excel'}
          </button>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} className="hidden" />
        </div>
      </div>

      {uploadMessage && (
        <div className={`alert ${uploadMessage.ok ? 'alert--success' : 'alert--error'}`} style={{ marginTop: 14 }}>
          {uploadMessage.text}
        </div>
      )}

      {items.length === 0 ? (
        <p className="empty-state">Nenhuma lista importada ainda. Sua planilha deve ter colunas de código (ou EAN), produto e preço, e opcionalmente custo.</p>
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
                        <td>{it.codigo}</td>
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
                      <td>{it.codigo}</td>
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

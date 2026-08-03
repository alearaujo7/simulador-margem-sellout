// Lógica de cálculo do Simulador de Margem e Sell-out.
// Mesmas fórmulas validadas na versão anterior (arquivo único).

export function computeMetrics({ custo, preco, sellout, volume }) {
  const lucroUnitario = preco - custo;
  const margemAtual = preco > 0 ? ((preco - custo) / preco) * 100 : 0;
  const markup = custo > 0 ? (preco / custo - 1) * 100 : 0;
  const novoCusto = custo - sellout;
  const novaMargem = preco > 0 ? ((preco - novoCusto) / preco) * 100 : 0;
  const aumentoMargemPP = novaMargem - margemAtual;
  const investimentoTotal = sellout * volume;
  const novoLucroUnitario = preco - novoCusto;
  const lucroTotalAntes = lucroUnitario * volume;
  const lucroTotalDepois = novoLucroUnitario * volume;
  const ganhoAdicional = lucroTotalDepois - lucroTotalAntes;

  return {
    lucroUnitario,
    margemAtual,
    markup,
    novoCusto,
    novaMargem,
    aumentoMargemPP,
    investimentoTotal,
    novoLucroUnitario,
    lucroTotalAntes,
    lucroTotalDepois,
    ganhoAdicional,
  };
}

export function validate({ custo, preco, sellout, volume }) {
  const alerts = [];
  if (preco <= 0) {
    alerts.push({ level: 'error', msg: 'Informe um preço de venda válido para calcular a margem.' });
  }
  if (preco > 0 && custo > preco) {
    alerts.push({ level: 'error', msg: 'O cliente está operando com margem negativa nesta condição.' });
  }
  if (custo > 0 && sellout > custo) {
    alerts.push({ level: 'error', msg: 'O sell-out não pode ser maior que o custo atual do produto.' });
  }
  if (volume < 0) {
    alerts.push({ level: 'error', msg: 'O volume não pode ser negativo.' });
  }
  return alerts;
}

export function numPT(n) {
  const v = isFinite(n) ? n : 0;
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatBRL(n) {
  const v = isFinite(n) ? n : 0;
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatPct(n) {
  return numPT(n) + '%';
}

export function formatPPCard(n) {
  const v = isFinite(n) ? n : 0;
  return (v >= 0 ? '+' : '') + numPT(v) + ' p.p.';
}

export function buildSummary(v, m) {
  return (
    'Com um sell-out de ' + formatBRL(v.sellout) + ' por unidade, o custo efetivo do cliente passa de ' +
    formatBRL(v.custo) + ' para ' + formatBRL(m.novoCusto) + '. A margem aumenta de ' + formatPct(m.margemAtual) +
    ' para ' + formatPct(m.novaMargem) + ', representando um ganho de ' + numPT(Math.abs(m.aumentoMargemPP)) +
    ' pontos percentuais. Em um volume de ' + v.volume.toLocaleString('pt-BR') + ' unidades, o investimento total será de ' +
    formatBRL(m.investimentoTotal) + '.'
  );
}

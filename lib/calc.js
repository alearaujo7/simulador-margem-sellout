// Lógica de calculo do Letrum (simulador de margem e sell-out).
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

// A partir de quantos pontos percentuais de melhoria de margem o alerta
// de verba aparece. É só um ponto de partida, ajustável a qualquer momento.
const LIMITE_MELHORIA_MARGEM_PP = 10;

export function validate(v) {
  const { custo, preco, sellout, volume } = v;
  const alerts = [];
  if (preco <= 0) {
    alerts.push({ level: 'error', msg: 'Informe um preço de venda válido para calcular a margem.' });
  }
  if (custo > 0 && sellout > custo) {
    alerts.push({ level: 'error', msg: 'O sell-out não pode ser maior que o custo atual do produto.' });
  }
  if (volume < 0) {
    alerts.push({ level: 'error', msg: 'O volume não pode ser negativo.' });
  }

  if (preco > 0) {
    const m = computeMetrics(v);

    if (custo > preco) {
      if (m.novaMargem < 0) {
        // mesmo com o sell-out o cliente continua no vermelho: aí sim é um problema real
        alerts.push({ level: 'error', msg: 'Mesmo com esse sell-out, o cliente continua com margem negativa nesta condição.' });
      } else {
        // margem negativa só ANTES do sell-out não impede salvar, é justamente o que o sell-out resolve
        alerts.push({
          level: 'warning',
          msg: `Sem o sell-out o cliente estaria com margem negativa, mas o incentivo já resolve isso: a nova margem fica em ${formatPct(m.novaMargem)}.`,
        });
      }
    }

    if (m.aumentoMargemPP > LIMITE_MELHORIA_MARGEM_PP) {
      alerts.push({
        level: 'warning',
        msg: `Atenção: essa condição dá ${numPT(m.aumentoMargemPP)} pontos percentuais de margem pro cliente. Fique de olho, quanto maior esse número, mais verba de sell-out sai do seu bolso.`,
      });
    }
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
  if (v.sellout <= 0) {
    return (
      'Sem sell-out, essa condição dá ao cliente uma margem de ' + formatPct(m.margemAtual) +
      ' e um lucro de ' + formatBRL(m.lucroUnitario) + ' por unidade. Em um volume de ' +
      v.volume.toLocaleString('pt-BR') + ' unidades, o lucro total seria de ' + formatBRL(m.lucroTotalAntes) +
      '. Adicione um valor de sell-out para negociar uma margem melhor.'
    );
  }
  return (
    'Com um sell-out de ' + formatBRL(v.sellout) + ' por unidade, o custo efetivo do cliente passa de ' +
    formatBRL(v.custo) + ' para ' + formatBRL(m.novoCusto) + '. A margem aumenta de ' + formatPct(m.margemAtual) +
    ' para ' + formatPct(m.novaMargem) + ', representando um ganho de ' + numPT(Math.abs(m.aumentoMargemPP)) +
    ' pontos percentuais. Em um volume de ' + v.volume.toLocaleString('pt-BR') + ' unidades, o investimento total será de ' +
    formatBRL(m.investimentoTotal) + '.'
  );
}

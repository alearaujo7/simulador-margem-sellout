import Link from 'next/link';

function IconBolt() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M13 2L4 14H11L10 22L20 9H13L13 2Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}
function IconChart() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M4 20V10M12 20V4M20 20V14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function IconLink() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M9 15L15 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M10 7L11.5 5.5C13 4 15.5 4 17 5.5C18.5 7 18.5 9.5 17 11L15.5 12.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M14 17L12.5 18.5C11 20 8.5 20 7 18.5C5.5 17 5.5 14.5 7 13L8.5 11.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export default function LandingPage() {
  return (
    <>
      <nav className="nav">
        <div className="top-bar-left" style={{ color: 'var(--blue-deep)' }}>
          <div className="brand-mark" style={{ background: 'var(--blue-soft)', color: 'var(--blue)', border: 'none' }}>M+S</div>
          <strong style={{ fontFamily: 'var(--font-display)' }}>Simulador de Margem e Sell-out</strong>
        </div>
        <div className="nav-links">
          <Link href="/entrar" className="btn btn-ghost">Entrar</Link>
          <Link href="/cadastro" className="btn btn-primary">Criar conta grátis</Link>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-inner">
          <h1>Veja quanto sua condição comercial melhora a margem do cliente — antes de fechar a negociação.</h1>
          <p className="lead">
            Ferramenta feita para vendedores, indústrias e distribuidores. Preencha custo, preço e sell-out
            e receba na hora a nova margem, o investimento total e um argumento comercial pronto pra usar.
          </p>
          <div className="hero-ctas">
            <Link href="/cadastro" className="btn btn-lg btn-white">Criar conta grátis</Link>
            <Link href="/entrar" className="btn btn-lg btn-outline-white">Já tenho conta</Link>
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Tudo que você precisa numa negociação</h2>
        <p className="section-lead">Sem planilha, sem calculadora improvisada. Um resultado claro, em segundos.</p>

        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-icon"><IconBolt /></div>
            <h3>Cálculo em tempo real</h3>
            <p>Margem, markup, lucro por unidade e investimento total atualizam a cada tecla — sem recarregar nada.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon"><IconChart /></div>
            <h3>Antes e depois visual</h3>
            <p>Um termômetro de margem mostra de forma clara o quanto o sell-out melhora a condição do cliente.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon"><IconLink /></div>
            <h3>Link de compartilhamento</h3>
            <p>Gere um link só-leitura da simulação para mandar pro cliente ou pro seu time — sem precisar de login.</p>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <h2 className="section-title">Planos simples</h2>
        <p className="section-lead">Comece de graça. Faça upgrade quando precisar de mais.</p>

        <div className="pricing-grid">
          <div className="price-card">
            <div className="plan-name">Grátis</div>
            <div className="price">R$ 0</div>
            <ul>
              <li>Simulações ilimitadas na tela</li>
              <li>Até 5 simulações salvas no histórico</li>
              <li>Resumo comercial com um clique</li>
            </ul>
          </div>
          <div className="price-card featured">
            <div className="plan-name">Pro</div>
            <div className="price">Sob consulta</div>
            <ul>
              <li>Histórico ilimitado de simulações</li>
              <li>Link de compartilhamento para clientes e time</li>
              <li>Suporte prioritário</li>
            </ul>
          </div>
        </div>
      </section>

      <footer className="footer">Simulador de Margem e Sell-out — feito para negociações comerciais.</footer>
    </>
  );
}

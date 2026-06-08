const fs = require("fs");
const path = require("path");

const DIR_SAIDA = path.join(__dirname, "dados-agente", "saida");

/**
 * Encontra automaticamente o JSON mais recente gerado pela V3/V4/V5.
 */
function encontrarJsonMaisRecente() {
  const arquivos = fs
    .readdirSync(DIR_SAIDA)
    .filter((arquivo) => arquivo.startsWith("resultado-v3-v4-v5"))
    .filter((arquivo) => arquivo.endsWith(".json"))
    .map((arquivo) => ({
      arquivo,
      caminho: path.join(DIR_SAIDA, arquivo),
      criadoEm: fs.statSync(path.join(DIR_SAIDA, arquivo)).mtimeMs,
    }))
    .sort((a, b) => b.criadoEm - a.criadoEm);

  if (arquivos.length === 0) {
    throw new Error("Nenhum resultado-v3-v4-v5 encontrado em dados-agente/saida.");
  }

  return arquivos[0];
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function classeProbabilidade(probabilidade) {
  if (probabilidade === "Alta") return "alta";
  if (probabilidade === "Média" || probabilidade === "Media") return "media";
  return "baixa";
}

function gerarCard(produto) {
  const classe = classeProbabilidade(produto.probabilidade_venda);

  const diferencaPreco = Number(produto.preco_sugerido) - Number(produto.preco_atual);

  let decisaoPreco = "Manter preço";
  if (diferencaPreco < 0) decisaoPreco = "Baixar preço";
  if (diferencaPreco > 0) decisaoPreco = "Aumentar preço";

  return `
    <article class="card ${classe}">
      <div class="card-header">
        <div>
          <h2>${produto.produto}</h2>
          <p class="comodo">${produto.comodo} · ${produto.status}</p>
        </div>
        <div class="score">
          <span>${produto.score_venda}</span>
          <small>score</small>
        </div>
      </div>

      <div class="badges">
        <span class="badge ${classe}">${produto.probabilidade_venda}</span>
        <span class="badge">${produto.tendencia}</span>
        <span class="badge">${decisaoPreco}</span>
      </div>

      <div class="grid">
        <div>
          <small>Preço atual</small>
          <strong>${formatarMoeda(produto.preco_atual)}</strong>
        </div>
        <div>
          <small>Preço sugerido</small>
          <strong>${formatarMoeda(produto.preco_sugerido)}</strong>
        </div>
        <div>
          <small>Cliques anteriores</small>
          <strong>${produto.cliques_anterior}</strong>
        </div>
        <div>
          <small>Cliques atuais</small>
          <strong>${produto.cliques_atual}</strong>
        </div>
      </div>

      <div class="acao">
        <small>Ação recomendada</small>
        <p>${produto.acao_recomendada}</p>
      </div>

      <div class="motivo">
        <small>Motivo</small>
        <p>${produto.motivo}</p>
      </div>
    </article>
  `;
}

function gerarHtml(produtos, arquivoOrigem) {
  const cards = produtos.map(gerarCard).join("\n");

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Dashboard Agente de IA - Desapego</title>

  <style>
    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      font-family: Arial, Helvetica, sans-serif;
      background: #f3f4f6;
      color: #111827;
    }

    header {
      background: #111827;
      color: white;
      padding: 28px 24px;
    }

    header h1 {
      margin: 0 0 8px 0;
      font-size: 28px;
    }

    header p {
      margin: 0;
      color: #d1d5db;
      font-size: 14px;
    }

    main {
      padding: 24px;
      max-width: 1300px;
      margin: 0 auto;
    }

    .resumo {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .resumo-card {
      background: white;
      padding: 18px;
      border-radius: 14px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }

    .resumo-card small {
      color: #6b7280;
    }

    .resumo-card strong {
      display: block;
      font-size: 26px;
      margin-top: 6px;
    }

    .cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
      gap: 18px;
    }

    .card {
      background: white;
      border-radius: 16px;
      padding: 18px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.08);
      border-top: 6px solid #9ca3af;
    }

    .card.alta {
      border-top-color: #16a34a;
    }

    .card.media {
      border-top-color: #f59e0b;
    }

    .card.baixa {
      border-top-color: #dc2626;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: flex-start;
    }

    h2 {
      margin: 0;
      font-size: 20px;
    }

    .comodo {
      margin: 6px 0 0 0;
      color: #6b7280;
      font-size: 14px;
    }

    .score {
      min-width: 70px;
      text-align: center;
      background: #f9fafb;
      border-radius: 12px;
      padding: 10px;
    }

    .score span {
      display: block;
      font-size: 26px;
      font-weight: bold;
    }

    .score small,
    .grid small,
    .acao small,
    .motivo small {
      color: #6b7280;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .badges {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin: 16px 0;
    }

    .badge {
      background: #e5e7eb;
      padding: 6px 10px;
      border-radius: 999px;
      font-size: 13px;
      font-weight: bold;
    }

    .badge.alta {
      background: #dcfce7;
      color: #166534;
    }

    .badge.media {
      background: #fef3c7;
      color: #92400e;
    }

    .badge.baixa {
      background: #fee2e2;
      color: #991b1b;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin: 16px 0;
    }

    .grid div {
      background: #f9fafb;
      padding: 12px;
      border-radius: 10px;
    }

    .grid strong {
      display: block;
      margin-top: 4px;
      font-size: 18px;
    }

    .acao,
    .motivo {
      margin-top: 14px;
      background: #f9fafb;
      padding: 12px;
      border-radius: 10px;
    }

    .acao p,
    .motivo p {
      margin: 6px 0 0 0;
      line-height: 1.4;
    }

    footer {
      text-align: center;
      color: #6b7280;
      padding: 24px;
      font-size: 13px;
    }
  </style>
</head>

<body>
  <header>
    <h1>Dashboard do Agente de IA</h1>
    <p>Analise V3, V4 e V5 baseada no arquivo: ${arquivoOrigem}</p>
  </header>

  <main>
    <section class="resumo">
      <div class="resumo-card">
        <small>Produtos analisados</small>
        <strong>${produtos.length}</strong>
      </div>
      <div class="resumo-card">
        <small>Alta probabilidade</small>
        <strong>${produtos.filter((p) => p.probabilidade_venda === "Alta").length}</strong>
      </div>
      <div class="resumo-card">
        <small>Produtos crescendo</small>
        <strong>${produtos.filter((p) => p.tendencia === "Crescendo" || p.tendencia === "Crescendo forte").length}</strong>
      </div>
      <div class="resumo-card">
        <small>Maior score</small>
        <strong>${Math.max(...produtos.map((p) => p.score_venda))}</strong>
      </div>
    </section>

    <section class="cards">
      ${cards}
    </section>
  </main>

  <footer>
    Gerado automaticamente pelo Agente de IA - Anuncios de Eletrodomesticos
  </footer>
</body>
</html>
  `;
}

function executar() {
  const resultado = encontrarJsonMaisRecente();
  const produtos = JSON.parse(fs.readFileSync(resultado.caminho, "utf8"));

  const html = gerarHtml(produtos, resultado.arquivo);

  const caminhoDashboard = path.join(DIR_SAIDA, "dashboard-agente.html");

  fs.writeFileSync(caminhoDashboard, html, "utf8");

  console.log("Dashboard gerado com sucesso:");
  console.log("dados-agente/saida/dashboard-agente.html");
}

executar();
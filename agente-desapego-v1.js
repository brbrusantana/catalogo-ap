/**
 * Bruno - 04/06/2026 - Agente Analista do Desapego V1
 *
 * Linguagem: JavaScript
 * Ambiente de execução: Node.js
 *
 * Objetivo:
 * Ler os produtos cadastrados no app.ts do Angular,
 * considerar somente os produtos com status "Disponível",
 * cruzar esses produtos com os CSVs exportados do Google Analytics,
 * calcular um score de interesse
 * e gerar um relatório automático com recomendações.
 */

const fs = require("fs");

/**
 * fs é um módulo nativo do Node.js.
 * Ele serve para ler e escrever arquivos no computador.
 */

const appTs = fs.readFileSync("src/app/app.ts", "utf8");

/**
 * Aqui estamos lendo o arquivo app.ts inteiro como texto.
 * O app.ts é onde estão cadastrados os produtos do catálogo.
 */

/**
 * Esta função normaliza textos para facilitar comparação.
 * Exemplo:
 * "Cômoda 2,07m" vira "comoda207m".
 *
 * Isso evita erro quando o GA4 e o app.ts têm acentos,
 * espaços ou símbolos diferentes.
 */
function normalizar(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Esta função extrai os produtos diretamente do app.ts.
 *
 * Ela procura blocos parecidos com:
 * {
 *   id: 1,
 *   nome: 'Cama box casal',
 *   status: 'Disponível',
 *   valorVenda: 'R$ 699,99',
 *   linkMercadoLivre: '...'
 * }
 */
function lerProdutosDoAppTs() {
  const blocos = appTs.match(/\{\s*id:\s*\d+[\s\S]*?\n\s*\}/g) || [];

  return blocos.map((bloco) => {
    /**
     * Função auxiliar para pegar campos de texto.
     * Exemplo:
     * pegar("nome") retorna o valor do campo nome.
     */
    const pegar = (campo) => {
      const regex = new RegExp(`${campo}:\\s*'([^']*)'`);
      const match = bloco.match(regex);
      return match ? match[1] : "";
    };

    const idMatch = bloco.match(/id:\s*(\d+)/);

    return {
      id: idMatch ? Number(idMatch[1]) : null,
      nome: pegar("nome"),
      status: pegar("status"),
      valorOriginal: pegar("valorOriginal"),
      valorVenda: pegar("valorVenda"),

      /**
       * Bruno - 04/06/2026 - melhoria Mercado Livre
       * Agora o agente também verifica se o produto tem link do Mercado Livre.
       * Isso evita recomendar "melhorar chamada para ML"
       * em produtos que nem têm link cadastrado.
       */
      linkMercadoLivre: pegar("linkMercadoLivre"),
      temMercadoLivre: Boolean(pegar("linkMercadoLivre")),
    };
  });
}

/**
 * Esta função lê um CSV exportado do Google Analytics.
 *
 * Esperamos um arquivo com estrutura parecida:
 * Produto nome,Contagem de eventos
 * Geladeira Electrolux inox,30
 * Smart TV LG,15
 *
 * A função devolve um mapa:
 * {
 *   "geladeiraelectroluxinox": 30,
 *   "smarttvlg": 15
 * }
 */
function lerCsvGA(caminho) {
  if (!fs.existsSync(caminho)) {
    console.log(`Arquivo não encontrado: ${caminho}`);
    return {};
  }

  const linhas = fs
    .readFileSync(caminho, "utf8")
    .split(/\r?\n/)
    .filter((linha) => linha && !linha.startsWith("#"));

  /**
   * Remove o cabeçalho do CSV.
   */
  linhas.shift();

  const mapa = {};

  for (const linha of linhas) {
    if (!linha || linha.startsWith(",")) continue;

    /**
     * Procuramos a última vírgula da linha.
     * A parte antes dela é o nome do produto.
     * A parte depois dela é a quantidade de cliques.
     */
    const ultimaVirgula = linha.lastIndexOf(",");
    if (ultimaVirgula === -1) continue;

    const nome = linha.slice(0, ultimaVirgula).replace(/"/g, "").trim();

    const valor = Number(
      linha
        .slice(ultimaVirgula + 1)
        .replace(/"/g, "")
        .replace(/\D/g, "")
    );

    if (nome && !Number.isNaN(valor)) {
      mapa[normalizar(nome)] = valor;
    }
  }

  return mapa;
}

/**
 * Aqui carregamos os produtos do app.ts.
 */
const produtos = lerProdutosDoAppTs();

/**
 * Aqui carregamos os dados exportados do Google Analytics.
 *
 * Os arquivos devem estar nesta pasta:
 * dados-agente
 *
 * Com estes nomes:
 * detalhes.csv
 * mercado-livre.csv
 */
const detalhes = lerCsvGA("dados-agente/detalhes.csv");
const mercadoLivre = lerCsvGA("dados-agente/mercado-livre.csv");

/**
 * Regra principal:
 * o agente só analisa produtos disponíveis.
 *
 * Vendidos, reservados e indisponíveis ficam fora das recomendações.
 */
const disponiveis = produtos.filter((produto) => produto.status === "Disponível");

/**
 * Aqui começa a análise de cada produto disponível.
 */
const analise = disponiveis.map((produto) => {
  const chave = normalizar(produto.nome);

  const cliquesDetalhes = detalhes[chave] || 0;
  const cliquesML = mercadoLivre[chave] || 0;

  /**
   * Score do Agente V1:
   *
   * Clique em detalhes vale 1 ponto.
   * Clique no Mercado Livre vale 2 pontos.
   *
   * Motivo:
   * Quem clica no ML demonstra uma intenção mais forte,
   * porque está indo para uma página de compra/anúncio.
   */
  const score = cliquesDetalhes + cliquesML * 2;

  let classificacao = "";
  let recomendacao = "";

  /**
   * Classificação inicial por score.
   */
  if (score >= 25) {
    classificacao = "Quente";
    recomendacao = "Manter preço e priorizar atendimento.";
  } else if (score >= 10) {
    classificacao = "Morno";
    recomendacao = "Observar por mais alguns dias antes de reduzir.";
  } else {
    classificacao = "Frio";
    recomendacao = "Considerar nova divulgação antes de novo desconto.";
  }

  /**
   * Bruno - 04/06/2026 - melhoria Mercado Livre
   *
   * Regra correta:
   * Só analisamos baixa ida ao Mercado Livre
   * quando o produto realmente tem link do Mercado Livre.
   */
  if (produto.temMercadoLivre && cliquesDetalhes >= 15 && cliquesML <= 1) {
    recomendacao =
      "Há interesse nos detalhes, mas pouca ida ao Mercado Livre. Melhorar chamada para o anúncio ou revisar o link.";
  }

  /**
   * Se o produto NÃO tem Mercado Livre, mas tem muitos cliques em detalhes,
   * a recomendação deve ser contato direto, e não Mercado Livre.
   */
  if (!produto.temMercadoLivre && cliquesDetalhes >= 15) {
    recomendacao =
      "Há alto interesse nos detalhes. Como não há link Mercado Livre, facilitar contato direto e reforçar divulgação no privado.";
  }

  return {
    produto: produto.nome,
    status: produto.status,
    valorAtual: produto.valorVenda,
    temMercadoLivre: produto.temMercadoLivre ? "Sim" : "Não",
    cliquesDetalhes,
    cliquesML,
    score,
    classificacao,
    recomendacao,
  };
});

/**
 * Ordena os produtos do mais quente para o mais frio.
 */
analise.sort((a, b) => b.score - a.score);

/**
 * Gera um CSV com o resultado.
 * Esse arquivo pode ser aberto no Excel.
 */
const csv = [
  "Produto,Status,Valor Atual,Tem Mercado Livre,Cliques Detalhes,Cliques Mercado Livre,Score,Classificação,Recomendação",
  ...analise.map((r) =>
    [
      r.produto,
      r.status,
      r.valorAtual,
      r.temMercadoLivre,
      r.cliquesDetalhes,
      r.cliquesML,
      r.score,
      r.classificacao,
      r.recomendacao,
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",")
  ),
].join("\n");

fs.writeFileSync("relatorio-agente-desapego-v1.csv", csv, "utf8");

/**
 * Gera também um relatório em texto simples,
 * mais fácil de ler rapidamente.
 */
const texto = analise
  .map(
    (r, i) =>
      `${i + 1}. ${r.produto}
Status: ${r.status}
Valor atual: ${r.valorAtual}
Tem Mercado Livre: ${r.temMercadoLivre}
Cliques Detalhes: ${r.cliquesDetalhes}
Cliques Mercado Livre: ${r.cliquesML}
Score: ${r.score}
Classificação: ${r.classificacao}
Recomendação: ${r.recomendacao}
`
  )
  .join("\n");

fs.writeFileSync("relatorio-agente-desapego-v1.txt", texto, "utf8");

/**
 * Mensagem final no terminal.
 */
console.log("Agente Analista do Desapego V1 executado com sucesso.");
console.log("Produtos analisados:", analise.length);
console.log("Arquivos gerados:");
console.log("- relatorio-agente-desapego-v1.csv");
console.log("- relatorio-agente-desapego-v1.txt");
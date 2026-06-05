/**
 * Bruno - 04/06/2026 - Agente Analista do Desapego V2
 *
 * Linguagem: JavaScript
 * Ambiente: Node.js
 *
 * Objetivo:
 * 1. Ler produtos do app.ts do Angular.
 * 2. Considerar somente produtos com status "Disponível".
 * 3. Ler os CSVs exportados do Google Analytics.
 * 4. Calcular dados básicos de interesse.
 * 5. Salvar um histórico diário em JSON.
 * 6. Enviar o contexto para a OpenAI.
 * 7. Gerar relatório executivo automático.
 */

require("dotenv").config();

const fs = require("fs");
const path = require("path");
const OpenAI = require("openai");

/**
 * Cliente OpenAI.
 * A chave vem do arquivo .env:
 * OPENAI_API_KEY=sua_chave
 */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Modelo usado.
 * Se quiser trocar depois, basta criar no .env:
 * OPENAI_MODEL=gpt-5.5
 */
const MODELO_OPENAI = process.env.OPENAI_MODEL || "gpt-5.5";

/**
 * Caminhos principais do agente.
 */
const CAMINHO_APP_TS = "src/app/app.ts";

const PASTA_DADOS = "dados-agente";
const PASTA_ENTRADA = path.join(PASTA_DADOS, "entrada");
const PASTA_HISTORICO = path.join(PASTA_DADOS, "historico");
const PASTA_RELATORIOS = path.join(PASTA_DADOS, "relatorios");

const ARQUIVO_DETALHES = path.join(PASTA_ENTRADA, "detalhes.csv");
const ARQUIVO_MERCADO_LIVRE = path.join(PASTA_ENTRADA, "mercado-livre.csv");
const ARQUIVO_CIDADE = path.join(PASTA_ENTRADA, "cidade.csv");
const ARQUIVO_EVENTOS = path.join(PASTA_ENTRADA, "eventos.csv");

/**
 * Garante que as pastas existam.
 */
function garantirPastas() {
  for (const pasta of [PASTA_ENTRADA, PASTA_HISTORICO, PASTA_RELATORIOS]) {
    if (!fs.existsSync(pasta)) {
      fs.mkdirSync(pasta, { recursive: true });
    }
  }
}

/**
 * Bruno - 05/06/2026 - horário de São Paulo
 *
 * Gera data e hora no fuso America/Sao_Paulo
 * para evitar sobrescrever arquivos no mesmo dia.
 *
 * Exemplo:
 * 2026-06-05_14-37-22
 */
function dataHoraSaoPaulo() {
  const agora = new Date();

  const partes = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(agora);

  const mapa = Object.fromEntries(
    partes.map((parte) => [parte.type, parte.value])
  );

  return (
    mapa.year +
    "-" +
    mapa.month +
    "-" +
    mapa.day +
    "_" +
    mapa.hour +
    "-" +
    mapa.minute +
    "-" +
    mapa.second
  );
}

/**
 * Normaliza textos para comparação.
 * Exemplo:
 * "Cômoda 2,07m" vira "comoda207m"
 */
function normalizar(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Converte valores como "R$ 1.590,00" para número 1590.
 */
function converterMoedaParaNumero(valor) {
  const limpo = String(valor || "")
    .replace("R$", "")
    .replace(/\./g, "")
    .replace(",", ".")
    .trim();

  const numero = Number(limpo);

  return Number.isNaN(numero) ? 0 : numero;
}

/**
 * Lê produtos diretamente do app.ts.
 */
function lerProdutosDoAppTs() {
  const appTs = fs.readFileSync(CAMINHO_APP_TS, "utf8");

  const blocos = appTs.match(/\{\s*id:\s*\d+[\s\S]*?\n\s*\}/g) || [];

  return blocos.map((bloco) => {
    const pegar = (campo) => {
      const regex = new RegExp(`${campo}:\\s*'([^']*)'`);
      const match = bloco.match(regex);
      return match ? match[1] : "";
    };

    const idMatch = bloco.match(/id:\s*(\d+)/);

    const linkMercadoLivre = pegar("linkMercadoLivre");

    return {
      id: idMatch ? Number(idMatch[1]) : null,
      nome: pegar("nome"),
      comodo: pegar("comodo"),
      categoriaComodo: pegar("categoriaComodo"),
      status: pegar("status"),
      valorOriginal: pegar("valorOriginal"),
      valorVenda: pegar("valorVenda"),
      valorVendaNumero: converterMoedaParaNumero(pegar("valorVenda")),
      linkMercadoLivre,
      temMercadoLivre: Boolean(linkMercadoLivre),
    };
  });
}

/**
 * Parser simples de linha CSV.
 * Funciona com campos entre aspas.
 */
function separarLinhaCsv(linha) {
  const resultado = [];
  let atual = "";
  let dentroDeAspas = false;

  for (let i = 0; i < linha.length; i++) {
    const char = linha[i];
    const proximo = linha[i + 1];

    if (char === '"' && dentroDeAspas && proximo === '"') {
      atual += '"';
      i++;
    } else if (char === '"') {
      dentroDeAspas = !dentroDeAspas;
    } else if (char === "," && !dentroDeAspas) {
      resultado.push(atual.trim());
      atual = "";
    } else {
      atual += char;
    }
  }

  resultado.push(atual.trim());

  return resultado;
}

/**
 * Lê CSV genérico do GA4.
 */
function lerCsv(caminho) {
  if (!fs.existsSync(caminho)) {
    console.log(`Arquivo não encontrado: ${caminho}`);
    return [];
  }

  const linhas = fs
    .readFileSync(caminho, "utf8")
    .split(/\r?\n/)
    .filter((linha) => linha.trim() && !linha.startsWith("#"));

  if (linhas.length < 2) {
    return [];
  }

  const cabecalho = separarLinhaCsv(linhas[0]);

  return linhas.slice(1).map((linha) => {
    const colunas = separarLinhaCsv(linha);
    const obj = {};

    cabecalho.forEach((coluna, index) => {
      obj[coluna] = colunas[index] || "";
    });

    return obj;
  });
}

/**
 * Extrai mapa de Produto -> Contagem de eventos.
 * Serve para detalhes.csv e mercado-livre.csv.
 */
function montarMapaProdutoEventos(caminho) {
  const linhas = lerCsv(caminho);
  const mapa = {};

  for (const linha of linhas) {
    const nomeProduto =
      linha["Produto nome"] ||
      linha["produto_nome"] ||
      linha["Produto"] ||
      linha["Nome do produto"] ||
      Object.values(linha)[0];

    const contagemTexto =
      linha["Contagem de eventos"] ||
      linha["Event count"] ||
      linha["Eventos"] ||
      Object.values(linha).at(-1);

    const contagem = Number(String(contagemTexto).replace(/\D/g, ""));

    if (nomeProduto && !Number.isNaN(contagem)) {
      mapa[normalizar(nomeProduto)] = contagem;
    }
  }

  return mapa;
}

/**
 * Monta resumo de cidades.
 */
function montarResumoCidades() {
  const linhas = lerCsv(ARQUIVO_CIDADE);

  return linhas
    .map((linha) => ({
      cidade: linha["Cidade"] || Object.values(linha)[0],
      usuariosAtivos: Number(
        String(linha["Usuários ativos"] || linha["Active users"] || "0").replace(/\D/g, "")
      ),
      contagemEventos: Number(
        String(linha["Contagem de eventos"] || linha["Event count"] || "0").replace(/\D/g, "")
      ),
    }))
    .filter((item) => item.cidade)
    .slice(0, 10);
}

/**
 * Monta resumo de eventos gerais.
 */
function montarResumoEventos() {
  const linhas = lerCsv(ARQUIVO_EVENTOS);

  return linhas
    .map((linha) => ({
      evento: linha["Nome do evento"] || linha["Event name"] || Object.values(linha)[0],
      contagem: Number(
        String(linha["Contagem de eventos"] || linha["Event count"] || Object.values(linha).at(-1)).replace(/\D/g, "")
      ),
    }))
    .filter((item) => item.evento)
    .slice(0, 20);
}

/**
 * Monta análise consolidada por produto.
 */
function montarAnaliseBase() {
  const produtos = lerProdutosDoAppTs();

  const detalhes = montarMapaProdutoEventos(ARQUIVO_DETALHES);
  const mercadoLivre = montarMapaProdutoEventos(ARQUIVO_MERCADO_LIVRE);

  const disponiveis = produtos.filter((produto) => produto.status === "Disponível");

  const analise = disponiveis.map((produto) => {
    const chave = normalizar(produto.nome);

    const cliquesDetalhes = detalhes[chave] || 0;
    const cliquesMercadoLivre = mercadoLivre[chave] || 0;

    const score = cliquesDetalhes + cliquesMercadoLivre * 2;

    return {
      id: produto.id,
      produto: produto.nome,
      comodo: produto.comodo,
      status: produto.status,
      valorAtual: produto.valorVenda,
      valorAtualNumero: produto.valorVendaNumero,
      temMercadoLivre: produto.temMercadoLivre,
      cliquesDetalhes,
      cliquesMercadoLivre,
      score,
    };
  });

  analise.sort((a, b) => b.score - a.score);

  return analise;
}

/**
 * Salva snapshot diário para histórico.
 */
function salvarHistorico(payload) {
  const hoje = dataHoraSaoPaulo();
  const caminho = path.join(PASTA_HISTORICO, `${hoje}.json`);

  fs.writeFileSync(caminho, JSON.stringify(payload, null, 2), "utf8");

  return caminho;
}

/**
 * Monta prompt para OpenAI.
 */
function montarPrompt(payload) {
  return `
Você é um agente de IA chamado "Agente Analista do Desapego".

Contexto:
Bruno criou um catálogo de desapego em Angular, publicado no GitHub Pages, com eventos no Google Analytics.
Sua função é analisar somente os produtos disponíveis e recomendar ações comerciais.

Regras importantes:
- Ignore produtos vendidos, reservados ou indisponíveis.
- Não recomende baixar preço de produto que já está vendido, reservado ou indisponível.
- Considere cliques em Detalhes como interesse.
- Considere cliques no Mercado Livre como intenção mais forte.
- Se o produto não tem link Mercado Livre, não critique ausência de cliques Mercado Livre.
- Se há muitos cliques em Detalhes e pouco contato, recomende facilitar contato direto.
- Seja conservador com desconto. Primeiro avalie divulgação, posicionamento e destaque.
- Responda em português do Brasil.
- Seja objetivo, executivo e prático.

Dados consolidados:
${JSON.stringify(payload, null, 2)}

Retorne exatamente nesta estrutura:

# Resumo executivo

# Produtos quentes

# Produtos mornos

# Produtos frios

# Recomendações por produto
Para cada produto disponível:
- Produto
- Diagnóstico
- Ação recomendada
- Justificativa

# Ações prioritárias para hoje

# O que monitorar amanhã
`;
}

/**
 * Chama a OpenAI usando Responses API.
 * O SDK oficial mostra o uso de client.responses.create e response.output_text.
 */
async function consultarOpenAI(payload) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY não encontrada no .env");
  }

  const prompt = montarPrompt(payload);

  const resposta = await openai.responses.create({
    model: MODELO_OPENAI,
    input: prompt,
  });

  return resposta.output_text || "A OpenAI não retornou texto.";
}

/**
 * Salva relatório em TXT.
 */
function salvarRelatorioTexto(texto) {
  const hoje = dataHoraSaoPaulo();
  const caminho = path.join(PASTA_RELATORIOS, `relatorio-openai-${hoje}.txt`);

  fs.writeFileSync(caminho, texto, "utf8");

  return caminho;
}

/**
 * Salva base consolidada em CSV.
 */
function salvarBaseCsv(analiseProdutos) {
  const hoje = dataHoraSaoPaulo();
  const caminho = path.join(PASTA_RELATORIOS, `base-consolidada-${hoje}.csv`);

  const linhas = [
    "Produto,Cômodo,Status,Valor Atual,Tem Mercado Livre,Cliques Detalhes,Cliques Mercado Livre,Score",
    ...analiseProdutos.map((item) =>
      [
        item.produto,
        item.comodo,
        item.status,
        item.valorAtual,
        item.temMercadoLivre ? "Sim" : "Não",
        item.cliquesDetalhes,
        item.cliquesMercadoLivre,
        item.score,
      ]
        .map((valor) => `"${String(valor).replace(/"/g, '""')}"`)
        .join(",")
    ),
  ];

  fs.writeFileSync(caminho, linhas.join("\n"), "utf8");

  return caminho;
}

/**
 * Função principal.
 */
async function main() {
  garantirPastas();

  console.log("Iniciando Agente Analista do Desapego V2...");

  const analiseProdutos = montarAnaliseBase();
  const cidades = montarResumoCidades();
  const eventos = montarResumoEventos();

  const payload = {
    dataExecucao: new Date().toISOString(),
    origemDados: {
      produtos: CAMINHO_APP_TS,
      detalhes: ARQUIVO_DETALHES,
      mercadoLivre: ARQUIVO_MERCADO_LIVRE,
      cidade: ARQUIVO_CIDADE,
      eventos: ARQUIVO_EVENTOS,
    },
    produtosDisponiveis: analiseProdutos,
    resumoCidades: cidades,
    resumoEventos: eventos,
  };

  const historicoPath = salvarHistorico(payload);
  const baseCsvPath = salvarBaseCsv(analiseProdutos);

  console.log("Histórico salvo em:", historicoPath);
  console.log("Base consolidada salva em:", baseCsvPath);

  console.log("Consultando OpenAI...");
  const relatorio = await consultarOpenAI(payload);

  const relatorioPath = salvarRelatorioTexto(relatorio);

  console.log("Relatório OpenAI gerado em:", relatorioPath);
  console.log("Agente V2 executado com sucesso.");
}

main().catch((erro) => {
  console.error("Erro ao executar o Agente V2:");
  console.error(erro.message);
});
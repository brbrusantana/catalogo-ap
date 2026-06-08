const fs = require("fs");
const path = require("path");

/**
 * Remove acentos, cedilhas e caracteres especiais.
 *
 * Exemplos:
 *
 * Cômoda -> Comoda
 * Clássico -> Classico
 * Disponível -> Disponivel
 * São Paulo -> Sao Paulo
 */
function removerAcentos(texto) {
  if (texto === null || texto === undefined) {
    return "";
  }

  return String(texto)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}
/**
 * AGENTE V3 + V4 + V5
 *
 * V3: compara o histórico de cliques entre execuções
 * V4: calcula uma probabilidade estimada de venda
 * V5: sugere ação e preço com base no comportamento do produto
 */

// Pastas principais do projeto
const DIR_HISTORICO = path.join(__dirname, "dados-agente", "historico");
const DIR_SAIDA = path.join(__dirname, "dados-agente", "saida");

// Cria a pasta de saída caso ela ainda não exista
if (!fs.existsSync(DIR_SAIDA)) {
  fs.mkdirSync(DIR_SAIDA, { recursive: true });
}

/**
 * Lê todos os arquivos JSON da pasta de histórico.
 * Cada execução anterior do agente V2 deve ter gerado um JSON aqui.
 */
function lerJsonsHistorico() {
  if (!fs.existsSync(DIR_HISTORICO)) {
    throw new Error("Pasta dados-agente/historico não encontrada.");
  }

  return fs
    .readdirSync(DIR_HISTORICO)
    .filter((arquivo) => arquivo.endsWith(".json"))
    .map((arquivo) => {
      const caminho = path.join(DIR_HISTORICO, arquivo);
      const conteudo = JSON.parse(fs.readFileSync(caminho, "utf8"));

      return {
        arquivo,
        ...conteudo,
      };
    })
    .sort((a, b) => {
      /**
       * Ordena do histórico mais antigo para o mais novo.
       * Isso é importante para comparar penúltima execução x última execução.
       */
      const dataA = new Date(a.timestamp || a.dataExecucao || 0);
      const dataB = new Date(b.timestamp || b.dataExecucao || 0);
      return dataA - dataB;
    });
}

/**
 * Normaliza os nomes dos campos.
 * Como seus JSONs podem ter nomes diferentes, essa função tenta reconhecer
 * várias possibilidades: nome, produto_nome, cliques, totalCliques etc.
 */
function normalizarProduto(produto) {
  return {
    id: produto.id || produto.produto_id || produto.codigo || "",
    nome: produto.nome || produto.produto_nome || produto.produto || "",
    comodo: produto.comodo || produto.produto_comodo || "",
    status: produto.status || produto.produto_status || "",
    valor: Number(
      produto.valorAtualNumero ||
        produto.valor ||
        produto.produto_valor ||
        produto.preco ||
        produto.precoAtual ||
        0
    ),
    cliques: Number(
      produto.score ||
        produto.cliques ||
        produto.totalCliques ||
        produto.cliquesDetalhes ||
        0
    ),
    cliquesDetalhes: Number(produto.cliquesDetalhes || 0),
    cliquesMercadoLivre: Number(produto.cliquesMercadoLivre || 0),
    temMercadoLivre: Boolean(produto.temMercadoLivre),
  };

}

/**
 * Extrai a lista de produtos de uma execução.
 * O agente tenta encontrar automaticamente em qual campo está a lista.
 */
function extrairProdutos(execucao) {
  const possiveisCampos = [
    execucao.produtosDisponiveis,
    execucao.produtos,
    execucao.itens,
    execucao.dados,
    execucao.resultado,
    execucao.baseConsolidada,
  ];

  const lista = possiveisCampos.find((campo) => Array.isArray(campo));

  if (!lista) return [];

  return lista.map(normalizarProduto).filter((produto) => produto.nome);
}

/**
 * Agrupa todos os históricos por produto.
 * Assim cada produto fica com uma linha do tempo de cliques, preço e status.
 */
function agruparPorProduto(historicos) {
  const mapa = new Map();

  historicos.forEach((execucao, indice) => {
    const produtos = extrairProdutos(execucao);
    const data = execucao.timestamp || execucao.dataExecucao || execucao.arquivo;

    produtos.forEach((produto) => {
      const chave = produto.id || produto.nome;

      if (!mapa.has(chave)) {
        mapa.set(chave, {
          id: produto.id,
          nome: produto.nome,
          comodo: produto.comodo,
          status: produto.status,
          valor: produto.valor,
          historico: [],
        });
      }

      const item = mapa.get(chave);

      item.historico.push({
        execucao: indice + 1,
        data,
        cliques: produto.cliques,
        valor: produto.valor,
        status: produto.status,
      });

      // Mantém sempre os dados mais recentes do produto
      item.valor = produto.valor || item.valor;
      item.status = produto.status || item.status;
      item.comodo = produto.comodo || item.comodo;
    });
  });

  return Array.from(mapa.values());
}

/**
 * V3
 * Calcula a tendência do produto comparando:
 * penúltima execução x última execução.
 */
function calcularTendencia(historico) {
  if (historico.length < 2) {
    return {
      cliquesAnterior: 0,
      cliquesAtual: historico[0]?.cliques || 0,
      variacao: 0,
      variacaoPercentual: 0,
      tendencia: "Sem histórico suficiente",
    };
  }

  const anterior = historico[historico.length - 2];
  const atual = historico[historico.length - 1];

  const variacao = atual.cliques - anterior.cliques;

  const variacaoPercentual =
    anterior.cliques === 0
      ? atual.cliques > 0
        ? 100
        : 0
      : (variacao / anterior.cliques) * 100;

  let tendencia = "Estável";

  if (variacaoPercentual >= 30) tendencia = "Crescendo forte";
  else if (variacaoPercentual >= 10) tendencia = "Crescendo";
  else if (variacaoPercentual <= -30) tendencia = "Caindo forte";
  else if (variacaoPercentual <= -10) tendencia = "Caindo";

  return {
    cliquesAnterior: anterior.cliques,
    cliquesAtual: atual.cliques,
    variacao,
    variacaoPercentual,
    tendencia,
  };
}

/**
 * V4
 * Calcula um score estimado de venda.
 *
 * Fórmula inicial:
 * 40 pontos, volume de cliques
 * 25 pontos, tendência histórica
 * 15 pontos, preço
 * 10 pontos, status disponível
 * 10 pontos, quantidade de histórico
 */
function calcularScoreVenda(produto, maiorCliqueAtual) {
  const analise = calcularTendencia(produto.historico);
  const cliquesAtual = analise.cliquesAtual;

  const scoreCliques =
    maiorCliqueAtual > 0 ? (cliquesAtual / maiorCliqueAtual) * 40 : 0;

  let scoreTendencia = 10;

  if (analise.tendencia === "Crescendo forte") scoreTendencia = 25;
  else if (analise.tendencia === "Crescendo") scoreTendencia = 20;
  else if (analise.tendencia === "Estável") scoreTendencia = 12;
  else if (analise.tendencia === "Caindo") scoreTendencia = 6;
  else if (analise.tendencia === "Caindo forte") scoreTendencia = 2;

  let scorePreco = 10;

  if (produto.valor <= 500) scorePreco = 15;
  else if (produto.valor <= 1000) scorePreco = 12;
  else if (produto.valor <= 1600) scorePreco = 9;
  else scorePreco = 6;

  const scoreStatus = produto.status === "Disponível" ? 10 : 0;

  const scoreHistorico = produto.historico.length >= 3 ? 10 : 6;

  const scoreFinal =
    scoreCliques +
    scoreTendencia +
    scorePreco +
    scoreStatus +
    scoreHistorico;

  return Math.min(Math.round(scoreFinal), 100);
}

/**
 * Transforma o score em uma classificação simples.
 */
function classificarProbabilidade(score) {
  if (score >= 70) return "Alta";
  if (score >= 45) return "Média";
  return "Baixa";
}

/**
 * V5
 * Sugere ação e preço.
 */
function sugerirAcao(produto, score) {
  const analise = calcularTendencia(produto.historico);
  const precoAtual = produto.valor;

  let acao = "Manter preço";
  let precoSugerido = precoAtual;
  let motivo = "Produto com comportamento aceitável.";

  if (score >= 75) {
    acao = "Manter preço e reforçar divulgação";
    precoSugerido = precoAtual;
    motivo =
      "Alta probabilidade de venda. Evite desconto agora para preservar margem.";
  } else if (score >= 45) {
    acao = "Melhorar anúncio e testar pequeno desconto";
    precoSugerido = Math.round(precoAtual * 0.95);
    motivo =
      "Interesse médio. Um ajuste leve pode acelerar a conversão.";
  } else {
    acao = "Revisar fotos, descrição e reduzir preço";
    precoSugerido = Math.round(precoAtual * 0.9);
    motivo =
      "Baixa probabilidade de venda. O produto precisa de ação mais forte.";
  }

  // Regra de proteção: se está crescendo, não dar desconto cedo demais
  if (analise.tendencia.includes("Crescendo") && score >= 60) {
    acao = "Manter preço";
    precoSugerido = precoAtual;
    motivo =
      "O interesse está crescendo. Melhor aguardar antes de conceder desconto.";
  }

  // Regra de reação: se está caindo e score não está bom, agir mais forte
  if (analise.tendencia.includes("Caindo") && score < 60) {
    acao = "Reduzir preço e melhorar anúncio";
    precoSugerido = Math.round(precoAtual * 0.9);
    motivo =
      "O interesse está caindo. Recomenda-se ajuste de preço e melhoria no anúncio.";
  }

  return {
    acao,
    precoAtual,
    precoSugerido,
    motivo,
  };
}

/**
 * Converte uma lista de objetos para CSV separado por ponto e vírgula.
 * Isso facilita abrir no Excel em português.
 */
function converterParaCsv(linhas) {
  if (!linhas.length) return "";

  const colunas = Object.keys(linhas[0]);

  const escapar = (valor) => {
    if (valor === null || valor === undefined) return "";
        const texto = removerAcentos(
        String(valor).replace(/"/g, '""')
        );
    return `"${texto}"`;
  };

  return [
    colunas.join(";"),
    ...linhas.map((linha) => colunas.map((c) => escapar(linha[c])).join(";")),
  ].join("\n");
}

/**
 * Função principal do agente.
 */
function executar() {
  console.log("Iniciando Agente V3 + V4 + V5...");

  const historicos = lerJsonsHistorico();

  if (historicos.length === 0) {
    throw new Error("Nenhum JSON encontrado em dados-agente/historico.");
  }

  console.log(`Históricos encontrados: ${historicos.length}`);

  const produtos = agruparPorProduto(historicos);

  console.log(`Produtos analisados: ${produtos.length}`);

  const maiorCliqueAtual = Math.max(
    ...produtos.map((p) => calcularTendencia(p.historico).cliquesAtual),
    0
  );

  const resultado = produtos.map((produto) => {
    const analise = calcularTendencia(produto.historico);
    const score = calcularScoreVenda(produto, maiorCliqueAtual);
    const probabilidade = classificarProbabilidade(score);
    const recomendacao = sugerirAcao(produto, score);

    return {
      id: produto.id,
      produto: produto.nome,
      comodo: produto.comodo,
      status: produto.status,
      preco_atual: produto.valor,
      cliques_anterior: analise.cliquesAnterior,
      cliques_atual: analise.cliquesAtual,
      variacao_cliques: analise.variacao,
      variacao_percentual: `${analise.variacaoPercentual.toFixed(2)}%`,
      tendencia: analise.tendencia,
      score_venda: score,
      probabilidade_venda: probabilidade,
      acao_recomendada: recomendacao.acao,
      preco_sugerido: recomendacao.precoSugerido,
      motivo: recomendacao.motivo,
    };
  });

  const comparativoHistorico = resultado.map((r) => ({
    produto: r.produto,
    cliques_anterior: r.cliques_anterior,
    cliques_atual: r.cliques_atual,
    variacao_cliques: r.variacao_cliques,
    variacao_percentual: r.variacao_percentual,
    tendencia: r.tendencia,
  }));

  const rankingVenda = [...resultado].sort(
    (a, b) => b.score_venda - a.score_venda
  );

  const acoesRecomendadas = rankingVenda.map((r) => ({
    produto: r.produto,
    preco_atual: r.preco_atual,
    score_venda: r.score_venda,
    probabilidade_venda: r.probabilidade_venda,
    acao_recomendada: r.acao_recomendada,
    preco_sugerido: r.preco_sugerido,
    motivo: r.motivo,
  }));

  /**
 * Exporta o comparativo histórico (V3)
 *
 * Adicionamos "\uFEFF" no início do arquivo para gravar
 * o CSV com BOM UTF-8.
 *
 * Isso ajuda o Excel do Windows a interpretar corretamente
 * caracteres especiais caso algum passe pela normalização.
 */
    const agora = new Date();
    const timestampArquivo = agora
    .toISOString()
    .replace(/:/g, "-")
    .replace(/\..+/, "");
    
    fs.writeFileSync(
    path.join(DIR_SAIDA, `comparativo-historico-${timestampArquivo}.csv`),
    "\uFEFF" + converterParaCsv(comparativoHistorico),
    "utf8"
    );

    /**
     * Exporta o ranking de probabilidade de venda (V4)
     *
     * O BOM UTF-8 evita problemas de encoding
     * ao abrir diretamente no Excel.
     */
    fs.writeFileSync(
    path.join(DIR_SAIDA, `ranking-probabilidade-venda-${timestampArquivo}.csv`),
    "\uFEFF" + converterParaCsv(rankingVenda),
    "utf8"
    );

    /**
     * Exporta as recomendações da IA (V5)
     *
     * Contém:
     * - score de venda
     * - probabilidade estimada
     * - ação recomendada
     * - preço sugerido
     */
    fs.writeFileSync(
    path.join(DIR_SAIDA, `acoes-recomendadas-${timestampArquivo}.csv`),
    "\uFEFF" + converterParaCsv(acoesRecomendadas),
    "utf8"
    );

    /**
     * Exporta o resultado completo em JSON.
     *
     * Mantemos UTF-8 normal porque JSON é consumido
     * posteriormente por outros agentes e scripts Node.js.
     *
     * Aqui NÃO adicionamos BOM.
     */
    fs.writeFileSync(
    path.join(DIR_SAIDA, `resultado-v3-v4-v5-${timestampArquivo}.json`),
    JSON.stringify(resultado, null, 2),
    "utf8"
    );

  console.log("");
  console.log("Agente executado com sucesso.");
  console.log("");
  console.log("Arquivos gerados:");
  console.log(`dados-agente/saida/comparativo-historico-${timestampArquivo}.csv`);
  console.log(`dados-agente/saida/ranking-probabilidade-venda-${timestampArquivo}.csv`);
  console.log(`dados-agente/saida/acoes-recomendadas-${timestampArquivo}.csv`);
  console.log(`dados-agente/saida/resultado-v3-v4-v5-${timestampArquivo}.json`);
}

executar();
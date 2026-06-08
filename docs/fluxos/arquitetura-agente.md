# Fluxos do Agente de IA - Anuncios de Eletrodomesticos

## 1. Fluxo geral do projeto

```mermaid
flowchart TD
    A[Usuario exporta CSVs do GA4] --> B[dados-agente/entrada]
    B --> C[agente V2]
    C --> D[dados-agente/historico/*.json]
    C --> E[dados-agente/relatorios]
    D --> F[agente-v3-v4-v5.js]
    F --> G[comparativo historico CSV]
    F --> H[ranking probabilidade venda CSV]
    F --> I[acoes recomendadas CSV]
    F --> J[resultado-v3-v4-v5 JSON]
    J --> K[gerar-dashboard-agente.js]
    K --> L[dashboard-agente.html]
    L --> M[Usuario abre dashboard no navegador]
```

## 2. Fluxo do agente V3, V4 e V5

```mermaid
flowchart TD
    A[Iniciar agente-v3-v4-v5.js] --> B[Ler JSONs em dados-agente/historico]
    B --> C[Normalizar produtos]
    C --> D[Agrupar historico por produto]

    D --> E[V3 Comparar penultima execucao com ultima execucao]
    E --> F[Calcular variacao de cliques]
    F --> G[Classificar tendencia]

    G --> H[V4 Calcular score de venda]
    H --> I[Classificar probabilidade Alta Media Baixa]

    I --> J[V5 Sugerir acao]
    J --> K[Manter preco]
    J --> L[Testar pequeno desconto]
    J --> M[Reduzir preco e melhorar anuncio]

    K --> N[Gerar arquivos em dados-agente/saida]
    L --> N
    M --> N
```

## 3. Fluxo do dashboard HTML

```mermaid
flowchart TD
    A[Iniciar gerar-dashboard-agente.js] --> B[Ler pasta dados-agente/saida]
    B --> C[Filtrar arquivos resultado-v3-v4-v5*.json]
    C --> D[Ordenar por nome com timestamp]
    D --> E[Selecionar JSON mais recente]
    E --> F[Ler produtos e recomendacoes]
    F --> G[Gerar cards HTML]
    G --> H[Salvar dashboard-agente.html]
    H --> I[Abrir no navegador]
```

## 4. Relacao entre arquivos principais

```mermaid
flowchart LR
    A[src/app/app.ts] --> B[Catalogo Angular]
    B --> C[Google Analytics 4]
    C --> D[CSVs exportados]

    D --> E[dados-agente/entrada]
    E --> F[Agente V2]
    F --> G[dados-agente/historico JSON]

    G --> H[agente-v3-v4-v5.js]
    H --> I[resultado-v3-v4-v5 JSON]

    I --> J[gerar-dashboard-agente.js]
    J --> K[dashboard-agente.html]
```

## 5. Fluxo com OpenAI

```mermaid
sequenceDiagram
    participant U as Usuario
    participant CSV as CSVs GA4
    participant V2 as Agente V2 Node.js
    participant OAI as OpenAI
    participant HIST as Historico JSON
    participant V345 as Agente V3 V4 V5
    participant DASH as Dashboard HTML

    U->>CSV: Exporta dados do GA4
    CSV->>V2: Entrada dos dados
    V2->>OAI: Envia contexto para analise
    OAI-->>V2: Retorna relatorio textual
    V2->>HIST: Salva snapshot historico
    HIST->>V345: Base para comparacao
    V345->>V345: Calcula tendencia score e acao
    V345->>DASH: Gera JSON final
    DASH-->>U: Exibe cards por produto
```
/**
 * ============================================================
 * Projeto: Elo - AP do Bruno - Desapego
 * Autor: Bruno Santana
 * Data: 30/05/2026
 *
 * Objetivo:
 * Este arquivo controla os dados e as regras do catálogo.
 * Aqui ficam:
 * - lista de produtos
 * - status dos itens
 * - filtros
 * - pesquisa
 * - ordenação
 * - proteção simples contra botão direito e atalhos de inspeção
 * - indicador visual de novos descontos em produtos selecionados
 *
 * Conceitos estudados:
 * - Angular Component
 * - TypeScript
 * - Tipos personalizados
 * - Arrays
 * - Filter()
 * - Sort()
 * - Getters
 * - Event listeners com @HostListener
 * ============================================================
 */

// Importa o FormsModule para permitir o uso de [(ngModel)] nos filtros do HTML.
import { FormsModule } from '@angular/forms';
// Importa recursos principais do Angular usados neste componente.
import { Component, HostListener, signal } from '@angular/core';

/**
 * Bruno:
 * Tipo com os status permitidos para um produto.
 * Isso evita digitar status diferentes por engano.
 */
type StatusProduto =
  | 'Disponível'
  | 'Reservado'
  | 'Vendido'
  | 'Indisponível';

/**
 * Bruno:
 * Tipo com os cômodos usados nos filtros do catálogo.
 * Suíte e Dormitório 2 entram como categoria geral Dormitório.
 */
type CategoriaComodo =
  | 'Dormitório'
  | 'Sala'
  | 'Cozinha'
  | 'Lavanderia'
  | 'Escritório';

/**
 * Bruno:
 * Modelo de dados de cada produto.
 * Cada item da lista precisa seguir esta estrutura.
 */
type Produto = {
  id: number;
  nome: string;
  comodo: string;
  categoriaComodo: CategoriaComodo;
  valorOriginal: string;
  valorVenda: string;
  status: StatusProduto;
  imagem: string;
  linkMercadoLivre?: string;

  /**
   * Bruno - 31/5/26 - indicador de novo desconto.
   * Quando true, o card exibe o selo "Novo desconto" no site.
   */
  novoDesconto?: boolean;
};

/**
 * Componente principal da aplicação Angular.
 * selector: nome da tag usada no index.html, <app-root>.
 * templateUrl: aponta para o app.html.
 * styleUrl: aponta para o app.scss.
 */
@Component({
  selector: 'app-root',
  imports: [FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  /**
   * Título exibido no cabeçalho azul do catálogo.
   * Signal é um recurso do Angular para guardar um valor reativo.
   */
  protected readonly title = signal('[Desapego] Catálogo de Venda');

  /**
   * Valores iniciais dos filtros.
   * Ao abrir a página, todos os produtos aparecem.
   */
  statusSelecionado = 'Todos';
  comodoSelecionado = 'Todos';

  /**
   * Opções exibidas nos combos de filtro do HTML.
   */
  statusOptions = ['Todos', 'Disponível', 'Reservado', 'Vendido', 'Indisponível'];
  comodoOptions = ['Todos', 'Dormitório', 'Sala', 'Cozinha', 'Lavanderia', 'Escritório'];

  /**
   * Texto digitado no campo de pesquisa.
   */
  pesquisa = '';

  /**
   * Ordenação inicial.
   * Relevância significa: mostrar primeiro o que ainda está disponível para venda.
   */
  ordenacaoSelecionada = 'Relevância';

  /**
   * Opções do campo Ordenar.
   */
  ordenacaoOptions = [
  'Relevância',
  'Menor preço',
  'Maior preço',
  'Nome A-Z',
  'Nome Z-A'
];

  /**
   * Total geral de itens cadastrados no catálogo.
   */
  get totalItens(): number {
  return this.produtos.length;
}

  /**
   * Total de itens disponíveis para venda.
   * Este número aparece no resumo verde do catálogo.
   */
  get totalDisponiveis(): number {
  return this.produtos.filter((produto) => produto.status === 'Disponível').length;
}



  /**
   * Lista principal de produtos.
   * Bruno:
   * Para atualizar estoque por enquanto, altero o campo status do produto.
   * Exemplo: status: 'Disponível' para status: 'Vendido'.
   */
  produtos: Produto[] = [
    {
      id: 1,
      nome: 'Cama box casal',
      comodo: 'Suíte',
      categoriaComodo: 'Dormitório',
      valorOriginal: 'R$ 1.200,00',
      valorVenda: 'R$ 699,99',
      // Bruno - 31/5/26 - indicador de novo desconto.
      novoDesconto: true,
      status: 'Vendido',
      imagem: 'assets/001-cama-box-casal.png'
    },
    {
      id: 2,
      nome: 'Guarda-roupa embutido',
      comodo: 'Suíte',
      categoriaComodo: 'Dormitório',
      valorOriginal: 'R$ 12.000,00',
      valorVenda: 'R$ 7.999,00',
      status: 'Indisponível',
      imagem: 'assets/002-guarda-roupa-suite.png'
    },
    {
      id: 3,
      nome: 'Cômoda 2,07m com gavetas e portas',
      comodo: 'Suíte',
      categoriaComodo: 'Dormitório',
      valorOriginal: 'R$ 2.000,00',
      valorVenda: 'R$ 1.299,00',
      // Bruno - 31/5/26 - indicador de novo desconto.
      novoDesconto: true,
      status: 'Disponível',
      imagem: 'assets/003-comoda-207cm.png'
    },
    {
      id: 4,
      nome: 'TV 32 polegadas',
      comodo: 'Suíte',
      categoriaComodo: 'Dormitório',
      valorOriginal: 'R$ 1.250,00',
      valorVenda: 'R$ 899,00',
      status: 'Vendido',
      imagem: 'assets/004-tv-32.png',
      linkMercadoLivre: 'https://brbrusantana.github.io/catalogo-ap/'
    },
    {
      id: 5,
      nome: 'Criado-mudo 4 gavetas',
      comodo: 'Dormitório 2',
      categoriaComodo: 'Dormitório',
      valorOriginal: 'R$ 1.200,00',
      valorVenda: 'R$ 699,00',
      status: 'Disponível',
      imagem: 'assets/005-criado-mudo.png',
      linkMercadoLivre: 'https://produto.mercadolivre.com.br/MLB-6837236296'
    },
    {
      id: 6,
      nome: 'Guarda-roupa 3 portas e 3 gavetas',
      comodo: 'Dormitório 2',
      categoriaComodo: 'Dormitório',
      valorOriginal: 'R$ 3.000,00',
      valorVenda: 'R$ 1.699,00',
      // Bruno - 31/5/26 - indicador de novo desconto.
      novoDesconto: true,
      status: 'Disponível',
      imagem: 'assets/006-guarda-roupa-solteiro.png',
      linkMercadoLivre: 'https://produto.mercadolivre.com.br/MLB-6867722404'
    },
    {
      id: 7,
      nome: 'Cômoda 4 gavetas e 1 porta',
      comodo: 'Dormitório 2',
      categoriaComodo: 'Dormitório',
      valorOriginal: 'R$ 2.000,00',
      valorVenda: 'R$ 1.299,00',
      // Bruno - 31/5/26 - indicador de novo desconto.
      novoDesconto: true,
      status: 'Disponível',
      imagem: 'assets/007-comoda-dormitorio-97cm.png',
      linkMercadoLivre: 'https://produto.mercadolivre.com.br/MLB-6837629970'
    },
    {
      id: 8,
      nome: 'Bicama box solteiro Ortobom',
      comodo: 'Dormitório 2',
      categoriaComodo: 'Dormitório',
      valorOriginal: 'R$ 1.200,00',
      valorVenda: 'R$ 899,00',
      // Bruno - 31/5/26 - indicador de novo desconto.
      novoDesconto: true,
      status: 'Reservado',
      imagem: 'assets/008-bicama-ortobom.png'
    },
    {
      id: 9,
      nome: 'Cadeira gamer Mymax MX5 vermelha',
      comodo: 'Escritório',
      categoriaComodo: 'Escritório',
      valorOriginal: 'R$ 1.500,00',
      valorVenda: 'R$ 799,00',
      // Bruno - 31/5/26 - indicador de novo desconto.
      novoDesconto: true,
      status: 'Disponível',
      imagem: 'assets/009-cadeira-gamer-vermelha.png',
      linkMercadoLivre: 'https://produto.mercadolivre.com.br/MLB-6836863246'
    },
    {
      id: 10,
      nome: 'Cadeira gamer Mymax MX5 verde/preta',
      comodo: 'Escritório',
      categoriaComodo: 'Escritório',
      valorOriginal: 'R$ 1.500,00',
      valorVenda: 'R$ 899,00',
      status: 'Vendido',
      imagem: 'assets/010-cadeira-gamer-verde.png'
    },
    {
      id: 11,
      nome: 'Teclado gamer HyperX Alloy MKW100',
      comodo: 'Escritório',
      categoriaComodo: 'Escritório',
      valorOriginal: 'R$ 180,00',
      valorVenda: 'R$ 149,00',
      status: 'Disponível',
      imagem: 'assets/011-teclado-gamer.png',
      linkMercadoLivre: 'https://produto.mercadolivre.com.br/MLB-4709115555'
    },
    {
      id: 12,
      nome: 'Teclado sem fio Logitech K400 Plus',
      comodo: 'Escritório',
      categoriaComodo: 'Escritório',
      valorOriginal: 'R$ 140,00',
      valorVenda: 'R$ 99,00',
      status: 'Disponível',
      imagem: 'assets/012-teclado-sem-fio-logitech-k400.png',
      linkMercadoLivre: 'https://produto.mercadolivre.com.br/MLB-4715448051-teclado-bluetooth-sem-fio-tv-abnt2-logitech-k400-plus-_JM'
    },
    {
      id: 13,
      nome: 'Rack clássico com vidro',
      comodo: 'Sala',
      categoriaComodo: 'Sala',
      valorOriginal: 'R$ 2.000,00',
      valorVenda: 'R$ 1.199,00',
      // Bruno - 31/5/26 - indicador de novo desconto.
      novoDesconto: true,
      status: 'Disponível',
      imagem: 'assets/013-rack-sala.png'
    },
    {
      id: 14,
      nome: 'Sofá-cama reclinável',
      comodo: 'Sala',
      categoriaComodo: 'Sala',
      valorOriginal: 'R$ 1.200,00',
      valorVenda: 'R$ 799,99',
      // Bruno - 31/5/26 - indicador de novo desconto.
      //novoDesconto: true,
      status: 'Reservado',
      imagem: 'assets/014-sofa-cama-laila.png',
      linkMercadoLivre: 'https://produto.mercadolivre.com.br/MLB-6837463500'
    },
    {
      id: 15,
      nome: 'Mesa de jantar com 6 cadeiras',
      comodo: 'Sala',
      categoriaComodo: 'Sala',
      valorOriginal: 'R$ 999,00',
      valorVenda: 'R$ 499,00',
      // Bruno - 31/5/26 - indicador de novo desconto.
      novoDesconto: true,
      status: 'Disponível',
      imagem: 'assets/015-mesa-jantar-6-cadeiras.png'
    },
    {
      id: 16,
      nome: 'Smart TV LG 49" UHD 4K',
      comodo: 'Sala',
      categoriaComodo: 'Sala',
      valorOriginal: 'R$ 1.850,00',
      valorVenda: 'R$ 1.099,00',
      // Bruno - 31/5/26 - indicador de novo desconto.
      novoDesconto: true,
      status: 'Disponível',
      imagem: 'assets/016-tv-lg-49.png',
      linkMercadoLivre: 'https://produto.mercadolivre.com.br/MLB-6837061448'
    },
    {
      id: 17,
      nome: 'Fogão Consul 4 bocas',
      comodo: 'Cozinha',
      categoriaComodo: 'Cozinha',
      valorOriginal: 'R$ 1.200,00',
      valorVenda: 'R$ 799,00',
      // Bruno - 31/5/26 - indicador de novo desconto.
      novoDesconto: true,
      status: 'Disponível',
      imagem: 'assets/017-fogao-consul-4-bocas.png',
      linkMercadoLivre: 'https://produto.mercadolivre.com.br/MLB-4709019557'
    },
    {
      id: 18,
      nome: 'Micro-ondas Electrolux inox',
      comodo: 'Cozinha',
      categoriaComodo: 'Cozinha',
      valorOriginal: 'R$ 1.200,00',
      valorVenda: 'R$ 749,00',
      // Bruno - 31/5/26 - indicador de novo desconto.
      novoDesconto: true,
      // Bruno - 31/5/26 - vendido.
      status: 'Vendido',
      imagem: 'assets/018-microondas-electrolux.png',
      linkMercadoLivre: 'https://brbrusantana.github.io/catalogo-ap/'
    },
    {
      id: 19,
      nome: 'Geladeira Electrolux inox',
      comodo: 'Cozinha',
      categoriaComodo: 'Cozinha',
      valorOriginal: 'R$ 2.200,00',
      valorVenda: 'R$ 1.590,00',
      // Bruno - 31/5/26 - indicador de novo desconto.
      novoDesconto: true,
      status: 'Disponível',
      imagem: 'assets/019-geladeira-electrolux.png'
    },
    {
      id: 20,
      nome: 'Aparador moderno MDF',
      comodo: 'Cozinha',
      categoriaComodo: 'Cozinha',
      valorOriginal: 'R$ 2.000,00',
      valorVenda: 'R$ 1.399,00',
      status: 'Indisponível',
      imagem: 'assets/020-aparador-mdf.png'
    },
    {
      id: 21,
      nome: 'Armário planejado de cozinha',
      comodo: 'Cozinha',
      categoriaComodo: 'Cozinha',
      valorOriginal: 'R$ 11.500,00',
      valorVenda: 'R$ 6.999,00',
      status: 'Indisponível',
      imagem: 'assets/021-armario-planejado-cozinha.png'
    },
    {
      id: 22,
      nome: 'Air Fryer Philco Gourmet Black',
      comodo: 'Cozinha',
      categoriaComodo: 'Cozinha',
      valorOriginal: 'R$ 799,00',
      valorVenda: 'R$ 399,00',
      status: 'Vendido',
      imagem: 'assets/022-airfryer-philco.png'
    },
    {
      id: 23,
      nome: 'Lava e seca LG 11kg/6kg',
      comodo: 'Lavanderia',
      categoriaComodo: 'Lavanderia',
      valorOriginal: 'R$ 2.190,00',
      valorVenda: 'R$ 1.590,00',
      // Bruno - 31/5/26 - indicador de novo desconto.
      novoDesconto: true,
      status: 'Vendido',
      imagem: 'assets/023-lava-e-seca-lg.png'
    },
    {
      id: 24,
      nome: 'Teclado Yamaha',
      comodo: 'Sala',
      categoriaComodo: 'Sala',
      valorOriginal: 'R$ 700,00',
      valorVenda: 'R$ 449,00',
      status: 'Vendido',
      imagem: 'assets/024-teclado-yamaha.png',
      linkMercadoLivre: 'https://brbrusantana.github.io/catalogo-ap/'
    }
    ,
    {
      id: 25,
      nome: 'Contrabaixo Giannini GB-200 NA 4 cordas',
      comodo: 'Escritório',
      categoriaComodo: 'Escritório',
      valorOriginal: 'R$ 1000,00',
      valorVenda: 'R$ 799,00',
      status: 'Vendido',
      imagem: 'assets/baixo.PNG'
    },
    {
      id: 26,
      nome: 'Guitarra Giannini Standard Series G-100',
      comodo: 'Escritório',
      categoriaComodo: 'Escritório',
      valorOriginal: 'R$ 600,00',
      valorVenda: 'R$ 399,00',
      status: 'Vendido',
      imagem: 'assets/guitarra.png'
    }
  ];

  /**
   * Bruno:
   * Esta é a regra principal da tela.
   * Aqui o Angular monta a lista final de produtos a exibir.
   *
   * Primeiro aplica filtros:
   * - Status
   * - Cômodo
   * - Pesquisa por nome
   *
   * Depois aplica ordenação:
   * - Relevância
   * - Menor preço
   * - Maior preço
   * - Nome A-Z
   * - Nome Z-A
   */
  get produtosFiltrados(): Produto[] {
  let resultado = this.produtos.filter((produto) => {
    const passaStatus =
      this.statusSelecionado === 'Todos' ||
      produto.status === this.statusSelecionado;

    const passaComodo =
      this.comodoSelecionado === 'Todos' ||
      produto.categoriaComodo === this.comodoSelecionado;

    const passaPesquisa =
      this.pesquisa.trim() === '' ||
      produto.nome.toLowerCase().includes(this.pesquisa.toLowerCase());

    return passaStatus && passaComodo && passaPesquisa;
  });

  if (this.ordenacaoSelecionada === 'Menor preço') {
    resultado = resultado.sort((a, b) => this.valorNumerico(a.valorVenda) - this.valorNumerico(b.valorVenda));
  }

  if (this.ordenacaoSelecionada === 'Maior preço') {
    resultado = resultado.sort((a, b) => this.valorNumerico(b.valorVenda) - this.valorNumerico(a.valorVenda));
  }

  if (this.ordenacaoSelecionada === 'Nome A-Z') {
    resultado = resultado.sort((a, b) => a.nome.localeCompare(b.nome));
  }

  if (this.ordenacaoSelecionada === 'Nome Z-A') {
    resultado = resultado.sort((a, b) => b.nome.localeCompare(a.nome));
  }

  if (this.ordenacaoSelecionada === 'Relevância') {
    resultado = resultado.sort((a, b) => {
      return this.prioridadeStatus(a.status) - this.prioridadeStatus(b.status);
    });
  }

  return resultado;
}

/**
 * Bruno:
 * Define a ordem padrão dos produtos quando a página abre.
 *
 * Objetivo de negócio:
 * Mostrar primeiro os itens disponíveis, porque eles têm maior chance de venda.
 *
 * Ordem:
 * 1. Disponível
 * 2. Reservado
 * 3. Indisponível
 * 4. Vendido
 */
  private prioridadeStatus(status: StatusProduto): number {
  const prioridades: Record<StatusProduto, number> = {
    'Disponível': 1,
    'Reservado': 2,
    'Indisponível': 3,
    'Vendido': 4
  };

  return prioridades[status];
}

/**
 * Bruno:
 * Converte valores em formato brasileiro para número.
 *
 * Exemplo:
 * 'R$ 1.299,00' vira 1299
 *
 * Isso permite ordenar por menor preço ou maior preço.
 */
  private valorNumerico(valor: string): number {
  return Number(
    valor
      .replace('R$', '')
      .replace(/\./g, '')
      .replace(',', '.')
      .trim()
  );
}

/**
 * Bloqueio simples do botão direito.
 * Importante:
 * Isto dificulta para curiosos, mas não impede alguém técnico de acessar arquivos públicos.
 */
  @HostListener('document:contextmenu', ['$event'])
  bloquearBotaoDireito(event: MouseEvent): void {
  event.preventDefault();
  alert('KKKK Ops, não foi dessa vez, jovem!!! Acesso ao código-fonte indisponível.');
}

/**
 * Bloqueio simples de atalhos como F12 e Ctrl+U.
 * Serve como barreira visual para usuários comuns.
 */
  @HostListener('document:keydown', ['$event'])
  bloquearAtalhos(event: KeyboardEvent): void {
  const tecla = event.key.toLowerCase();

  const bloqueado =
    event.key === 'F12' ||
    (event.ctrlKey && event.shiftKey && ['i', 'j', 'c'].includes(tecla)) ||
    (event.ctrlKey && tecla === 'u');

  if (bloqueado) {
    event.preventDefault();
    alert('Ops, acesso ao código-fonte indisponível.');
  }
}


    /**
     * Bruno Santana - 30/05/2026
     * RastrearClique
     * Envia eventos personalizados para o Google Analytics.
     * Usamos isso para saber quais produtos receberam cliques
     * em "Detalhes" e em "Mercado Livre".
     */
    rastrearClique(tipoClique: 'Detalhes' | 'Mercado Livre', produto: Produto): void {
      const gtag = (window as any).gtag;

      if (!gtag) {
        return;
      }

      gtag('event', 'clique_produto', {
        tipo_clique: tipoClique,
        produto_id: produto.id,
        produto_nome: produto.nome,
        produto_status: produto.status,
        produto_comodo: produto.categoriaComodo,
        produto_valor: produto.valorVenda
      });
    }

// Bruno - 04/06/2026 - popup inicial de oportunidade
    mostrarPopupOportunidade = true;

    ngOnInit(): void {
      this.rastrearPopupOportunidade('popup_oportunidade_exibido');
    }

    fecharPopupOportunidade(): void {
      this.mostrarPopupOportunidade = false;
    }

    clicarPopupOportunidade(): void {
      this.rastrearPopupOportunidade('popup_oportunidade_clique');
      this.fecharPopupOportunidade();
    }

    rastrearPopupOportunidade(nomeEvento: 'popup_oportunidade_exibido' | 'popup_oportunidade_clique'): void {
      const gtag = (window as any).gtag;

      if (!gtag) {
        return;
      }

      gtag('event', nomeEvento, {
        origem: 'popup_inicial',
        pagina: 'catalogo_ap'
      });
    }


  }
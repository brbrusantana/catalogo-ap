//import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Component, HostListener, signal } from '@angular/core';

type StatusProduto =
  | 'Disponível'
  | 'Reservado'
  | 'Vendido'
  | 'Indisponível';

type CategoriaComodo =
  | 'Dormitório'
  | 'Sala'
  | 'Cozinha'
  | 'Lavanderia'
  | 'Escritório';

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
};

@Component({
  selector: 'app-root',
  imports: [FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('Catálogo de Venda: Desapego do Bruno');

  statusSelecionado = 'Todos';
  comodoSelecionado = 'Todos';

  statusOptions = ['Todos', 'Disponível', 'Reservado', 'Vendido', 'Indisponível'];
  comodoOptions = ['Todos', 'Dormitório', 'Sala', 'Cozinha', 'Lavanderia', 'Escritório'];

  pesquisa = '';
ordenacaoSelecionada = 'Relevância';

ordenacaoOptions = [
  'Relevância',
  'Menor preço',
  'Maior preço',
  'Nome A-Z',
  'Nome Z-A'
];

get totalItens(): number {
  return this.produtos.length;
}

get totalDisponiveis(): number {
  return this.produtos.filter((produto) => produto.status === 'Disponível').length;
}

  produtos: Produto[] = [
    {
      id: 1,
      nome: 'Cama box casal',
      comodo: 'Suíte',
      categoriaComodo: 'Dormitório',
      valorOriginal: 'R$ 1.200,00',
      valorVenda: 'R$ 799,99',
      status: 'Disponível',
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
      valorVenda: 'R$ 1.499,00',
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
      linkMercadoLivre: 'https://produto.mercadolivre.com.br/MLB-4707063645'
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
      valorVenda: 'R$ 1.999,00',
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
      valorVenda: 'R$ 1.499,00',
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
      valorVenda: 'R$ 999,00',
      status: 'Disponível',
      imagem: 'assets/008-bicama-ortobom.png'
    },
    {
      id: 9,
      nome: 'Cadeira gamer Mymax MX5 vermelha',
      comodo: 'Escritório',
      categoriaComodo: 'Escritório',
      valorOriginal: 'R$ 1.500,00',
      valorVenda: 'R$ 899,00',
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
      valorVenda: 'R$ 1.399,00',
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
      status: 'Disponível',
      imagem: 'assets/014-sofa-cama-laila.png',
      linkMercadoLivre: 'https://produto.mercadolivre.com.br/MLB-6837463500'
    },
    {
      id: 15,
      nome: 'Mesa de jantar com 6 cadeiras',
      comodo: 'Sala',
      categoriaComodo: 'Sala',
      valorOriginal: 'R$ 999,00',
      valorVenda: 'R$ 599,00',
      status: 'Disponível',
      imagem: 'assets/015-mesa-jantar-6-cadeiras.png'
    },
    {
      id: 16,
      nome: 'Smart TV LG 49" UHD 4K',
      comodo: 'Sala',
      categoriaComodo: 'Sala',
      valorOriginal: 'R$ 1.850,00',
      valorVenda: 'R$ 1.299,00',
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
      valorVenda: 'R$ 899,00',
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
      valorVenda: 'R$ 899,00',
      status: 'Disponível',
      imagem: 'assets/018-microondas-electrolux.png',
      linkMercadoLivre: 'https://produto.mercadolivre.com.br/MLB-6837313382'
    },
    {
      id: 19,
      nome: 'Geladeira Electrolux inox',
      comodo: 'Cozinha',
      categoriaComodo: 'Cozinha',
      valorOriginal: 'R$ 2.200,00',
      valorVenda: 'R$ 1.790,00',
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
      valorVenda: 'R$ 1.790,00',
      status: 'Disponível',
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
      linkMercadoLivre: 'https://produto.mercadolivre.com.br/MLB-4714781733'
    }
  ];

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

  return resultado;
}

private valorNumerico(valor: string): number {
  return Number(
    valor
      .replace('R$', '')
      .replace(/\./g, '')
      .replace(',', '.')
      .trim()
  );
}

@HostListener('document:contextmenu', ['$event'])
bloquearBotaoDireito(event: MouseEvent): void {
  event.preventDefault();
  alert('Ops, não foi dessa vez, jovem!!! Acesso ao código-fonte indisponível.');
}

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

}
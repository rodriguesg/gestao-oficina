export interface Cliente {
  id: number;
  nome: string;
  telefone: string;
  cpf_cnpj: string;
  endereco: string;
}

export interface Veiculo {
  id: number;
  marca: string;
  modelo: string;
  placa: string;
  ano: number;
  cliente_id: number;
}

export interface Peca {
  id: number;
  nome: string;
  quantidade: number;
  valor_venda: number;
  codigo?: string;
}

export interface ItemPecaDetalhe {
  peca_id: number;
  nome_peca: string;
  quantidade: number;
  valor_unitario: number;
  subtotal: number;
}

export interface ItemServicoDetalhe {
  servico_id: number;
  descricao_servico: string;
  quantidade: number;
  valor_unitario: number;
  subtotal: number;
}

export interface OSDetalhada {
  id: number;
  numero_os?: number;
  data_abertura: string;
  status: 'ORCAMENTO' | 'EXECUCAO' | 'FINALIZADO';
  defeito_reclamado: string;
  pecas: ItemPecaDetalhe[];
  servicos: ItemServicoDetalhe[];
  total_geral: number;
  saldo_devedor: number;
}

export interface OSResumo {
  id: number;
  status: string;
  defeito_reclamado: string;
  data_abertura: string;
}
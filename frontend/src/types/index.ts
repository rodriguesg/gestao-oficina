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
  cor: string;
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
  data_fechamento?: string; 
  status: 'ORCAMENTO' | 'EXECUCAO' | 'FINALIZADO';
  defeito_reclamado: string;
  km_atual: number;
  
  veiculo_id: number;
  mecanico_id: number;

  pecas: ItemPecaDetalhe[];
  servicos: ItemServicoDetalhe[];
  pagamentos: any[]; 


  total_pecas: number; 
  total_servicos: number;
  total_geral: number;
  total_pago: number;
  saldo_devedor: number;
}

export interface OSResumo {
  id: number;
  status: string;
  defeito_reclamado: string;
  data_abertura: string;
}

export interface Despesa {
    id: number;
    descricao: string;
    valor: number;
    data_vencimento: string;
    categoria: string;
    status: 'PAGO' | 'PENDENTE';
}

export interface ResumoFinanceiro {
    total_receitas: number;
    total_despesas: number;
    saldo: number;
}
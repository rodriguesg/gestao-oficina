import { useEffect, useState } from 'react'
import {
  Box, Flex, Heading, Text, Badge, Button, Grid, VStack,
  useColorModeValue, HStack, Spacer,
  useToast, Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalBody, ModalCloseButton, FormControl, FormLabel, Input,
  Table, Thead, Tbody, Tr, Th, Td, TableContainer, Select, Icon, useDisclosure, Checkbox, Divider
} from '@chakra-ui/react'
import { CheckCircleIcon } from '@chakra-ui/icons'
import { FaTools, FaClock, FaPlus } from 'react-icons/fa'
import axios from 'axios'

// --- Interfaces ---

interface ItemPecaDetalhe {
  peca_id?: number; // Pode ser nulo se for avulso
  nome_peca: string;
  quantidade: number;
  valor_unitario: number;
  subtotal: number;
}

interface ItemServicoDetalhe {
    servico_id: number;
    nome?: string; 
    valor?: number;
}

interface OSDetalhada {
  id: number;
  data_abertura: string;
  status: string; 
  defeito_reclamado: string; 
  pecas: ItemPecaDetalhe[];     
  servicos: ItemServicoDetalhe[]; 
}

interface OSResumo {
  id: number;
  status: string;
  defeito_reclamado: string;
  data_abertura: string;
}

interface PecaEstoque {
  id: number;
  nome: string;
  quantidade: number;
  valor_venda: number;
}

// Configuração de Cores
const STATUS_CONFIG: any = {
  "ORCAMENTO": { label: 'Orçamento', colorName: 'yellow', icon: FaClock },
  "EXECUCAO": { label: 'Execução', colorName: 'blue', icon: FaTools },
  "FINALIZADO": { label: 'Finalizado', colorName: 'green', icon: CheckCircleIcon },
}

export default function OrdensServico() {
  // --- Estados ---
  const [listaKanban, setListaKanban] = useState<OSResumo[]>([])
  const [estoque, setEstoque] = useState<PecaEstoque[]>([])
  const [osAtual, setOsAtual] = useState<OSDetalhada | null>(null)
  
  // --- Formulário Híbrido ---
  const [usarItemAvulso, setUsarItemAvulso] = useState(true) // Checkbox que define o modo
  
  // Campos
  const [idPecaSelecionada, setIdPecaSelecionada] = useState<string>("") // Se for estoque
  const [nomePecaAvulsa, setNomePecaAvulsa] = useState("")               // Se for avulso
  const [valorManual, setValorManual] = useState<number | string>(0)     // Se for avulso
  const [qtdPeca, setQtdPeca] = useState(1)

  const { isOpen, onOpen, onClose } = useDisclosure()
  const toast = useToast()

  // --- Cores e Estilos ---
  const bgPage = useColorModeValue('gray.50', 'gray.900')
  // Coluna do Kanban mais escura para destacar
  const bgColumn = useColorModeValue('gray.200', 'gray.700') 
  const bgCard = useColorModeValue('white', 'gray.800')
  const bgInput = useColorModeValue('white', 'gray.700')
  const borderColor = useColorModeValue('gray.300', 'gray.600')

  // --- API ---

  const carregarKanban = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/os/')
      setListaKanban(res.data)
    } catch (error) { console.error("Erro Kanban", error) }
  }

  const carregarEstoque = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/pecas/')
      setEstoque(res.data)
    } catch (error) { console.error("Erro Estoque", error) }
  }

  const carregarDetalhesOS = async (id: number) => {
    try {
      const res = await axios.get(`http://127.0.0.1:8000/os/${id}/detalhes`)
      setOsAtual(res.data)
    } catch (error) {
      toast({ title: 'Erro ao carregar detalhes', status: 'error' })
    }
  }

  useEffect(() => {
    carregarKanban()
    carregarEstoque()
  }, [])

  // --- Lógica Híbrida ---

  const aoAbrirModal = (id: number) => {
    setOsAtual(null)
    // Reseta form
    setUsarItemAvulso(true)
    setIdPecaSelecionada("")
    setNomePecaAvulsa("")
    setValorManual(0)
    setQtdPeca(1)
    
    onOpen()
    carregarDetalhesOS(id)
  }

  const handleAdicionarPeca = async () => {
    if (!osAtual) return

    let payload: any = {
        quantidade: Number(qtdPeca)
    }

    if (usarItemAvulso) {
        // MODO MANUAL (Compra na autopeças)
        if (!nomePecaAvulsa || !valorManual) {
            toast({ title: 'Preencha o nome e valor', status: 'warning' })
            return
        }
        payload.nome_peca = nomePecaAvulsa
        payload.valor_unitario = Number(valorManual)
        payload.peca_id = null // Indica pro backend ignorar estoque
    } else {
        // MODO ESTOQUE
        if (!idPecaSelecionada) {
            toast({ title: 'Selecione uma peça', status: 'warning' })
            return
        }
        payload.peca_id = Number(idPecaSelecionada)
    }

    try {
      await axios.post(`http://127.0.0.1:8000/os/${osAtual.id}/adicionar-peca`, payload)

      toast({ title: 'Item adicionado!', status: 'success', duration: 2000 })
      
      // Limpa inputs mantendo o modo
      setNomePecaAvulsa("")
      setValorManual(0)
      setIdPecaSelecionada("")
      setQtdPeca(1)
      
      await carregarDetalhesOS(osAtual.id) 

    } catch (error) {
      console.error(error)
      toast({ title: 'Erro ao adicionar item', status: 'error' })
    }
  }

  // --- Renderização ---

  const KanbanColumn = ({ statusKey }: { statusKey: string }) => {
    const config = STATUS_CONFIG[statusKey]
    const itens = listaKanban.filter(os => os.status === statusKey)

    return (
      <Flex 
        direction="column" 
        bg={bgColumn} // Cor de fundo mais forte para a coluna
        p={4} 
        borderRadius="xl"
        border="1px solid"
        borderColor={borderColor}
        minH="500px" // Altura mínima para parecer uma "track"
        boxShadow="inner" // Sombra interna para dar profundidade
      >
        <Flex align="center" mb={4}>
            <Icon as={config.icon} mr={2} boxSize={5} color={`${config.colorName}.600`} />
            <Text fontWeight="extrabold" fontSize="sm" textTransform="uppercase" letterSpacing="wide" color={useColorModeValue(`${config.colorName}.600`, 'whiteAlpha.900')}>
                {config.label}
            </Text>
            <Spacer />
            <Badge borderRadius="full" px={3} py={1} colorScheme={config.colorName} fontSize="0.8em">
                {itens.length}
            </Badge>
        </Flex>

        <VStack spacing={4} align="stretch">
            {itens.map(os => (
                <Box 
                    key={os.id} 
                    bg={bgCard} 
                    p={4} 
                    borderRadius="lg" 
                    boxShadow="md" // Card salta para fora
                    cursor="pointer"
                    onClick={() => aoAbrirModal(os.id)}
                    borderLeft="5px solid" 
                    borderLeftColor={
                        statusKey === 'ORCAMENTO' ? 'yellow.400' : 
                        statusKey === 'EXECUCAO' ? 'blue.400' : 'green.400'
                    }
                    _hover={{ transform: 'translateY(-3px)', boxShadow: 'lg', transition: '0.2s' }}
                >
                    <Flex justify="space-between" mb={2}>
                        <Badge variant="subtle">OS #{os.id}</Badge>
                        <Text fontSize="xs" fontWeight="bold" color="gray.500">
                            {new Date(os.data_abertura).toLocaleDateString()}
                        </Text>
                    </Flex>
                    <Text fontWeight="bold" fontSize="md" color="gray.700">
                        {os.defeito_reclamado}
                    </Text>
                </Box>
            ))}
        </VStack>
      </Flex>
    )
  }

  return (
    <Box p={6} bg={bgPage} minH="100vh">
      <Heading size="lg" mb={8} color={useColorModeValue('gray.900', 'whiteAlpha.900')}>Gestão de Oficina</Heading>

      <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={8}>
        <KanbanColumn statusKey="ORCAMENTO" />
        <KanbanColumn statusKey="EXECUCAO" />
        <KanbanColumn statusKey="FINALIZADO" />
      </Grid>

      {/* MODAL DETALHES */}
      <Modal isOpen={isOpen} onClose={onClose} size="4xl" scrollBehavior="inside">
        <ModalOverlay backdropFilter="blur(5px)" />
        <ModalContent bg={bgCard}>
          <ModalHeader borderBottom="1px solid" borderColor={borderColor} bg={useColorModeValue('blue.50', 'whiteAlpha.200')} >
            <HStack>
                <Text fontSize="lg">OS #{osAtual?.id}</Text>
                {osAtual && (
                  <Badge colorScheme={STATUS_CONFIG[osAtual.status]?.colorName || 'gray'} fontSize="0.9em">
                    {osAtual.status}
                  </Badge>
                )}
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          
          <ModalBody py={6} px={8}>
            {!osAtual ? (
              <Flex justify="center" p={10}><Text>Carregando dados...</Text></Flex>
            ) : (
              <VStack spacing={8} align="stretch">
                
                {/* --- ÁREA DE ADICIONAR ITEM --- */}
                <Box 
                    p={6} 
                    bg={useColorModeValue('blue.50', 'whiteAlpha.200')} 
                    borderRadius="xl" 
                    border="1px dashed" 
                    borderColor="blue.300"
                >
                  <Flex justify="space-between" align="center" mb={4}>
                      <Text fontSize="md" fontWeight="bold" color={useColorModeValue('gray.700', 'whiteAlpha.200')}>
                        ADICIONAR PEÇA / MATERIAL
                      </Text>
                      
                      {/* SWITCH DE MODO */}
                      <Checkbox 
                        colorScheme="blue" 
                        isChecked={usarItemAvulso}
                        onChange={(e) => setUsarItemAvulso(e.target.checked)}
                        fontWeight="bold"
                        borderColor="blue.400"
                      >
                        Item avulso / Comprado fora
                      </Checkbox>
                  </Flex>
                  
                  <Flex gap={4} align="flex-end" direction={{ base: 'column', md: 'row' }}>
                    
                    {usarItemAvulso ? (
                        // MODO AVULSO (TEXTO LIVRE)
                        <>
                            <FormControl flex="2">
                                <FormLabel fontSize="xs" fontWeight="bold">Descrição do Item (Avulso)</FormLabel>
                                <Input 
                                    bg={bgInput} 
                                    placeholder="Ex: Óleo comprado na esquina..."
                                    value={nomePecaAvulsa}
                                    onChange={e => setNomePecaAvulsa(e.target.value)}
                                    autoFocus
                                />
                            </FormControl>
                            <FormControl w={{ base: '100%', md: '150px' }}>
                                <FormLabel fontSize="xs" fontWeight="bold">Valor (R$)</FormLabel>
                                <Input 
                                    bg={bgInput} 
                                    type="number"
                                    placeholder="0.00"
                                    value={valorManual}
                                    onChange={e => setValorManual(e.target.value)}
                                />
                            </FormControl>
                        </>
                    ) : (
                        // MODO ESTOQUE (SELECT)
                        <FormControl flex="2">
                            <FormLabel fontSize="xs" fontWeight="bold">Selecionar do Estoque</FormLabel>
                            <Select 
                                placeholder="Selecione..." 
                                bg={bgInput} 
                                value={idPecaSelecionada}
                                onChange={e => setIdPecaSelecionada(e.target.value)}
                            >
                                {estoque.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.nome} (Est: {p.quantidade}) - R$ {p.valor_venda}
                                </option>
                                ))}
                            </Select>
                        </FormControl>
                    )}

                    <FormControl w={{ base: '100%', md: '100px' }}>
                      <FormLabel fontSize="xs" fontWeight="bold">Qtd</FormLabel>
                      <Input 
                        type="number" 
                        bg={bgInput} 
                        value={qtdPeca}
                        onChange={e => setQtdPeca(Number(e.target.value))}
                      />
                    </FormControl>

                    <Button 
                      colorScheme="blue" 
                      px={8} 
                      onClick={handleAdicionarPeca}
                      leftIcon={<FaPlus />}
                    >
                      Adicionar
                    </Button>
                  </Flex>
                </Box>

                <Divider />

                {/* --- LISTAGEM DE ITENS --- */}
                <Box>
                  <Heading size="sm" mb={4} color="gray.600" textTransform="uppercase">
                    Peças & Materiais
                  </Heading>
                  <TableContainer border="1px solid" borderColor={borderColor} borderRadius="lg" bg={bgInput}>
                    <Table size="md" variant="simple">
                      <Thead bg={useColorModeValue('gray.100', 'gray.900')}>
                        <Tr>
                          <Th>Descrição</Th>
                          <Th isNumeric>Qtd</Th>
                          <Th isNumeric>Unit.</Th>
                          <Th isNumeric>Total</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {osAtual.pecas?.length > 0 ? (
                          osAtual.pecas.map((item, idx) => (
                            <Tr key={idx}>
                              <Td fontWeight="medium">
                                {item.nome_peca}
                                {!item.peca_id && <Badge ml={2} colorScheme="orange" fontSize="0.7em">AVULSO</Badge>}
                              </Td>
                              <Td isNumeric>{item.quantidade}</Td>
                              <Td isNumeric>R$ {item.valor_unitario}</Td>
                              <Td isNumeric fontWeight="bold" color="green.600">R$ {item.subtotal}</Td>
                            </Tr>
                          ))
                        ) : (
                          <Tr><Td colSpan={4} textAlign="center" py={8} color="gray.500">Nenhum material lançado.</Td></Tr>
                        )}
                      </Tbody>
                    </Table>
                  </TableContainer>
                </Box>

                <Box>
                  <Heading size="sm" mb={4} color="gray.600" textTransform="uppercase">
                    Mão de Obra
                  </Heading>
                  <TableContainer border="1px solid" borderColor={borderColor} borderRadius="lg" bg={bgInput}>
                    <Table size="md" variant="simple">
                        <Thead bg={useColorModeValue('gray.100', 'gray.900')}>
                            <Tr>
                                <Th>Serviço</Th>
                                <Th isNumeric>Valor</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {osAtual.servicos?.length > 0 ? (
                                osAtual.servicos.map((serv, idx) => (
                                    <Tr key={idx}>
                                        <Td>Serviço #{serv.servico_id}</Td>
                                        <Td isNumeric>-</Td>
                                    </Tr>
                                ))
                            ) : (
                                <Tr><Td colSpan={2} textAlign="center" py={6} color="gray.500">Nenhum serviço lançado.</Td></Tr>
                            )}
                        </Tbody>
                    </Table>
                  </TableContainer>
                </Box>

              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  )
}
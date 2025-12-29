import { useEffect, useState } from 'react'
import {
  Box, Flex, Heading, Text, Badge, Button, Grid, VStack,
  useColorModeValue, HStack, Spacer,
  useToast, Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalBody, ModalCloseButton, FormControl, FormLabel, Input,
  Table, Thead, Tbody, Tr, Th, Td, TableContainer, Select, Icon, useDisclosure, Divider, IconButton
} from '@chakra-ui/react'
import { CheckCircleIcon, DeleteIcon } from '@chakra-ui/icons'
import { FaTools, FaClock, FaWrench, FaBoxOpen, FaMoneyBillWave } from 'react-icons/fa'
import api from '../services/api'
import type { OSResumo, OSDetalhada, Peca } from '../types'
import NovaOSModal from '../components/NovaOSModal'
import { FaPlus } from 'react-icons/fa6'

interface Servico {
    id: number;
    descricao: string;
    valor_mao_obra: number;
}

const STATUS_CONFIG: any = {
  "ORCAMENTO": { label: 'Orçamento', colorName: 'yellow', icon: FaClock },
  "EXECUCAO": { label: 'Execução', colorName: 'blue', icon: FaTools },
  "FINALIZADO": { label: 'Finalizado', colorName: 'green', icon: CheckCircleIcon },
}

export default function OrdensServico() {
   
  const [listaKanban, setListaKanban] = useState<OSResumo[]>([])
  const [estoque, setEstoque] = useState<Peca[]>([])
  const [servicosDisponiveis, setServicosDisponiveis] = useState<Servico[]>([])
  const [osAtual, setOsAtual] = useState<OSDetalhada | null>(null)
  
  const [idPecaSelecionada, setIdPecaSelecionada] = useState<string>("") 
  const [qtdPeca, setQtdPeca] = useState(1)
  
  const [idServicoSelecionado, setIdServicoSelecionado] = useState<string>("")
  const [precoServico, setPrecoServico] = useState<number>(0)

  // Drag and Drop
  const [draggedOsId, setDraggedOsId] = useState<number | null>(null)

  const { 
    isOpen, 
    onOpen, 
    onClose 
  } = useDisclosure()
  const { 
      isOpen: isNovaOSOpen, 
      onOpen: onNovaOSOpen, 
      onClose: onNovaOSClose 
  } = useDisclosure()
  const toast = useToast()

  // Estilos
  const bgPage = useColorModeValue('gray.50', 'gray.900')
  const bgColumn = useColorModeValue('gray.100', 'gray.800') 
  const bgCard = useColorModeValue('white', 'gray.700')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const sectionBg = useColorModeValue('gray.50', 'whiteAlpha.50')

  // --- CARREGAMENTO ---
  const carregarDados = async () => {
    try {
      const [resKanban, resEstoque, resServicos] = await Promise.all([
        api.get<OSResumo[]>('/os/'),
        api.get<Peca[]>('/pecas/'),
        api.get<Servico[]>('/servicos/')
      ])
      setListaKanban(resKanban.data)
      setEstoque(resEstoque.data)
      setServicosDisponiveis(resServicos.data)
    } catch (error) { console.error("Erro ao carregar dados", error) }
  }

  const carregarDetalhesOS = async (id: number) => {
    try {
      const { data } = await api.get<OSDetalhada>(`/os/${id}/detalhes`)
      setOsAtual(data)
    } catch (error) {
      toast({ title: 'Erro ao carregar detalhes', status: 'error' })
    }
  }

  useEffect(() => { carregarDados() }, [])

  // --- AÇÕES ---
  const aoAbrirModal = (id: number) => {
    setOsAtual(null)
    setIdPecaSelecionada(""); setQtdPeca(1);
    setIdServicoSelecionado(""); setPrecoServico(0);
    onOpen()
    carregarDetalhesOS(id)
  }

  const handleAdicionarPeca = async () => {
    if (!osAtual || !idPecaSelecionada) return
    try {
      await api.post(`/os/${osAtual.id}/adicionar-peca`, {
          peca_id: Number(idPecaSelecionada),
          quantidade: Number(qtdPeca)
      })
      toast({ title: 'Peça adicionada!', status: 'success' })
      setIdPecaSelecionada(""); setQtdPeca(1);
      await carregarDetalhesOS(osAtual.id) 
    } catch (error: any) {
      toast({ title: 'Erro', description: error.response?.data?.detail, status: 'error' })
    }
  }

  const handleRemoverPeca = async (pecaId: number) => {
      if(!osAtual || !confirm("Remover esta peça e devolver ao estoque?")) return
      try {
          // Rota: DELETE /os/{os_id}/pecas/{peca_id}
          await api.delete(`/os/${osAtual.id}/pecas/${pecaId}`)
          toast({ title: 'Peça removida', status: 'info' })
          await carregarDetalhesOS(osAtual.id)
      } catch (error) {
          toast({ title: 'Erro ao remover', status: 'error' })
      }
  }

  const handleAdicionarServico = async () => {
      if (!osAtual || !idServicoSelecionado) return
      try {
          await api.post(`/os/${osAtual.id}/adicionar-servico/`, {
              servico_id: Number(idServicoSelecionado),
              quantidade: 1,
              valor: Number(precoServico)
          })
          toast({ title: 'Serviço adicionado!', status: 'success' })
          setIdServicoSelecionado(""); setPrecoServico(0);
          await carregarDetalhesOS(osAtual.id)
      } catch (error: any) {
          toast({ title: 'Erro', description: error.response?.data?.detail, status: 'error' })
      }
  }

  const handleRemoverServico = async (servicoId: number) => {
    if(!osAtual || !confirm("Remover este serviço?")) return
    try {
        await api.delete(`/os/${osAtual.id}/servicos/${servicoId}`)
        toast({ title: 'Serviço removido', status: 'info' })
        await carregarDetalhesOS(osAtual.id)
    } catch (error) {
        toast({ title: 'Erro ao remover', status: 'error' })
    }
  }

  const handleMudarStatus = async (novoStatus: string, id: number = osAtual?.id || 0) => {
      try {
          await api.patch(`/os/${id}/status`, { status: novoStatus })
          toast({ title: 'Status atualizado', status: 'info', duration: 1000 })
          if (osAtual && osAtual.id === id) {
             setOsAtual({ ...osAtual, status: novoStatus as any })
          }
          carregarDados()
      } catch (error) {
          toast({ title: 'Erro ao mudar status', status: 'error' })
      }
  }

  // --- DRAG AND DROP ---
  const onDragStart = (e: React.DragEvent, id: number) => {
      setDraggedOsId(id)
      e.dataTransfer.effectAllowed = "move"
  }
  const onDragOver = (e: React.DragEvent) => { e.preventDefault() }
  const onDrop = async (e: React.DragEvent, novoStatus: string) => {
      e.preventDefault()
      if (draggedOsId) {
          setListaKanban(prev => prev.map(os => os.id === draggedOsId ? { ...os, status: novoStatus } : os))
          await handleMudarStatus(novoStatus, draggedOsId)
          setDraggedOsId(null)
      }
  }

  // --- RENDER ---
  const KanbanColumn = ({ statusKey }: { statusKey: string }) => {
    const config = STATUS_CONFIG[statusKey]
    const itens = listaKanban.filter(os => os.status === statusKey)

    return (
      <Flex 
        direction="column" bg={bgColumn} p={4} borderRadius="xl" 
        border="1px solid" borderColor={borderColor} minH="600px"
        onDragOver={onDragOver}
        onDrop={(e) => onDrop(e, statusKey)}
        transition="all 0.2s"
        _hover={{ borderColor: `${config.colorName}.300`, boxShadow: 'sm' }}
      >
        <Flex align="center" mb={4}>
            <Icon as={config.icon} mr={2} boxSize={5} color={`${config.colorName}.500`} />
            <Text fontWeight="extrabold" fontSize="sm" letterSpacing="wide" color="gray.500" textTransform="uppercase">
                {config.label}
            </Text>
            <Spacer />
            <Badge borderRadius="full" px={2} colorScheme={config.colorName}>{itens.length}</Badge>
        </Flex>

        <VStack spacing={3} align="stretch">
            {itens.map(os => (
                <Box 
                    key={os.id} draggable onDragStart={(e) => onDragStart(e, os.id)}
                    bg={bgCard} p={4} borderRadius="lg" boxShadow="sm" cursor="grab"
                    onClick={() => aoAbrirModal(os.id)}
                    borderLeft="4px solid" borderLeftColor={`${config.colorName}.400`}
                    _hover={{ transform: 'translateY(-2px)', boxShadow: 'md' }}
                    _active={{ cursor: 'grabbing' }}
                    transition="all 0.2s"
                >
                    <Flex justify="space-between" mb={2}>
                        <Badge variant="subtle" fontSize="0.7em">OS #{os.id}</Badge>
                        <Text fontSize="xs" color="gray.500">{new Date(os.data_abertura).toLocaleDateString()}</Text>
                    </Flex>
                    <Text fontWeight="bold" fontSize="sm" noOfLines={2}>{os.defeito_reclamado}</Text>
                </Box>
            ))}
        </VStack>
      </Flex>
    )
  }

  return (
    <Box p={6} bg={bgPage} minH="100vh">
      <Flex mb={8} align="center">
        <Heading size="lg">Gestão de Oficina</Heading>
        <Spacer />
        {}
        <Button leftIcon={<FaPlus />} colorScheme="brand" onClick={onNovaOSOpen}>
            Nova OS
        </Button>
      </Flex>

      <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={6}>
        <KanbanColumn statusKey="ORCAMENTO" />
        <KanbanColumn statusKey="EXECUCAO" />
        <KanbanColumn statusKey="FINALIZADO" />
      </Grid>

      {/* --- MODAL DETALHES --- */}
      <Modal isOpen={isOpen} onClose={onClose} size="4xl" scrollBehavior="inside">
        <ModalOverlay backdropFilter="blur(5px)" />
        <ModalContent bg={useColorModeValue('white', 'gray.800')}>
          
          <ModalHeader borderBottom="1px solid" borderColor={borderColor} pr={12}>
            <Flex align="center" justify="space-between" wrap="wrap" gap={4}>
                <HStack>
                    <Text fontSize="xl">OS #{osAtual?.id}</Text>
                    {osAtual && <Badge fontSize="0.8em" colorScheme={STATUS_CONFIG[osAtual.status]?.colorName}>{osAtual.status}</Badge>}
                </HStack>
                
                {osAtual && (
                    <Select 
                        w="180px" size="sm" 
                        value={osAtual.status} 
                        onChange={(e) => handleMudarStatus(e.target.value)}
                        variant="filled" borderRadius="md"
                    >
                        <option value="ORCAMENTO">Orçamento</option>
                        <option value="EXECUCAO">Em Execução</option>
                        <option value="FINALIZADO">Finalizado</option>
                    </Select>
                )}
            </Flex>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody py={6} px={8}>
            {!osAtual ? <Text>Carregando...</Text> : (
              <VStack spacing={8} align="stretch">
                
                {/* --- SEÇÃO 1: PEÇAS --- */}
                <Box>
                    <Flex align="center" mb={4}>
                        <Icon as={FaBoxOpen} color="blue.500" mr={2} />
                        <Heading size="sm" textTransform="uppercase" color="gray.500">Peças Utilizadas</Heading>
                    </Flex>
                    
                    {/* Form Peças */}
                    <Flex gap={2} mb={4} align="flex-end" bg={sectionBg} p={3} borderRadius="md">
                        <FormControl>
                            <FormLabel fontSize="xs">Selecionar do Estoque</FormLabel>
                            <Select placeholder="Escolha a peça..." size="sm" value={idPecaSelecionada} onChange={e => setIdPecaSelecionada(e.target.value)}>
                                {estoque.map(p => (
                                    <option key={p.id} value={p.id}>{p.nome} (Disp: {p.quantidade}) - R$ {p.valor_venda}</option>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl w="80px">
                            <FormLabel fontSize="xs">Qtd</FormLabel>
                            <Input type="number" size="sm" value={qtdPeca} onChange={e => setQtdPeca(Number(e.target.value))} />
                        </FormControl>
                        <Button size="sm" colorScheme="blue" onClick={handleAdicionarPeca}>Incluir</Button>
                    </Flex>

                    {/* Tabela Peças */}
                    <TableContainer border="1px solid" borderColor={borderColor} borderRadius="md">
                        <Table size="sm" variant="simple">
                            <Thead bg={useColorModeValue('gray.50', 'gray.700')}>
                                <Tr><Th>Item</Th><Th isNumeric>Qtd</Th><Th isNumeric>Unit.</Th><Th isNumeric>Total</Th><Th isNumeric>Ação</Th></Tr>
                            </Thead>
                            <Tbody>
                                {osAtual.pecas.map((p, i) => (
                                    <Tr key={i}>
                                        <Td>{p.nome_peca}</Td>
                                        <Td isNumeric>{p.quantidade}</Td>
                                        <Td isNumeric>R$ {p.valor_unitario}</Td>
                                        <Td isNumeric fontWeight="bold">R$ {p.subtotal}</Td>
                                        <Td isNumeric>
                                            {/* BOTÃO REMOVER PEÇA */}
                                            {p.peca_id && (
                                                <IconButton 
                                                    aria-label="Remover" 
                                                    icon={<DeleteIcon />} 
                                                    size="xs" 
                                                    colorScheme="red" 
                                                    variant="ghost" 
                                                    onClick={() => handleRemoverPeca(p.peca_id!)}
                                                />
                                            )}
                                        </Td>
                                    </Tr>
                                ))}
                                {osAtual.pecas.length === 0 && <Tr><Td colSpan={5} textAlign="center" color="gray.500">Nenhuma peça adicionada.</Td></Tr>}
                            </Tbody>
                        </Table>
                    </TableContainer>
                </Box>

                <Divider />

                {/* --- SEÇÃO 2: SERVIÇOS --- */}
                <Box>
                    <Flex align="center" mb={4}>
                        <Icon as={FaWrench} color="teal.500" mr={2} />
                        <Heading size="sm" textTransform="uppercase" color="gray.500">Serviços / Mão de Obra</Heading>
                    </Flex>

                    {/* Form Serviços */}
                    <Flex gap={2} mb={4} align="flex-end" bg={sectionBg} p={3} borderRadius="md">
                        <FormControl>
                            <FormLabel fontSize="xs">Tipo de Serviço</FormLabel>
                            <Select placeholder="Escolha o serviço..." size="sm" value={idServicoSelecionado} 
                                onChange={e => {
                                    const id = e.target.value;
                                    setIdServicoSelecionado(id);
                                    const serv = servicosDisponiveis.find(s => s.id === Number(id));
                                    if(serv) setPrecoServico(serv.valor_mao_obra);
                                }}>
                                {servicosDisponiveis.map(s => (
                                    <option key={s.id} value={s.id}>{s.descricao}</option>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl w="120px">
                            <FormLabel fontSize="xs">Valor (R$)</FormLabel>
                            <Input type="number" size="sm" value={precoServico} onChange={e => setPrecoServico(Number(e.target.value))} />
                        </FormControl>
                        <Button size="sm" colorScheme="teal" onClick={handleAdicionarServico}>Incluir</Button>
                    </Flex>

                    {/* Tabela Serviços */}
                    <TableContainer border="1px solid" borderColor={borderColor} borderRadius="md">
                        <Table size="sm" variant="simple">
                            <Thead bg={useColorModeValue('gray.50', 'gray.700')}>
                                <Tr><Th>Descrição</Th><Th isNumeric>Valor</Th><Th isNumeric>Ação</Th></Tr>
                            </Thead>
                            <Tbody>
                                {osAtual.servicos.map((s, i) => (
                                    <Tr key={i}>
                                        <Td>{s.descricao_servico}</Td>
                                        <Td isNumeric fontWeight="bold">R$ {s.subtotal}</Td>
                                        <Td isNumeric>
                                            {/* BOTÃO REMOVER SERVIÇO */}
                                            <IconButton 
                                                aria-label="Remover" 
                                                icon={<DeleteIcon />} 
                                                size="xs" 
                                                colorScheme="red" 
                                                variant="ghost" 
                                                onClick={() => handleRemoverServico(s.servico_id)}
                                            />
                                        </Td>
                                    </Tr>
                                ))}
                                {osAtual.servicos.length === 0 && <Tr><Td colSpan={3} textAlign="center" color="gray.500">Nenhum serviço adicionado.</Td></Tr>}
                            </Tbody>
                        </Table>
                    </TableContainer>
                </Box>

                <Divider />

                {/* --- SEÇÃO 3: FINANCEIRO --- */}
                <Box>
                    <Flex align="center" mb={4}>
                        <Icon as={FaMoneyBillWave} color="green.500" mr={2} />
                        <Heading size="sm" textTransform="uppercase" color="gray.500">Resumo Financeiro</Heading>
                    </Flex>

                    <Flex 
                        direction={{ base: 'column', md: 'row' }} 
                        justify="space-between" 
                        align="center" 
                        bg={useColorModeValue('gray.100', 'whiteAlpha.100')} 
                        p={5} 
                        borderRadius="lg"
                        border="1px solid" borderColor={borderColor}
                    >
                        <VStack align="start" spacing={0}>
                            <Text fontSize="xs" color="gray.500" textTransform="uppercase">Peças</Text>
                            <Text fontSize="lg" fontWeight="bold">R$ {osAtual.total_pecas?.toFixed(2) || '0.00'}</Text>
                        </VStack>
                        
                        <Text fontSize="2xl" color="gray.300" display={{ base: 'none', md: 'block' }}>+</Text>

                        <VStack align="start" spacing={0}>
                            <Text fontSize="xs" color="gray.500" textTransform="uppercase">Mão de Obra</Text>
                            <Text fontSize="lg" fontWeight="bold">R$ {osAtual.total_servicos?.toFixed(2) || '0.00'}</Text>
                        </VStack>

                        <Text fontSize="2xl" color="gray.300" display={{ base: 'none', md: 'block' }}>=</Text>

                        <VStack align="end" spacing={0}>
                            <Text fontSize="sm" color="gray.500" textTransform="uppercase">Total Geral</Text>
                            <Heading size="lg" color="green.500">R$ {osAtual.total_geral?.toFixed(2) || '0.00'}</Heading>
                        </VStack>
                    </Flex>
                </Box>

              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
      <NovaOSModal isOpen={isNovaOSOpen} onClose={onNovaOSClose} onSuccess={carregarDados} />
    </Box>
  )
}
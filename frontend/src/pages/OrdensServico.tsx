import { useEffect, useState } from 'react'
import {
  Box, Flex, Heading, Text, Badge, Button, Grid, VStack,
  useColorModeValue, HStack, Spacer,
  useToast, Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalBody, ModalCloseButton, FormControl, FormLabel, Input,
  Table, Thead, Tbody, Tr, Th, Td, TableContainer, Select, Icon, useDisclosure, Divider
} from '@chakra-ui/react'
import { CheckCircleIcon } from '@chakra-ui/icons'
import { FaTools, FaClock, FaPlus } from 'react-icons/fa'
import api from '../services/api'
import type { OSResumo, OSDetalhada, Peca } from '../types'

const STATUS_CONFIG: any = {
  "ORCAMENTO": { label: 'Orçamento', colorName: 'yellow', icon: FaClock },
  "EXECUCAO": { label: 'Execução', colorName: 'blue', icon: FaTools },
  "FINALIZADO": { label: 'Finalizado', colorName: 'green', icon: CheckCircleIcon },
}

export default function OrdensServico() {
  const [listaKanban, setListaKanban] = useState<OSResumo[]>([])
  const [estoque, setEstoque] = useState<Peca[]>([])
  const [osAtual, setOsAtual] = useState<OSDetalhada | null>(null)
  
  const [idPecaSelecionada, setIdPecaSelecionada] = useState<string>("") 
  const [qtdPeca, setQtdPeca] = useState(1)

  const { isOpen, onOpen, onClose } = useDisclosure()
  const toast = useToast()

  const bgPage = useColorModeValue('gray.50', 'gray.900')
  const bgColumn = useColorModeValue('gray.200', 'gray.700') 
  const bgCard = useColorModeValue('white', 'gray.800')
  const bgInput = useColorModeValue('white', 'gray.700')
  const borderColor = useColorModeValue('gray.300', 'gray.600')

  const carregarKanban = async () => {
    try {
      const { data } = await api.get<OSResumo[]>('/os/')
      setListaKanban(data)
    } catch (error) { console.error("Erro Kanban", error) }
  }

  const carregarEstoque = async () => {
    try {
      const { data } = await api.get<Peca[]>('/pecas/')
      setEstoque(data)
    } catch (error) { console.error("Erro Estoque", error) }
  }

  const carregarDetalhesOS = async (id: number) => {
    try {
      const { data } = await api.get<OSDetalhada>(`/os/${id}/detalhes`)
      setOsAtual(data)
    } catch (error) {
      toast({ title: 'Erro ao carregar detalhes', status: 'error' })
    }
  }

  useEffect(() => {
    carregarKanban()
    carregarEstoque()
  }, [])

  const aoAbrirModal = (id: number) => {
    setOsAtual(null)
    setIdPecaSelecionada("")
    setQtdPeca(1)
    onOpen()
    carregarDetalhesOS(id)
  }

  const handleAdicionarPeca = async () => {
    if (!osAtual || !idPecaSelecionada) {
        toast({ title: 'Selecione uma peça', status: 'warning' })
        return
    }

    try {
      await api.post(`/os/${osAtual.id}/adicionar-peca`, {
          peca_id: Number(idPecaSelecionada),
          quantidade: Number(qtdPeca)
      })

      toast({ title: 'Peça adicionada!', status: 'success', duration: 2000 })
      
      setIdPecaSelecionada("")
      setQtdPeca(1)
      await carregarDetalhesOS(osAtual.id) 

    } catch (error: any) {
      const msg = error.response?.data?.detail || 'Erro ao adicionar item'
      toast({ title: 'Erro', description: msg, status: 'error' })
    }
  }

  const KanbanColumn = ({ statusKey }: { statusKey: string }) => {
    const config = STATUS_CONFIG[statusKey]
    const itens = listaKanban.filter(os => os.status === statusKey)

    return (
      <Flex direction="column" bg={bgColumn} p={4} borderRadius="xl" border="1px solid" borderColor={borderColor} minH="500px">
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
                    key={os.id} bg={bgCard} p={4} borderRadius="lg" boxShadow="md" cursor="pointer"
                    onClick={() => aoAbrirModal(os.id)}
                    borderLeft="5px solid" 
                    borderLeftColor={`${config.colorName}.400`}
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

      <Modal isOpen={isOpen} onClose={onClose} size="4xl" scrollBehavior="inside">
        <ModalOverlay backdropFilter="blur(5px)" />
        <ModalContent bg={bgCard}>
          <ModalHeader borderBottom="1px solid" borderColor={borderColor} bg={useColorModeValue('blue.50', 'whiteAlpha.200')} >
            <HStack>
                <Text fontSize="lg">OS #{osAtual?.id}</Text>
                {osAtual && (
                  <Badge colorScheme={STATUS_CONFIG[osAtual.status]?.colorName || 'gray'}>
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
                
                {/* --- ÁREA DE ADICIONAR ITEM (Agora só estoque) --- */}
                {osAtual.status !== 'FINALIZADO' && (
                    <Box p={6} bg={useColorModeValue('blue.50', 'whiteAlpha.200')} borderRadius="xl" border="1px dashed" borderColor="blue.300">
                    <Text fontSize="md" fontWeight="bold" mb={4} color={useColorModeValue('gray.700', 'whiteAlpha.200')}>
                        ADICIONAR PEÇA DO ESTOQUE
                    </Text>
                    
                    <Flex gap={4} align="flex-end" direction={{ base: 'column', md: 'row' }}>
                        <FormControl flex="2">
                            <FormLabel fontSize="xs" fontWeight="bold">Peça</FormLabel>
                            <Select 
                                placeholder="Selecione..." 
                                bg={bgInput} 
                                value={idPecaSelecionada}
                                onChange={e => setIdPecaSelecionada(e.target.value)}
                            >
                                {estoque.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.nome} (Disp: {p.quantidade}) - R$ {p.valor_venda}
                                </option>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl w={{ base: '100%', md: '100px' }}>
                        <FormLabel fontSize="xs" fontWeight="bold">Qtd</FormLabel>
                        <Input 
                            type="number" 
                            bg={bgInput} 
                            value={qtdPeca}
                            onChange={e => setQtdPeca(Number(e.target.value))}
                        />
                        </FormControl>

                        <Button colorScheme="blue" px={8} onClick={handleAdicionarPeca} leftIcon={<FaPlus />}>
                        Adicionar
                        </Button>
                    </Flex>
                    </Box>
                )}

                <Divider />

                {/* --- LISTAGEM DE ITENS --- */}
                <Box>
                  <Heading size="sm" mb={4} color="gray.600" textTransform="uppercase">Peças & Materiais</Heading>
                  <TableContainer border="1px solid" borderColor={borderColor} borderRadius="lg" bg={bgInput}>
                    <Table size="md" variant="simple">
                      <Thead bg={useColorModeValue('gray.100', 'gray.900')}>
                        <Tr><Th>Descrição</Th><Th isNumeric>Qtd</Th><Th isNumeric>Unit.</Th><Th isNumeric>Total</Th></Tr>
                      </Thead>
                      <Tbody>
                        {osAtual.pecas?.length > 0 ? (
                          osAtual.pecas.map((item, idx) => (
                            <Tr key={idx}>
                              <Td fontWeight="medium">{item.nome_peca}</Td>
                              <Td isNumeric>{item.quantidade}</Td>
                              <Td isNumeric>R$ {item.valor_unitario}</Td>
                              <Td isNumeric fontWeight="bold" color="green.600">R$ {item.subtotal}</Td>
                            </Tr>
                          ))
                        ) : (<Tr><Td colSpan={4} textAlign="center" py={8} color="gray.500">Nenhum material lançado.</Td></Tr>)}
                      </Tbody>
                    </Table>
                  </TableContainer>
                </Box>

                <HStack justify="flex-end" pt={4}>
                    <Text fontSize="lg">Total da OS:</Text>
                    <Heading size="md" color="blue.600">R$ {osAtual.total_geral.toFixed(2)}</Heading>
                </HStack>

              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  )
}
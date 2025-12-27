import { useEffect, useState } from 'react'
import {
  Box, Flex, Heading, Text, Badge, Button, Grid, VStack,
  useColorModeValue, IconButton, HStack, Avatar, Spacer,
  useToast, Menu, MenuButton, MenuList, MenuItem, Icon,
  useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalBody, ModalCloseButton, FormControl, FormLabel, Input,
  Tabs, TabList, TabPanels, Tab, TabPanel, Table, Thead, 
  Tbody, Tr, Th, Td, TableContainer
} from '@chakra-ui/react'
import { SettingsIcon, CheckCircleIcon } from '@chakra-ui/icons'
import { FaTools, FaMoneyBillWave, FaClock, FaPlus } from 'react-icons/fa'
import axios from 'axios'

interface Pagamento {
  valor: number;
}

interface OS {
  id: number;
  data_abertura: string;
  status: string; 
  defeito_reclamado: string; 
  cliente_id: number;
  veiculo_id: number;
  pagamentos: Pagamento[];
}

interface Peca {
  id: number;
  nome: string;
  quantidade: number;
  valor_venda: number;
}

const STATUS_CONFIG: any = {
  "ORCAMENTO": { label: 'Orçamento', color: 'yellow', icon: FaClock },
  "EXECUCAO": { label: 'Execução', color: 'blue', icon: FaTools },
  "FINALIZADO": { label: 'Finalizado', color: 'green', icon: CheckCircleIcon },
}

export default function OrdensServico() {
  const [listaOS, setListaOS] = useState<OS[]>([])
  const [osSelecionada, setOsSelecionada] = useState<OS | null>(null)
  
  const [estoque, setEstoque] = useState<Peca[]>([])
  const [sugestoes, setSugestoes] = useState<Peca[]>([])

  const [nomeItem, setNomeItem] = useState('')
  const [qtdItem, setQtdItem] = useState(1)
  const [valorUnitario, setValorUnitario] = useState(0)
  const [itemEstoqueSelecionado, setItemEstoqueSelecionado] = useState<number | null>(null)
  const [mostraSugestoes, setMostraSugestoes] = useState(false)

  const { isOpen, onOpen, onClose } = useDisclosure()
  const toast = useToast()

  const bgColumn = useColorModeValue('gray.100', 'gray.900')
  const bgCard = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const textColor = useColorModeValue('gray.700', 'white')

  const fetchData = async () => {
    try {
      const [resOS, resEstoque] = await Promise.all([
        axios.get('http://127.0.0.1:8000/os/'),
        axios.get('http://127.0.0.1:8000/pecas/') // Garanta que essa rota existe
      ])
      setListaOS(resOS.data)
      setEstoque(resEstoque.data)
    } catch (error) {
      console.error("Erro ao buscar dados", error)
    }
  }

  useEffect(() => { fetchData() }, [])
  
  const abrirDetalhes = (os: OS) => {
    setOsSelecionada(os)
    setNomeItem(''); setQtdItem(1); setValorUnitario(0); setItemEstoqueSelecionado(null);
    onOpen()
  }

  const moverOS = async (id: number, novoStatus: string) => {
    try {
      await axios.put(`http://127.0.0.1:8000/os/${id}`, { status: novoStatus })
      toast({ title: 'Status atualizado!', status: 'success' })
      fetchData()
    } catch (error) {
      toast({ title: 'Erro ao mover OS', status: 'error' })
    }
  }

  const handleBuscaPeca = (texto: string) => {
    setNomeItem(texto)
    setItemEstoqueSelecionado(null)
    
    if (texto.length > 0) {
      const matches = estoque.filter(p => p.nome.toLowerCase().includes(texto.toLowerCase()))
      setSugestoes(matches)
      setMostraSugestoes(true)
    } else {
      setMostraSugestoes(false)
    }
  }

  const selecionarDoEstoque = (peca: Peca) => {
    setNomeItem(peca.nome)
    setValorUnitario(peca.valor_venda)
    setItemEstoqueSelecionado(peca.id) 
    setMostraSugestoes(false)
    toast({ title: 'Item do estoque selecionado', status: 'info', duration: 1000, position: 'top' })
  }

  const adicionarItemHibrido = async () => {
    if (!nomeItem) {
        toast({ title: 'Descreva o item', status: 'warning' }); return;
    }

    try {
      await axios.post(`http://127.0.0.1:8000/os/${osSelecionada?.id}/pecas`, {
        descricao: nomeItem,
        quantidade: qtdItem,
        preco_unitario: valorUnitario,
        produto_id: itemEstoqueSelecionado 
      })
      
      toast({ title: 'Item adicionado!', status: 'success' })
      setNomeItem(''); setQtdItem(1); setValorUnitario(0); setItemEstoqueSelecionado(null);
      fetchData();
    } catch (error) {
      toast({ title: 'Erro ao adicionar item', status: 'error' })
    }
  }
  
  const KanbanColumn = ({ statusKey }: { statusKey: string }) => {
    const config = STATUS_CONFIG[statusKey]
    const itens = listaOS.filter(os => os.status === statusKey)

    return (
      <Flex direction="column" minH="500px" bg={bgColumn} p={3} borderRadius="xl" border="1px solid" borderColor={borderColor}>
        <Flex align="center" mb={4} p={2}>
            <Icon as={config.icon} color={`${config.color}.500`} mr={2} />
            <Text fontWeight="bold" fontSize="xs" color="gray.500" textTransform="uppercase">{config.label}</Text>
            <Spacer />
            <Badge borderRadius="full" px={2} colorScheme={config.color}>{itens.length}</Badge>
        </Flex>

        <VStack spacing={3} align="stretch">
            {itens.map(os => {
                const totalOS = os.pagamentos?.reduce((acc, p) => acc + Number(p.valor || 0), 0) || 0;
                return (
                    <Box 
                        key={os.id} 
                        bg={bgCard} 
                        p={4} 
                        borderRadius="lg" 
                        boxShadow="sm" 
                        border="1px solid" 
                        borderColor="transparent" 
                        _hover={{ borderColor: 'brand.500', cursor: 'pointer', transform: 'translateY(-2px)' }}
                        transition="all 0.2s"
                        onClick={() => abrirDetalhes(os)}
                    >
                        <Flex justify="space-between" mb={2}>
                            <Badge variant="outline" colorScheme="brand">OS #{os.id}</Badge>
                            <Menu>
                                <MenuButton as={IconButton} icon={<SettingsIcon />} size="xs" variant="ghost" onClick={(e) => e.stopPropagation()} />
                                <MenuList>
                                    <MenuItem onClick={(e) => { e.stopPropagation(); moverOS(os.id, 'ORCAMENTO') }}>Mover p/ Orçamento</MenuItem>
                                    <MenuItem onClick={(e) => { e.stopPropagation(); moverOS(os.id, 'EXECUCAO') }}>Mover p/ Execução</MenuItem>
                                    <MenuItem onClick={(e) => { e.stopPropagation(); moverOS(os.id, 'FINALIZADO') }}>Finalizar</MenuItem>
                                </MenuList>
                            </Menu>
                        </Flex>
                        <Text fontWeight="bold" fontSize="sm" mb={1} color={textColor}>{os.defeito_reclamado}</Text>
                        <HStack fontSize="xs" color="gray.500">
                            <Icon as={FaMoneyBillWave} color="green.400" />
                            <Text fontWeight="bold">R$ {totalOS.toFixed(2)}</Text>
                            <Spacer />
                            <Text>{new Date(os.data_abertura).toLocaleDateString()}</Text>
                        </HStack>
                    </Box>
                )
            })}
        </VStack>
      </Flex>
    )
  }

  return (
    <Box>
      <Heading size="md" mb={6} color={textColor}>Fluxo de Trabalho</Heading>

      <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={6}>
        <KanbanColumn statusKey="ORCAMENTO" />
        <KanbanColumn statusKey="EXECUCAO" />
        <KanbanColumn statusKey="FINALIZADO" />
      </Grid>

      {/* MODAL DE DETALHES DA OS */}
      <Modal isOpen={isOpen} onClose={onClose} size="4xl">
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent bg={bgCard} borderRadius="xl">
          <ModalHeader color={textColor} borderBottom="1px solid" borderColor={borderColor}>
            Detalhes da OS #{osSelecionada?.id}
          </ModalHeader>
          <ModalCloseButton />
          
          <ModalBody py={6}>
            <Tabs colorScheme="brand" variant="soft-rounded">
              <TabList mb={4} gap={2}>
                <Tab fontSize="xs" fontWeight="bold" _selected={{ color: 'white', bg: 'brand.500' }}>ITENS</Tab>
                <Tab fontSize="xs" fontWeight="bold" _selected={{ color: 'white', bg: 'brand.500' }}>FINANCEIRO</Tab>
              </TabList>
              
              <TabPanels>
                {}
                <TabPanel p={0}>
                  <VStack align="stretch" spacing={4}>
                    
                    {}
                    <Box p={4} bg={bgColumn} borderRadius="md" border="1px dashed" borderColor="brand.500">
                      <Text fontSize="xs" fontWeight="bold" mb={2} color="brand.500">ADICIONAR PEÇA / MÃO DE OBRA</Text>
                      <HStack align="flex-end" position="relative" spacing={3}>
                        
                        {}
                        <FormControl flex="1">
                          <FormLabel fontSize="xs">Descrição (Busca ou Livre)</FormLabel>
                          <Input 
                            size="sm" 
                            value={nomeItem} 
                            onChange={(e) => handleBuscaPeca(e.target.value)}
                            onBlur={() => setTimeout(() => setMostraSugestoes(false), 200)} // Delay p/ clicar
                            placeholder="Ex: Óleo 5w30 ou Digite livremente..."
                            autoComplete="off"
                            bg="transparent"
                            borderColor={itemEstoqueSelecionado ? "green" : "inherit"}
                          />
                          
                          {}
                          {mostraSugestoes && sugestoes.length > 0 && (
                            <Box 
                              position="absolute" top="100%" left={0} right={0} zIndex={99} 
                              bg={bgCard} boxShadow="dark-lg" borderRadius="md" mt={1} maxH="200px" overflowY="auto"
                            >
                              {sugestoes.map(p => (
                                <Box 
                                  key={p.id} p={2} borderBottom="1px solid" borderColor={borderColor}
                                  _hover={{ bg: "brand.50", cursor: "pointer" }}
                                  onClick={() => selecionarDoEstoque(p)}
                                >
                                  <Text fontSize="sm" fontWeight="bold">{p.nome}</Text>
                                  <Text fontSize="xs" color="gray.500">
                                    Estoque: {p.quantidade} un | R$ {p.valor_venda.toFixed(2)}
                                  </Text>
                                </Box>
                              ))}
                            </Box>
                          )}
                        </FormControl>

                        <FormControl w="80px">
                          <FormLabel fontSize="xs">Qtd</FormLabel>
                          <Input size="sm" type="number" value={qtdItem} onChange={e => setQtdItem(Number(e.target.value))} />
                        </FormControl>

                        <FormControl w="120px">
                          <FormLabel fontSize="xs">Preço Unit.</FormLabel>
                          <Input size="sm" type="number" value={valorUnitario} onChange={e => setValorUnitario(Number(e.target.value))} />
                        </FormControl>

                        <Button 
                          size="sm" 
                          bg="brand.500" 
                          color="white" 
                          _hover={{ bg: "brand.600" }} 
                          leftIcon={<FaPlus />}
                          onClick={adicionarItemHibrido}
                        >
                          Add
                        </Button>
                      </HStack>
                    </Box>

                    {}
                    <TableContainer border="1px solid" borderColor={borderColor} borderRadius="lg">
                      <Table size="sm">
                        <Thead bg={bgColumn}>
                          <Tr>
                            <Th>Item</Th>
                            <Th isNumeric>Qtd</Th>
                            <Th isNumeric>Unit.</Th>
                            <Th isNumeric>Subtotal</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          <Tr>
                            <Td colSpan={4} textAlign="center" py={10} color="gray.500">
                              Os itens cadastrados aparecerão aqui.
                            </Td>
                          </Tr>
                        </Tbody>
                      </Table>
                    </TableContainer>
                  </VStack>
                </TabPanel>
                
                {}
                <TabPanel>
                  <Text color="gray.500" fontSize="sm">Controle de pagamentos em construção...</Text>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  )
}
import { useEffect, useState } from 'react'
import {
  Box, Flex, Heading, Text, SimpleGrid, Stat, StatLabel, StatNumber, StatHelpText,
  Icon, Tabs, TabList, TabPanels, Tab, TabPanel, Table, Thead, Tbody, Tr, Th, Td,
  Button, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody,
  ModalFooter, ModalCloseButton, FormControl, FormLabel, Input, Select, useToast,
  useColorModeValue, Badge, IconButton
} from '@chakra-ui/react'
import { AddIcon, DeleteIcon, ArrowUpIcon, ArrowDownIcon } from '@chakra-ui/icons'
import { FaMoneyBillWave, FaFileInvoiceDollar, FaWallet } from 'react-icons/fa'
import api from '../services/api'
import type { Despesa } from '../types'

export default function Financeiro() {
  const [resumo, setResumo] = useState({ total_receitas: 0, total_despesas: 0, saldo: 0 })
  const [receitas, setReceitas] = useState<any[]>([])
  const [despesas, setDespesas] = useState<Despesa[]>([])

  const [desc, setDesc] = useState('')
  const [valor, setValor] = useState('')
  const [dataVenc, setDataVenc] = useState('')
  const [categoria, setCategoria] = useState('FIXA')

  const { isOpen, onOpen, onClose } = useDisclosure()
  const toast = useToast()

  const bgCard = useColorModeValue('white', 'gray.800')
  const colorGreen = 'green.400'
  const colorRed = 'red.400'

  const carregarDados = async () => {
    try {
        const [resResumo, resPag, resDesp] = await Promise.all([
            api.get('/pagamentos/resumo'),
            api.get('/pagamentos'),
            api.get('/pagamentos/despesas/')
        ])
        setResumo(resResumo.data)
        setReceitas(resPag.data)
        setDespesas(resDesp.data)
    } catch (error) {
        console.error("Erro ao carregar financeiro", error)
    }
  }

  useEffect(() => { carregarDados() }, [])

  const handleSalvarDespesa = async () => {
      try {
          await api.post('/pagamentos/despesas/', {
              descricao: desc,
              valor: parseFloat(valor),
              data_vencimento: dataVenc,
              categoria: categoria,
              status: "PAGO" // MVP: Já lança como pago
          })
          toast({ title: 'Despesa registrada', status: 'success' })
          onClose()
          setDesc(''); setValor(''); setDataVenc('');
          carregarDados()
      } catch (error) {
          toast({ title: 'Erro ao salvar', status: 'error' })
      }
  }

  const handleRemoverDespesa = async (id: number) => {
      if(!confirm("Apagar este registro?")) return
      try {
          await api.delete(`/pagamentos/despesas/${id}`)
          carregarDados()
      } catch (e) { toast({ title: 'Erro ao remover', status: 'error' }) }
  }

  return (
    <Box>
      <Heading size="lg" mb={6}>Controle Financeiro</Heading>

      {/* --- CARDS DE RESUMO --- */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={8}>
        <Stat bg={bgCard} p={5} borderRadius="xl" shadow="sm" borderLeft="4px solid" borderColor={colorGreen}>
            <Flex justify="space-between">
                <Box>
                    <StatLabel color="gray.500">Total Receitas</StatLabel>
                    <StatNumber color={colorGreen}>R$ {resumo.total_receitas.toFixed(2)}</StatNumber>
                    <StatHelpText>Entradas de OS</StatHelpText>
                </Box>
                <Icon as={ArrowUpIcon} w={8} h={8} color={colorGreen} />
            </Flex>
        </Stat>

        <Stat bg={bgCard} p={5} borderRadius="xl" shadow="sm" borderLeft="4px solid" borderColor={colorRed}>
            <Flex justify="space-between">
                <Box>
                    <StatLabel color="gray.500">Total Despesas</StatLabel>
                    <StatNumber color={colorRed}>R$ {resumo.total_despesas.toFixed(2)}</StatNumber>
                    <StatHelpText>Contas e Gastos</StatHelpText>
                </Box>
                <Icon as={ArrowDownIcon} w={8} h={8} color={colorRed} />
            </Flex>
        </Stat>

        <Stat bg={bgCard} p={5} borderRadius="xl" shadow="sm" borderLeft="4px solid" borderColor={resumo.saldo >= 0 ? 'blue.400' : 'red.500'}>
            <Flex justify="space-between">
                <Box>
                    <StatLabel color="gray.500">Saldo Líquido</StatLabel>
                    <StatNumber color={resumo.saldo >= 0 ? 'blue.500' : 'red.500'}>
                        R$ {resumo.saldo.toFixed(2)}
                    </StatNumber>
                    <StatHelpText>Lucro/Prejuízo</StatHelpText>
                </Box>
                <Icon as={FaWallet} w={8} h={8} color="gray.400" />
            </Flex>
        </Stat>
      </SimpleGrid>

      {/* --- LISTAGENS --- */}
      <Box bg={bgCard} borderRadius="xl" shadow="sm" p={4}>
        <Tabs variant="soft-rounded" colorScheme="brand">
            <Flex justify="space-between" align="center" mb={4} wrap="wrap">
                <TabList>
                    <Tab><Icon as={FaMoneyBillWave} mr={2}/> Receitas</Tab>
                    <Tab><Icon as={FaFileInvoiceDollar} mr={2}/> Despesas</Tab>
                </TabList>
                <Button leftIcon={<AddIcon />} colorScheme="red" variant="outline" size="sm" onClick={onOpen}>
                    Lançar Despesa
                </Button>
            </Flex>

            <TabPanels>
                {/* TAB RECEITAS */}
                <TabPanel px={0}>
                    <Table variant="simple" size="sm">
                        <Thead><Tr><Th>Data</Th><Th>Origem</Th><Th>Forma</Th><Th isNumeric>Valor</Th></Tr></Thead>
                        <Tbody>
                            {receitas.map(r => (
                                <Tr key={r.id}>
                                    <Td>{new Date(r.data_pagamento).toLocaleDateString()}</Td>
                                    <Td><Badge colorScheme="purple">OS #{r.ordem_servico_id}</Badge></Td>
                                    <Td>{r.forma_pagamento}</Td>
                                    <Td isNumeric color="green.500" fontWeight="bold">R$ {r.valor}</Td>
                                </Tr>
                            ))}
                        </Tbody>
                    </Table>
                </TabPanel>

                {/* TAB DESPESAS */}
                <TabPanel px={0}>
                    <Table variant="simple" size="sm">
                        <Thead><Tr><Th>Vencimento</Th><Th>Descrição</Th><Th>Categoria</Th><Th isNumeric>Valor</Th><Th>Ação</Th></Tr></Thead>
                        <Tbody>
                            {despesas.map(d => (
                                <Tr key={d.id}>
                                    <Td>{new Date(d.data_vencimento).toLocaleDateString()}</Td>
                                    <Td>{d.descricao}</Td>
                                    <Td><Badge>{d.categoria}</Badge></Td>
                                    <Td isNumeric color="red.500" fontWeight="bold">- R$ {d.valor}</Td>
                                    <Td>
                                        <IconButton aria-label="Remover" icon={<DeleteIcon/>} size="xs" variant="ghost" colorScheme="red" onClick={() => handleRemoverDespesa(d.id)}/>
                                    </Td>
                                </Tr>
                            ))}
                        </Tbody>
                    </Table>
                </TabPanel>
            </TabPanels>
        </Tabs>
      </Box>

      {/* MODAL NOVA DESPESA */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
            <ModalHeader>Nova Despesa</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
                <FormControl mb={3}>
                    <FormLabel>Descrição</FormLabel>
                    <Input placeholder="Ex: Conta de Luz" value={desc} onChange={e => setDesc(e.target.value)} />
                </FormControl>
                <Flex gap={3} mb={3}>
                    <FormControl>
                        <FormLabel>Valor</FormLabel>
                        <Input type="number" placeholder="0.00" value={valor} onChange={e => setValor(e.target.value)} />
                    </FormControl>
                    <FormControl>
                        <FormLabel>Vencimento</FormLabel>
                        <Input type="date" value={dataVenc} onChange={e => setDataVenc(e.target.value)} />
                    </FormControl>
                </Flex>
                <FormControl>
                    <FormLabel>Categoria</FormLabel>
                    <Select value={categoria} onChange={e => setCategoria(e.target.value)}>
                        <option value="FIXA">Custo Fixo (Aluguel, Luz)</option>
                        <option value="VARIAVEL">Custo Variável (Peças, Extras)</option>
                        <option value="PESSOAL">Pessoal (Salários, Retiradas)</option>
                    </Select>
                </FormControl>
            </ModalBody>
            <ModalFooter>
                <Button onClick={onClose} mr={3}>Cancelar</Button>
                <Button colorScheme="red" onClick={handleSalvarDespesa}>Registrar Saída</Button>
            </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  )
}
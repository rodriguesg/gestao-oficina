import { useEffect, useState } from 'react'
import {
  Box, Flex, Heading, Button, Table, Thead, Tbody, Tr, Th, Td,
  useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalFooter, ModalBody, ModalCloseButton, FormControl, FormLabel, Input,
  useToast, Tabs, TabList, TabPanels, Tab, TabPanel, useColorModeValue,
  IconButton, Badge, HStack
} from '@chakra-ui/react'
import { AddIcon, DeleteIcon, EditIcon } from '@chakra-ui/icons'
import { FaBox, FaWrench } from 'react-icons/fa'
import api from '../services/api'
import type { Peca } from '../types'

interface Servico {
    id: number;
    descricao: string;
    valor_mao_obra: number;
    tempo_estimado_minutos: number;
}

export default function Estoque() {
  const [pecas, setPecas] = useState<Peca[]>([])
  const [servicos, setServicos] = useState<Servico[]>([])
  
  // States do Form Peça
  const [idEdicao, setIdEdicao] = useState<number | null>(null)
  const [nomePeca, setNomePeca] = useState('')
  const [codigoPeca, setCodigoPeca] = useState('')
  const [valorPeca, setValorPeca] = useState('')
  const [qtdPeca, setQtdPeca] = useState('')

  // States do Form Serviço
  const [descServico, setDescServico] = useState('')
  const [valorServico, setValorServico] = useState('')

  const { isOpen, onOpen, onClose } = useDisclosure()
  const [tabIndex, setTabIndex] = useState(0) // 0 = Peças, 1 = Serviços

  const toast = useToast()
  const bgCard = useColorModeValue('white', 'gray.800')

  const carregarDados = async () => {
    try {
        const [resPecas, resServicos] = await Promise.all([
            api.get('/pecas/'),
            api.get('/servicos/')
        ])
        setPecas(resPecas.data)
        setServicos(resServicos.data)
    } catch (error) { console.error("Erro ao carregar estoque", error) }
  }

  useEffect(() => { carregarDados() }, [])

  // --- FUNÇÕES DE ABRIR MODAL ---
  const abrirModalNovaPeca = () => {
      setTabIndex(0)
      setIdEdicao(null)
      limparForms()
      onOpen()
  }

  const abrirModalNovoServico = () => {
      setTabIndex(1)
      setIdEdicao(null)
      limparForms()
      onOpen()
  }

  const abrirModalEditarPeca = (p: Peca) => {
      setTabIndex(0)
      setIdEdicao(p.id)
      setNomePeca(p.nome)
      setCodigoPeca(p.codigo || '')
      setValorPeca(p.valor_venda.toString())
      setQtdPeca(p.estoque_atual.toString())
      onOpen()
  }

  const abrirModalEditarServico = (s: Servico) => {
      setTabIndex(1)
      setIdEdicao(s.id)
      setDescServico(s.descricao)
      setValorServico(s.valor_mao_obra.toString())
      onOpen()
  }

  const limparForms = () => {
      setNomePeca(''); setCodigoPeca(''); setValorPeca(''); setQtdPeca('')
      setDescServico(''); setValorServico('')
  }

  // --- AÇÕES DO CRUD ---

  const handleSalvar = async () => {
      try {
          if (tabIndex === 0) {
              // === PEÇAS ===
              const payload = {
                  nome: nomePeca,
                  codigo: codigoPeca,
                  valor_venda: parseFloat(valorPeca),
                  estoque_atual: parseInt(qtdPeca)
              }

              if (idEdicao) {
                  await api.put(`/pecas/${idEdicao}`, payload)
                  toast({ title: 'Peça atualizada!', status: 'success' })
              } else {
                  await api.post('/pecas/', payload)
                  toast({ title: 'Peça cadastrada!', status: 'success' })
              }

          } else {
              // === SERVIÇOS ===
              const payload = {
                  descricao: descServico,
                  valor_mao_obra: parseFloat(valorServico),
                  tempo_estimado_minutos: 60 
              }

              if (idEdicao) {
                  await api.put(`/servicos/${idEdicao}`, payload)
                  toast({ title: 'Serviço atualizado!', status: 'success' })
              } else {
                  await api.post('/servicos/', payload)
                  toast({ title: 'Serviço cadastrado!', status: 'success' })
              }
          }
          onClose()
          limparForms()
          carregarDados()
      } catch (error: any) {
          const msg = error.response?.data?.detail || 'Erro ao salvar'
          toast({ title: 'Erro', description: msg, status: 'error' })
      }
  }

  const handleExcluir = async (id: number, tipo: 'peca' | 'servico') => {
      if (!confirm("Tem certeza? Se este item estiver em uma OS, a exclusão será bloqueada.")) return

      try {
          if (tipo === 'peca') {
              await api.delete(`/pecas/${id}`)
          } else {
              await api.delete(`/servicos/${id}`)
          }
          toast({ title: 'Item removido', status: 'info' })
          carregarDados()
      } catch (error: any) {
          const msg = error.response?.data?.detail || 'Não foi possível excluir.'
          toast({ title: 'Erro', description: msg, status: 'error' })
      }
  }

  return (
    <Box>
      <Heading size="lg" mb={6}>Catálogo & Estoque</Heading>
      
      <Box bg={bgCard} p={4} borderRadius="xl" shadow="sm">
        <Tabs index={tabIndex} onChange={(index) => setTabIndex(index)} variant="soft-rounded" colorScheme="brand">
            <Flex justify="space-between" mb={4}>
                <TabList>
                    <Tab><FaBox style={{marginRight: '8px'}}/> Peças</Tab>
                    <Tab><FaWrench style={{marginRight: '8px'}}/> Serviços</Tab>
                </TabList>
                <Button 
                    leftIcon={<AddIcon />} 
                    colorScheme="brand" 
                    onClick={tabIndex === 0 ? abrirModalNovaPeca : abrirModalNovoServico}
                >
                    {tabIndex === 0 ? 'Nova Peça' : 'Novo Serviço'}
                </Button>
            </Flex>

            <TabPanels>
                {/* TAB PEÇAS */}
                <TabPanel px={0}>
                    <Table variant="simple">
                        <Thead><Tr><Th>Cód.</Th><Th>Nome</Th><Th isNumeric>Estoque</Th><Th isNumeric>Valor</Th><Th isNumeric>Ações</Th></Tr></Thead>
                        <Tbody>
                            {pecas.map(p => (
                                <Tr key={p.id}>
                                    <Td><Badge>{p.codigo}</Badge></Td>
                                    <Td fontWeight="bold">{p.nome}</Td>
                                    <Td isNumeric color={p.estoque_atual < 5 ? 'red.500' : 'inherit'}>{p.estoque_atual} un</Td>
                                    <Td isNumeric>R$ {p.valor_venda}</Td>
                                    <Td isNumeric>
                                        <IconButton aria-label="Editar" icon={<EditIcon />} size="sm" mr={2} onClick={() => abrirModalEditarPeca(p)} />
                                        <IconButton aria-label="Excluir" icon={<DeleteIcon />} size="sm" colorScheme="red" variant="ghost" onClick={() => handleExcluir(p.id, 'peca')} />
                                    </Td>
                                </Tr>
                            ))}
                        </Tbody>
                    </Table>
                </TabPanel>

                {/* TAB SERVIÇOS */}
                <TabPanel px={0}>
                    <Table variant="simple">
                        <Thead><Tr><Th>ID</Th><Th>Descrição</Th><Th isNumeric>Valor Mão de Obra</Th><Th isNumeric>Ações</Th></Tr></Thead>
                        <Tbody>
                            {servicos.map(s => (
                                <Tr key={s.id}>
                                    <Td>#{s.id}</Td>
                                    <Td fontWeight="bold">{s.descricao}</Td>
                                    <Td isNumeric>R$ {s.valor_mao_obra}</Td>
                                    <Td isNumeric>
                                        <IconButton aria-label="Editar" icon={<EditIcon />} size="sm" mr={2} onClick={() => abrirModalEditarServico(s)} />
                                        <IconButton aria-label="Excluir" icon={<DeleteIcon />} size="sm" colorScheme="red" variant="ghost" onClick={() => handleExcluir(s.id, 'servico')} />
                                    </Td>
                                </Tr>
                            ))}
                        </Tbody>
                    </Table>
                </TabPanel>
            </TabPanels>
        </Tabs>
      </Box>

      {/* MODAL DE CADASTRO/EDIÇÃO */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
            <ModalHeader>
                {idEdicao ? 'Editar' : 'Cadastrar'} {tabIndex === 0 ? 'Peça' : 'Serviço'}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
                {tabIndex === 0 ? (
                    // FORM PEÇA
                    <>
                        <Flex gap={4}>
                            <FormControl isRequired>
                                <FormLabel>Código</FormLabel>
                                <Input value={codigoPeca} onChange={e => setCodigoPeca(e.target.value)} />
                            </FormControl>
                            <FormControl isRequired>
                                <FormLabel>Estoque Inicial</FormLabel>
                                <Input type="number" value={qtdPeca} onChange={e => setQtdPeca(e.target.value)} />
                            </FormControl>
                        </Flex>
                        <FormControl mt={4} isRequired>
                            <FormLabel>Nome da Peça</FormLabel>
                            <Input value={nomePeca} onChange={e => setNomePeca(e.target.value)} />
                        </FormControl>
                        <FormControl mt={4} isRequired>
                            <FormLabel>Valor de Venda (R$)</FormLabel>
                            <Input type="number" value={valorPeca} onChange={e => setValorPeca(e.target.value)} />
                        </FormControl>
                    </>
                ) : (
                    // FORM SERVIÇO
                    <>
                        <FormControl isRequired>
                            <FormLabel>Descrição do Serviço</FormLabel>
                            <Input value={descServico} onChange={e => setDescServico(e.target.value)} placeholder="Ex: Alinhamento 3D" />
                        </FormControl>
                        <FormControl mt={4} isRequired>
                            <FormLabel>Valor Base (R$)</FormLabel>
                            <Input type="number" value={valorServico} onChange={e => setValorServico(e.target.value)} />
                        </FormControl>
                    </>
                )}
            </ModalBody>
            <ModalFooter>
                <Button onClick={onClose} mr={3}>Cancelar</Button>
                <Button colorScheme="brand" onClick={handleSalvar}>
                    {idEdicao ? 'Salvar Alterações' : 'Cadastrar'}
                </Button>
            </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  )
}
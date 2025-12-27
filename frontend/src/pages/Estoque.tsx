import { useEffect, useState } from 'react'
import { 
  Box, Flex, Heading, Button, Table, Thead, Tbody, Tr, Th, Td, 
  useToast, useColorModeValue, Badge, Input, InputGroup, InputLeftElement,
  IconButton, HStack, useDisclosure, Modal, ModalOverlay, ModalContent,
  ModalHeader, ModalCloseButton, ModalBody, ModalFooter, FormControl, FormLabel
} from '@chakra-ui/react'
import { SearchIcon, EditIcon, DeleteIcon, AddIcon } from '@chakra-ui/icons'
import { FaBoxOpen } from 'react-icons/fa'
import axios from 'axios'

interface Peca {
  id: number;
  nome: string;
  quantidade: number;
  preco_venda: number;
}

export default function Estoque() {
  const [pecas, setPecas] = useState<Peca[]>([])
  const [busca, setBusca] = useState('')
  
  // Estados do Formulário
  const [nome, setNome] = useState('')
  const [qtd, setQtd] = useState('')
  const [preco, setPreco] = useState('')
  const [idEdicao, setIdEdicao] = useState<number | null>(null)

  const { isOpen, onOpen, onClose } = useDisclosure()
  const toast = useToast()
  
  // Cores do Tema
  const bgCard = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

  const fetchEstoque = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/pecas/')
      setPecas(res.data)
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => { fetchEstoque() }, [])

  // Função para salvar (Cria ou Atualiza)
  const handleSalvar = async () => {
    if (!nome || !qtd || !preco) {
        toast({ title: 'Preencha todos os campos', status: 'warning' }); return
    }

    const payload = {
        nome,
        quantidade: parseInt(qtd),
        preco_venda: parseFloat(preco)
    }

    try {
        if (idEdicao) {
            // Atualizar existente
            await axios.put(`http://127.0.0.1:8000/pecas/${idEdicao}`, payload) // Verifique se sua rota é PUT
            toast({ title: 'Peça atualizada!', status: 'success' })
        } else {
            // Criar nova
            await axios.post('http://127.0.0.1:8000/pecas/', payload)
            toast({ title: 'Peça cadastrada!', status: 'success' })
        }
        fetchEstoque()
        fecharModal()
    } catch (error) {
        toast({ title: 'Erro ao salvar', status: 'error' })
    }
  }

  const handleExcluir = async (id: number) => {
      if(!confirm("Tem certeza que deseja excluir este item?")) return;
      try {
          await axios.delete(`http://127.0.0.1:8000/pecas/${id}`)
          toast({ title: 'Item removido', status: 'info' })
          fetchEstoque()
      } catch (error) {
          toast({ title: 'Erro ao excluir', status: 'error' })
      }
  }

  const abrirModalCriacao = () => {
      setIdEdicao(null)
      setNome(''); setQtd(''); setPreco('')
      onOpen()
  }

  const abrirModalEdicao = (p: Peca) => {
      setIdEdicao(p.id)
      setNome(p.nome)
      setQtd(p.quantidade.toString())
      setPreco(p.preco_venda.toString())
      onOpen()
  }

  const fecharModal = () => {
      onClose()
      setIdEdicao(null)
  }

  // Filtragem local (Busca)
  const pecasFiltradas = pecas.filter(p => 
      p.nome.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <Box>
      <Flex mb={6} justify="space-between" align="center" wrap="wrap" gap={4}>
        <Heading size="md" color={useColorModeValue('gray.700', 'white')}>
            Controle de Estoque
        </Heading>
        
        <Flex gap={2}>
            <InputGroup size="sm" w="300px">
                <InputLeftElement pointerEvents='none'><SearchIcon color='gray.400' /></InputLeftElement>
                <Input 
                    placeholder="Buscar peça..." 
                    variant="filled" 
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                />
            </InputGroup>
            <Button 
                leftIcon={<AddIcon />} 
                bg="brand.500" 
                color="white" 
                size="sm" 
                _hover={{ bg: "brand.600" }}
                onClick={abrirModalCriacao}
            >
                Nova Peça
            </Button>
        </Flex>
      </Flex>
      
      <Box bg={bgCard} borderRadius="xl" shadow="sm" overflow="hidden" border="1px solid" borderColor={borderColor}>
        <Table variant="simple">
          <Thead bg={useColorModeValue('gray.50', 'gray.700')}>
            <Tr>
              <Th>Peça</Th>
              <Th isNumeric>Qtd</Th>
              <Th isNumeric>Preço (R$)</Th>
              <Th>Status</Th>
              <Th isNumeric>Ações</Th>
            </Tr>
          </Thead>
          <Tbody>
            {pecasFiltradas.map(p => (
              <Tr key={p.id} _hover={{ bg: useColorModeValue('gray.50', 'whiteAlpha.100') }}>
                <Td fontWeight="bold">
                    <HStack>
                        <Box as={FaBoxOpen} color="brand.500" />
                        <span style={{ marginLeft: 8 }}>{p.nome}</span>
                    </HStack>
                </Td>
                <Td isNumeric fontWeight="bold">{p.quantidade}</Td>
                <Td isNumeric>{p.preco_venda.toFixed(2)}</Td>
                <Td>
                  <Badge colorScheme={p.quantidade > 5 ? "green" : p.quantidade > 0 ? "orange" : "red"}>
                    {p.quantidade > 5 ? "OK" : p.quantidade > 0 ? "BAIXO" : "ZERADO"}
                  </Badge>
                </Td>
                <Td isNumeric>
                    <IconButton 
                        aria-label="Editar" 
                        icon={<EditIcon />} 
                        size="sm" 
                        variant="ghost" 
                        colorScheme="blue"
                        onClick={() => abrirModalEdicao(p)}
                    />
                    <IconButton 
                        aria-label="Excluir" 
                        icon={<DeleteIcon />} 
                        size="sm" 
                        variant="ghost" 
                        colorScheme="red"
                        onClick={() => handleExcluir(p.id)}
                    />
                </Td>
              </Tr>
            ))}
            {pecasFiltradas.length === 0 && (
                <Tr><Td colSpan={5} textAlign="center" py={8} color="gray.500">Nenhuma peça encontrada.</Td></Tr>
            )}
          </Tbody>
        </Table>
      </Box>

      {/* MODAL DE CADASTRO/EDIÇÃO */}
      <Modal isOpen={isOpen} onClose={fecharModal}>
        <ModalOverlay backdropFilter="blur(2px)" />
        <ModalContent bg={bgCard}>
          <ModalHeader>{idEdicao ? 'Editar Peça' : 'Cadastrar Nova Peça'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FormControl isRequired>
              <FormLabel>Nome da Peça</FormLabel>
              <Input placeholder="Ex: Filtro de Óleo" value={nome} onChange={e => setNome(e.target.value)} />
            </FormControl>

            <Flex mt={4} gap={4}>
                <FormControl isRequired>
                    <FormLabel>Quantidade</FormLabel>
                    <Input type="number" value={qtd} onChange={e => setQtd(e.target.value)} />
                </FormControl>

                <FormControl isRequired>
                    <FormLabel>Preço de Venda (R$)</FormLabel>
                    <Input type="number" value={preco} onChange={e => setPreco(e.target.value)} />
                </FormControl>
            </Flex>
          </ModalBody>

          <ModalFooter>
            <Button onClick={fecharModal} mr={3}>Cancelar</Button>
            <Button colorScheme="brand" onClick={handleSalvar}>
                {idEdicao ? 'Salvar Alterações' : 'Cadastrar'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  )
}
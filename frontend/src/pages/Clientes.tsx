import { useEffect, useState } from 'react'
import {
  Box, Flex, Heading, Button, Table, Thead, Tbody, Tr, Th, Td,
  Badge, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalFooter, ModalBody, ModalCloseButton, FormControl, FormLabel, Input,
  useToast, HStack, Avatar, Spacer, useColorModeValue, Text, IconButton
} from '@chakra-ui/react'
import { AddIcon, EditIcon, DeleteIcon } from '@chakra-ui/icons'
import api from '../services/api'
import type { Cliente } from '../types'

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  
  // Estados do Formulário
  const [idEdicao, setIdEdicao] = useState<number | null>(null)
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [cpf, setCpf] = useState('')
  const [endereco, setEndereco] = useState('') // Adicionei endereço que faltava

  const { isOpen, onOpen, onClose } = useDisclosure()
  const toast = useToast()

  const cardBg = useColorModeValue('white', 'gray.800')
  const textColor = useColorModeValue('gray.700', 'white')
  const borderColor = useColorModeValue('gray.100', 'gray.700')

  const fetchClientes = async () => {
    try {
        const { data } = await api.get<Cliente[]>('/clientes/')
        setClientes(data)
    } catch (error) { console.error(error) }
  }

  useEffect(() => { fetchClientes() }, [])

  const abrirModalCriar = () => {
      setIdEdicao(null)
      setNome(''); setTelefone(''); setCpf(''); setEndereco('')
      onOpen()
  }

  const abrirModalEditar = (cliente: Cliente) => {
      setIdEdicao(cliente.id)
      setNome(cliente.nome)
      setTelefone(cliente.telefone)
      setCpf(cliente.cpf_cnpj)
      setEndereco(cliente.endereco || '')
      onOpen()
  }

  const handleSalvar = async () => {
     try {
      const payload = { nome, telefone, cpf_cnpj: cpf, endereco }
      
      if (idEdicao) {
          // EDITAR
          await api.put(`/clientes/${idEdicao}`, payload) // Requer backend PUT
          toast({ title: 'Cliente atualizado.', status: 'success' })
      } else {
          // CRIAR
          await api.post('/clientes/', payload)
          toast({ title: 'Cliente cadastrado.', status: 'success' })
      }
      
      onClose()
      fetchClientes()
    } catch (error) {
      toast({ title: 'Erro ao salvar.', status: 'error' })
    }
  }

  const handleExcluir = async (id: number) => {
      if (!confirm("Tem certeza? Isso pode apagar veículos e OS associadas!")) return
      try {
          await api.delete(`/clientes/${id}`)
          toast({ title: 'Cliente removido.', status: 'info' })
          fetchClientes()
      } catch (error) {
          toast({ title: 'Erro ao excluir.', description: 'Verifique se o cliente tem pendências.', status: 'error' })
      }
  }

  return (
    <Box>
        <Flex mb={8} bg={cardBg} p={4} borderRadius="xl" shadow="sm" align="center" border="1px solid" borderColor={borderColor}>
          <Heading size="md" color={textColor}>Gestão de Clientes</Heading>
          <Spacer />
          <Button leftIcon={<AddIcon />} colorScheme="brand" size="sm" onClick={abrirModalCriar}>
            Novo Cliente
          </Button>
        </Flex>

        <Box bg={cardBg} borderRadius="xl" shadow="sm" overflow="hidden" border="1px solid" borderColor={borderColor}>
          <Table variant="simple">
            <Thead bg={useColorModeValue('gray.50', 'gray.700')}>
              <Tr>
                <Th>Cliente</Th>
                <Th>Contato</Th>
                <Th>Documento</Th>
                <Th isNumeric>Ações</Th>
              </Tr>
            </Thead>
            <Tbody>
              {clientes.map(cliente => (
                <Tr key={cliente.id}>
                  <Td>
                    <HStack>
                      <Avatar size="xs" name={cliente.nome} bg="brand.500" />
                      <Box>
                        <Text fontWeight="bold" fontSize="sm">{cliente.nome}</Text>
                        <Text fontSize="xs" color="gray.500">{cliente.endereco}</Text>
                      </Box>
                    </HStack>
                  </Td>
                  <Td fontSize="sm">{cliente.telefone}</Td>
                  <Td fontSize="sm"><Badge>{cliente.cpf_cnpj}</Badge></Td>
                  <Td isNumeric>
                      <IconButton aria-label="Editar" icon={<EditIcon />} size="sm" mr={2} onClick={() => abrirModalEditar(cliente)} />
                      <IconButton aria-label="Excluir" icon={<DeleteIcon />} size="sm" colorScheme="red" variant="ghost" onClick={() => handleExcluir(cliente.id)} />
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>

      <Modal isOpen={isOpen} onClose={onClose} isCentered size="xl">
        <ModalOverlay backdropFilter='blur(2px)' />
        <ModalContent borderRadius="xl" bg={cardBg}>
          <ModalHeader>{idEdicao ? 'Editar Cliente' : 'Novo Cliente'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Flex gap={4}>
              <FormControl isRequired>
                <FormLabel>Nome</FormLabel>
                <Input value={nome} onChange={(e) => setNome(e.target.value)} />
              </FormControl>
              <FormControl w="40%" isRequired>
                <FormLabel>CPF/CNPJ</FormLabel>
                <Input value={cpf} onChange={(e) => setCpf(e.target.value)} />
              </FormControl>
            </Flex>
            <Flex gap={4} mt={4}>
                <FormControl isRequired>
                <FormLabel>Telefone</FormLabel>
                <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} />
                </FormControl>
                <FormControl isRequired>
                <FormLabel>Endereço</FormLabel>
                <Input value={endereco} onChange={(e) => setEndereco(e.target.value)} />
                </FormControl>
            </Flex>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose} mr={3}>Cancelar</Button>
            <Button colorScheme="brand" onClick={handleSalvar}>Salvar</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  )
}
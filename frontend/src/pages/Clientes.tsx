import { useEffect, useState } from 'react'
import {
  Box, Flex, Heading, Button, Table, Thead, Tbody, Tr, Th, Td,
  Badge, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalFooter, ModalBody, ModalCloseButton, FormControl, FormLabel, Input,
  useToast, HStack, Avatar, Spacer, useColorModeValue, Text
} from '@chakra-ui/react'
import { AddIcon } from '@chakra-ui/icons'
import axios from 'axios'

interface Cliente {
  id: number;
  nome: string;
  telefone: string;
  cpf_cnpj: string;
}

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  // ... (estados do form mantidos iguais) ...
  const [novoNome, setNovoNome] = useState('')
  const [novoTelefone, setNovoTelefone] = useState('')
  const [novoCpf, setNovoCpf] = useState('')

  const { isOpen, onOpen, onClose } = useDisclosure()
  const toast = useToast()

  // --- CORES DINÂMICAS DO TEMA ---
  const cardBg = useColorModeValue('white', 'gray.800')
  const textColor = useColorModeValue('gray.700', 'white')
  const tableHeaderBg = useColorModeValue('gray.50', 'gray.700')
  const borderColor = useColorModeValue('gray.100', 'gray.700')

  const fetchClientes = () => {
    axios.get('http://127.0.0.1:8000/clientes/')
      .then(response => setClientes(response.data))
      .catch(error => console.error("Erro:", error))
  }

  useEffect(() => { fetchClientes() }, [])

  const handleSalvar = async () => {
     // ... (Lógica de salvar idêntica à anterior) ...
     try {
      await axios.post('http://127.0.0.1:8000/clientes/', {
        nome: novoNome,
        telefone: novoTelefone,
        cpf_cnpj: novoCpf
      })
      toast({ title: 'Cliente cadastrado.', status: 'success' })
      setNovoNome(''); setNovoTelefone(''); setNovoCpf('');
      onClose()
      fetchClientes()
    } catch (error) {
      toast({ title: 'Erro ao salvar.', status: 'error' })
    }
  }

  return (
    <Box>
        {/* Header da Página */}
        <Flex 
            mb={8} 
            bg={cardBg} 
            p={4} 
            borderRadius="xl" 
            shadow="sm" 
            align="center"
            border="1px solid"
            borderColor={borderColor}
        >
          <Heading size="md" color={textColor}>Gestão de Clientes</Heading>
          <Spacer />
          <Button leftIcon={<AddIcon />} colorScheme="brand" size="sm" onClick={onOpen}>
            Novo Cliente
          </Button>
        </Flex>

        {/* Tabela */}
        <Box 
            bg={cardBg} 
            borderRadius="xl" 
            shadow="sm" 
            overflow="hidden"
            border="1px solid"
            borderColor={borderColor}
        >
          <Table variant="simple">
            <Thead bg={tableHeaderBg}>
              <Tr>
                <Th color={textColor}>Cliente</Th>
                <Th color={textColor}>Contato</Th>
                <Th color={textColor}>Documento</Th>
                <Th color={textColor}>Status</Th>
                <Th isNumeric color={textColor}>Ações</Th>
              </Tr>
            </Thead>
            <Tbody>
              {clientes.map(cliente => (
                <Tr key={cliente.id} _hover={{ bg: tableHeaderBg }}>
                  <Td>
                    <HStack>
                      <Avatar size="xs" name={cliente.nome} bg="brand.500" color="white" />
                      <Text fontWeight="bold" color={textColor}>{cliente.nome}</Text>
                    </HStack>
                  </Td>
                  <Td color="gray.500">{cliente.telefone}</Td>
                  <Td color="gray.500">{cliente.cpf_cnpj}</Td>
                  <Td><Badge colorScheme="green">ATIVO</Badge></Td>
                  <Td isNumeric><Button size="xs" variant="ghost">Editar</Button></Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>

      {/* Modal - Também precisa de cores no background! */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered size="xl">
        <ModalOverlay backdropFilter='blur(2px)' />
        <ModalContent borderRadius="xl" bg={cardBg}>
          <ModalHeader color={textColor}>Novo Cliente</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {/* O Input já pega o estilo do theme.ts automaticamente */}
            <Flex gap={4}>
              <FormControl isRequired>
                <FormLabel>Nome</FormLabel>
                <Input value={novoNome} onChange={(e) => setNovoNome(e.target.value)} />
              </FormControl>
              <FormControl w="40%">
                <FormLabel>CPF</FormLabel>
                <Input value={novoCpf} onChange={(e) => setNovoCpf(e.target.value)} />
              </FormControl>
            </Flex>
            <FormControl mt={4}>
              <FormLabel>Telefone</FormLabel>
              <Input value={novoTelefone} onChange={(e) => setNovoTelefone(e.target.value)} />
            </FormControl>
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
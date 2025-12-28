import { useEffect, useState } from 'react'
import {
  Box, Flex, Heading, Button, Table, Thead, Tbody, Tr, Th, Td,
  useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalFooter, ModalBody, ModalCloseButton, FormControl, FormLabel, Input,
  Select, useToast, HStack, Badge, Spacer, useColorModeValue
} from '@chakra-ui/react'
import { AddIcon } from '@chakra-ui/icons'
import { FaCarSide } from 'react-icons/fa' 
import api from '../services/api'
import type { Veiculo, Cliente } from '../types'

export default function Veiculos() {
  const [veiculos, setVeiculos] = useState<Veiculo[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [marca, setMarca] = useState(''); const [modelo, setModelo] = useState(''); 
  const [placa, setPlaca] = useState(''); const [ano, setAno] = useState(''); const [clienteId, setClienteId] = useState('')

  const { isOpen, onOpen, onClose } = useDisclosure()
  const toast = useToast()

  const cardBg = useColorModeValue('white', 'gray.800')
  const textColor = useColorModeValue('gray.700', 'white')
  const tableHeaderBg = useColorModeValue('gray.50', 'gray.700')
  const borderColor = useColorModeValue('gray.100', 'gray.700')

  const fetchData = async () => {
    try {
        const [resVeiculos, resClientes] = await Promise.all([
          api.get<Veiculo[]>('/veiculos/'),
          api.get<Cliente[]>('/clientes/')
        ])
        setVeiculos(resVeiculos.data); setClientes(resClientes.data)
    } catch(e) { console.error(e) }
  }
  useEffect(() => { fetchData() }, [])

  const handleSalvar = async () => {
    try {
        await api.post('/veiculos/', { marca, modelo, placa, ano: parseInt(ano), cliente_id: parseInt(clienteId) })
        toast({ title: 'Veículo cadastrado!', status: 'success' })
        setMarca(''); setModelo(''); setPlaca(''); setAno(''); setClienteId(''); onClose(); fetchData()
    } catch(e) { toast({ title: 'Erro', status: 'error' }) }
  }

  const getNomeCliente = (id: number) => clientes.find(c => c.id === id)?.nome || 'Desconhecido'

  return (
    <Box>
      <Flex mb={8} bg={cardBg} p={4} borderRadius="xl" shadow="sm" align="center" border="1px solid" borderColor={borderColor}>
        <HStack>
            <Box p={2} bg="brand.500" borderRadius="lg" color="white"><FaCarSide size={20} /></Box>
            <Heading size="md" color={textColor}>Frota de Veículos</Heading>
        </HStack>
        <Spacer />
        <Button leftIcon={<AddIcon />} colorScheme="brand" size="sm" onClick={onOpen}>Novo Veículo</Button>
      </Flex>

      <Box bg={cardBg} borderRadius="xl" shadow="sm" overflow="hidden" border="1px solid" borderColor={borderColor}>
        <Table variant="simple">
          <Thead bg={tableHeaderBg}>
            <Tr>
              <Th color={textColor}>Veículo</Th><Th color={textColor}>Placa</Th><Th color={textColor}>Proprietário</Th><Th isNumeric color={textColor}>Ano</Th><Th isNumeric color={textColor}>Ações</Th>
            </Tr>
          </Thead>
          <Tbody>
            {veiculos.map(carro => (
              <Tr key={carro.id} _hover={{ bg: tableHeaderBg }}>
                <Td fontWeight="bold" color={textColor}>{carro.marca} {carro.modelo}</Td>
                <Td><Badge variant="outline" colorScheme="purple">{carro.placa.toUpperCase()}</Badge></Td>
                <Td color="gray.500">{getNomeCliente(carro.cliente_id)}</Td>
                <Td isNumeric color={textColor}>{carro.ano}</Td>
                <Td isNumeric><Button size="xs" variant="ghost">Histórico</Button></Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
      {/* ... (O Modal permanece basicamente igual, só certifique-se de que os estados batem) ... */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay backdropFilter='blur(2px)' />
        <ModalContent bg={cardBg}>
          <ModalHeader color={textColor}>Adicionar Veículo</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Flex gap={4}>
                <FormControl isRequired>
                    <FormLabel>Marca</FormLabel>
                    <Input value={marca} onChange={e => setMarca(e.target.value)} />
                </FormControl>
                <FormControl isRequired>
                    <FormLabel>Modelo</FormLabel>
                    <Input value={modelo} onChange={e => setModelo(e.target.value)} />
                </FormControl>
            </Flex>
            <Flex gap={4} mt={4}>
                <FormControl isRequired w="40%">
                    <FormLabel>Placa</FormLabel>
                    <Input value={placa} onChange={e => setPlaca(e.target.value)} />
                </FormControl>
                <FormControl isRequired w="30%">
                    <FormLabel>Ano</FormLabel>
                    <Input type="number" value={ano} onChange={e => setAno(e.target.value)} />
                </FormControl>
            </Flex>
            <FormControl mt={4} isRequired>
                <FormLabel>Proprietário</FormLabel>
                <Select placeholder="Selecione..." value={clienteId} onChange={e => setClienteId(e.target.value)}>
                    {clientes.map(c => (<option key={c.id} value={c.id}>{c.nome}</option>))}
                </Select>
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
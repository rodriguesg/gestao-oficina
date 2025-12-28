import { useEffect, useState } from 'react'
import {
  Box, Heading, Table, Thead, Tbody, Tr, Th, Td,
  useColorModeValue, Badge, Flex
} from '@chakra-ui/react'
import api from '../services/api'

interface Pagamento {
  id: number;
  data_pagamento: string;
  valor: number;
  forma_pagamento: string;
  ordem_servico_id: number;
}

export default function Financeiro() {
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([])
  const bgCard = useColorModeValue('white', 'gray.800')

  useEffect(() => {
    // Busca todos os pagamentos
    // Se essa rota nao existir no backend, dará 404. Vamos garantir que exista.
    api.get('/pagamentos/')
       .then(res => setPagamentos(res.data))
       .catch(err => console.error("Erro financeiro", err))
  }, [])

  return (
    <Box>
      <Heading size="lg" mb={6}>Financeiro - Entradas</Heading>
      
      <Box bg={bgCard} p={4} borderRadius="xl" shadow="sm">
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Data</Th>
              <Th>Ref. OS</Th>
              <Th>Forma</Th>
              <Th isNumeric>Valor</Th>
            </Tr>
          </Thead>
          <Tbody>
            {pagamentos.map(pag => (
              <Tr key={pag.id}>
                <Td>{new Date(pag.data_pagamento).toLocaleDateString()}</Td>
                <Td>
                    <Badge colorScheme="purple">OS #{pag.ordem_servico_id}</Badge>
                </Td>
                <Td>{pag.forma_pagamento}</Td>
                <Td isNumeric fontWeight="bold" color="green.500">
                    R$ {Number(pag.valor).toFixed(2)}
                </Td>
              </Tr>
            ))}
            {pagamentos.length === 0 && <Tr><Td colSpan={4} textAlign="center">Nenhum registro.</Td></Tr>}
          </Tbody>
        </Table>
      </Box>
    </Box>
  )
}
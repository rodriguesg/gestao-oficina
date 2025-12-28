import { useEffect, useState } from 'react'
import { Box, SimpleGrid, Stat, StatLabel, StatNumber, StatHelpText, Icon, Flex, useColorModeValue } from '@chakra-ui/react'
import { FaMoneyBillWave, FaClipboardList, FaCar, FaUsers } from 'react-icons/fa'
import api from '../services/api'
import type { OSResumo, Cliente } from '../types'

export default function Dashboard() {
  const [totalFaturamento, setTotalFaturamento] = useState(0)
  const [osAbertas, setOsAbertas] = useState(0)
  const [totalClientes, setTotalClientes] = useState(0)

  const bgCard = useColorModeValue('white', 'gray.800')

  const carregarDados = async () => {
    try {
      const [resOS, resClientes] = await Promise.all([
        api.get<OSResumo[]>('/os/'),
        api.get<Cliente[]>('/clientes/')
      ])

      const listaOS = resOS.data
      
      const abertas = listaOS.filter(os => os.status !== 'FINALIZADO').length
      setOsAbertas(abertas)
      
      setTotalClientes(resClientes.data.length)

    } catch (error) {
      console.error("Erro ao carregar dashboard", error)
    }
  }

  const carregarFinanceiro = async () => {
      try {
          const { data } = await api.get('/pagamentos/') // Precisamos garantir que essa rota exista
          const total = data.reduce((acc: number, curr: any) => acc + Number(curr.valor), 0)
          setTotalFaturamento(total)
      } catch (error) {
          console.log("Sem dados financeiros ainda")
      }
  }

  useEffect(() => {
    carregarDados()
    carregarFinanceiro()
  }, [])

  const CardEstatistica = ({ label, valor, icon, help, color }: any) => (
    <Stat bg={bgCard} p={5} shadow="sm" borderRadius="lg" borderLeft="4px solid" borderColor={color}>
      <Flex justifyContent="space-between">
        <Box>
          <StatLabel color="gray.500">{label}</StatLabel>
          <StatNumber fontSize="2xl">{valor}</StatNumber>
          {help && <StatHelpText>{help}</StatHelpText>}
        </Box>
        <Icon as={icon} w={8} h={8} color={color} />
      </Flex>
    </Stat>
  )

  return (
    <Box>
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
        <CardEstatistica 
            label="Faturamento Total" 
            valor={`R$ ${totalFaturamento.toFixed(2)}`} 
            icon={FaMoneyBillWave} 
            color="green.400" 
        />
        <CardEstatistica 
            label="OS em Aberto" 
            valor={osAbertas} 
            icon={FaClipboardList} 
            help="Requer atenção"
            color="orange.400" 
        />
        <CardEstatistica 
            label="Clientes Ativos" 
            valor={totalClientes} 
            icon={FaUsers} 
            color="blue.400" 
        />
        <CardEstatistica 
            label="Veículos na Oficina" 
            valor={osAbertas} // Geralmente 1 carro por OS aberta
            icon={FaCar} 
            color="purple.400" 
        />
      </SimpleGrid>
    </Box>
  )
}
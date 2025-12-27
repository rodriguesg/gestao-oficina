import { useEffect, useState } from 'react'
import {
  Box, Flex, Heading, Text, Badge, Button, Grid, VStack,
  useColorModeValue, IconButton, HStack, Avatar, Spacer,
  useToast, Menu, MenuButton, MenuList, MenuItem, Icon
} from '@chakra-ui/react'
import { AddIcon, SettingsIcon, CheckCircleIcon } from '@chakra-ui/icons'
import { FaTools, FaMoneyBillWave, FaClock } from 'react-icons/fa'
import axios from 'axios'

// --- INTERFACE MAPEADA PARA SEU PYTHON ---
interface Pagamento {
  valor: number;
}

interface OS {
  id: number;
  data_abertura: string;
  status: string; // Vem como "ORCAMENTO", "EXECUCAO", etc.
  defeito_reclamado: string; 
  cliente_id: number;
  veiculo_id: number;
  pagamentos: Pagamento[]; // O valor está aqui dentro
}

// Mapeamento para os status que você definiu no Python
const STATUS_CONFIG: any = {
  "ORCAMENTO": { label: 'Aguardando Orçamento', color: 'yellow', icon: FaClock },
  "EXECUCAO": { label: 'Em Execução', color: 'blue', icon: FaTools },
  "FINALIZADO": { label: 'Finalizado', color: 'green', icon: CheckCircleIcon },
}

export default function OrdensServico() {
  const [listaOS, setListaOS] = useState<OS[]>([])
  const toast = useToast()

  const bgColumn = useColorModeValue('gray.100', 'gray.900')
  const bgCard = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

  const fetchOS = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/os/')
      setListaOS(response.data)
    } catch (error) {
      console.error("Erro ao buscar OS", error)
    }
  }

  useEffect(() => { fetchOS() }, [])

  const moverOS = async (id: number, novoStatus: string) => {
    try {
        await axios.put(`http://127.0.0.1:8000/os/${id}`, { status: novoStatus })
        toast({ title: 'Status atualizado!', status: 'success', duration: 2000 })
        fetchOS()
    } catch (error) {
        toast({ title: 'Erro ao atualizar.', status: 'error' })
    }
  }

  const KanbanColumn = ({ statusKey }: { statusKey: string }) => {
    const config = STATUS_CONFIG[statusKey] || { label: statusKey, color: 'gray', icon: FaClock }
    
    // Filtra comparando com o status exato do banco (Maiúsculas)
    const itens = listaOS.filter(os => os.status === statusKey)

    return (
      <Flex direction="column" h="full" minH="500px" bg={bgColumn} p={3} borderRadius="xl" border="1px solid" borderColor={borderColor}>
        <Flex align="center" mb={4} p={2}>
            <Icon as={config.icon} color={`${config.color}.500`} mr={2} />
            <Text fontWeight="bold" fontSize="sm" color="gray.500" textTransform="uppercase">{config.label}</Text>
            <Spacer />
            <Badge borderRadius="full" px={2} colorScheme={config.color}>{itens.length}</Badge>
        </Flex>

        <VStack spacing={3} align="stretch">
            {itens.map(os => {
                // SOMA DOS PAGAMENTOS PARA EXIBIR NO CARD
                const totalOS = os.pagamentos?.reduce((acc, p) => acc + Number(p.valor), 0) || 0;

                return (
                    <Box key={os.id} bg={bgCard} p={4} borderRadius="lg" boxShadow="sm" border="1px solid" borderColor="transparent" _hover={{ borderColor: 'brand.500' }}>
                        <Flex justify="space-between" mb={2}>
                            <Badge variant="subtle">OS #{os.id}</Badge>
                            <Menu>
                                <MenuButton as={IconButton} icon={<SettingsIcon />} size="xs" variant="ghost" />
                                <MenuList>
                                    <MenuItem onClick={() => moverOS(os.id, 'ORCAMENTO')}>Mover p/ Orçamento</MenuItem>
                                    <MenuItem onClick={() => moverOS(os.id, 'EXECUCAO')}>Mover p/ Execução</MenuItem>
                                    <MenuItem onClick={() => moverOS(os.id, 'FINALIZADO')}>Finalizar</MenuItem>
                                </MenuList>
                            </Menu>
                        </Flex>
                        
                        <Text fontWeight="bold" fontSize="sm" mb={1} noOfLines={2}>
                            {os.defeito_reclamado}
                        </Text>
                        
                        <HStack fontSize="xs" color="gray.500" mb={3}>
                            <Icon as={FaMoneyBillWave} color="green.400" />
                            {/* CORREÇÃO DO TOFIXED: Valor protegido contra undefined */}
                            <Text>R$ {totalOS.toFixed(2)}</Text>
                            <Spacer />
                            <Text>{new Date(os.data_abertura).toLocaleDateString()}</Text>
                        </HStack>

                        <HStack borderTop="1px solid" borderColor={borderColor} pt={3}>
                            <Avatar size="xs" name={`C${os.cliente_id}`} bg="brand.500" /> 
                            <Text fontSize="xs" fontWeight="bold">Veículo ID: {os.veiculo_id}</Text>
                        </HStack>
                    </Box>
                )
            })}
        </VStack>
      </Flex>
    )
  }

  return (
    <Box h="calc(100vh - 100px)">
      <Flex mb={6} align="center">
        <Heading size="md">Fluxo de Trabalho</Heading>
        <Spacer />
        <Button leftIcon={<AddIcon />} colorScheme="brand" size="sm">Nova OS</Button>
      </Flex>

      <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={6} h="full">
        {/* Passando os nomes exatos que estão no seu banco (Maiúsculas) */}
        <KanbanColumn statusKey="ORCAMENTO" />
        <KanbanColumn statusKey="EXECUCAO" />
        <KanbanColumn statusKey="FINALIZADO" />
      </Grid>
    </Box>
  )
}
import React from 'react'
import {
  Box, Flex, Text, Icon, useColorModeValue, 
  Switch, HStack, useColorMode, Avatar, VStack
} from '@chakra-ui/react'
import { Link, useLocation } from 'react-router-dom'
import { FaChartLine, FaUser, FaCar, FaTools, FaMoneyBillWave, FaSignOutAlt, FaMoon, FaSun, FaBoxes } from 'react-icons/fa'

// --- Componente do Item de Menu ---
interface NavItemProps {
  icon: any
  children: React.ReactNode
  to: string
}

const NavItem = ({ icon, children, to }: NavItemProps) => {
  const location = useLocation()
  const active = location.pathname === to
  
  // Cores dinâmicas
  const activeBg = 'brand.500'
  const inactiveColor = useColorModeValue('gray.600', 'gray.400')
  const hoverBg = useColorModeValue('gray.100', 'whiteAlpha.100')

  return (
    <Link to={to} style={{ textDecoration: 'none' }}>
      <Flex
        align="center"
        p="3" // Padding um pouco menor para ficar mais elegante
        mx="4"
        my="1" // Margem vertical para eles não se encavalarem!
        borderRadius="lg"
        role="group"
        cursor="pointer"
        bg={active ? activeBg : 'transparent'}
        color={active ? 'white' : inactiveColor}
        fontWeight={active ? 'bold' : 'medium'}
        _hover={{
          bg: active ? activeBg : hoverBg,
          color: active ? 'white' : useColorModeValue('brand.500', 'white'),
        }}
        transition="all 0.2s"
      >
        <Icon mr="4" fontSize="18" as={icon} color={active ? 'white' : 'brand.500'} />
        <Text fontSize="sm">{children}</Text>
      </Flex>
    </Link>
  )
}

// --- Componente Principal da Sidebar ---
interface SidebarProps {
  children: React.ReactNode
}

export default function Sidebar({ children }: SidebarProps) {
  const { colorMode, toggleColorMode } = useColorMode()
  
  // Cores do fundo da sidebar baseadas no tema
  const sidebarBg = useColorModeValue('lightPalette.bgSidebar', 'darkPalette.bgSidebar')
  const sidebarBorder = useColorModeValue('gray.200', 'transparent')

  return (
    <Flex h="100vh" overflow="hidden">
      
      {/* --- ÁREA LATERAL --- */}
      <Box
        w="240px"
        bg={sidebarBg}
        borderRight="1px solid"
        borderColor={sidebarBorder}
        display={{ base: 'none', md: 'flex' }}
        flexDir="column"
        justifyContent="space-between"
        py={5}
        boxShadow={useColorModeValue('sm', 'none')} // Sombra suave só no modo light
      >
        <Box>
          {/* Logo */}
          <Flex alignItems="center" px="8" mb={8}>
             <Icon as={FaTools} color="brand.500" w={8} h={8} mr={3} />
             <Text fontSize="xl" fontWeight="extrabold" letterSpacing="tight">
               OFICINA.PRO
             </Text>
          </Flex>
          
          {/* Links de Navegação */}
          <VStack align="stretch" spacing={1}>
            <NavItem icon={FaChartLine} to="/">Dashboard</NavItem>
            <NavItem icon={FaUser} to="/clientes">Clientes</NavItem>
            <NavItem icon={FaCar} to="/veiculos">Veículos</NavItem>
            <NavItem icon={FaTools} to="/os">Ordens de Serviço</NavItem>
            <NavItem icon={FaMoneyBillWave} to="/financeiro">Financeiro</NavItem>
            <NavItem icon={FaBoxes} to="/estoque">Estoque</NavItem>
          </VStack>
        </Box>

        {/* Área Inferior (Perfil e Toggle) */}
        <Box px="4">
           {/* Botão de Sair */}
           <NavItem icon={FaSignOutAlt} to="/logout">Sair</NavItem>
           
           {/* Divider */}
           <Box borderTop="1px solid" borderColor={useColorModeValue('gray.200', 'whiteAlpha.200')} my={4} mx={4} />

           {/* Toggle de Tema e Perfil Resumido */}
           <HStack justify="space-between" px={4} py={2} bg={useColorModeValue('gray.50', 'whiteAlpha.100')} borderRadius="lg">
              <HStack>
                <Avatar size="xs" name="Admin User" bg="brand.500"/>
                <Text fontSize="xs" fontWeight="bold">Tema</Text>
              </HStack>
              <HStack spacing={1} align="center">
                 <Icon as={FaSun} boxSize={3} color={colorMode === 'light' ? 'brand.500' : 'gray.500'} />
                 <Switch 
                    size="sm" 
                    colorScheme="purple" 
                    isChecked={colorMode === 'dark'} 
                    onChange={toggleColorMode}
                 />
                 <Icon as={FaMoon} boxSize={3} color={colorMode === 'dark' ? 'brand.500' : 'gray.500'} />
              </HStack>
           </HStack>
        </Box>
      </Box>

      {/* --- CONTEÚDO PRINCIPAL DA TELA --- */}
      {/* O fundo aqui já muda automaticamente graças ao theme.ts */}
      <Box flex="1" overflowY="auto" p={6}>
        {children}
      </Box>
    </Flex>
  )
}
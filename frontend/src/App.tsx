import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Clientes from './pages/Clientes'
import Veiculos from './pages/Veiculos'
import OrdensServico from './pages/OrdensServico'
import Estoque from './pages/Estoque'
import { Box, Heading, Text } from '@chakra-ui/react'

// Páginas "Placeholder" (Só para não dar erro 404 enquanto não criamos)
const Dashboard = () => <Box><Heading>Bem-vindo à Oficina</Heading><Text>Resumo do dia aqui...</Text></Box>
const Financeiro = () => <Box><Heading>Financeiro</Heading><Text>Em construção...</Text></Box>

function App() {
  return (
    <Router>
      <Sidebar>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/veiculos" element={<Veiculos />} />
          <Route path="/os" element={<OrdensServico />} />
          <Route path="/financeiro" element={<Financeiro />} />
          <Route path="/estoque" element={<Estoque />} />
        </Routes>
      </Sidebar>
    </Router>
  )
}

export default App
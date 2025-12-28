import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Clientes from './pages/Clientes'
import Veiculos from './pages/Veiculos'
import OrdensServico from './pages/OrdensServico'
import Estoque from './pages/Estoque'
import Dashboard from './pages/Dashboard'
import Financeiro from './pages/Financeiro'

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
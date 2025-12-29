import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import Login from './pages/Login'

//Paginas
import Sidebar from './components/Sidebar'
import Clientes from './pages/Clientes'
import Veiculos from './pages/Veiculos'
import OrdensServico from './pages/OrdensServico'
import Estoque from './pages/Estoque'
import Dashboard from './pages/Dashboard'
import Financeiro from './pages/Financeiro'

const PrivateLayout = () => {
  const token = localStorage.getItem('@OficinaPro:token');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Sidebar>
      <Outlet />
    </Sidebar>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<PrivateLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/veiculos" element={<Veiculos />} />
          <Route path="/os" element={<OrdensServico />} />
          <Route path="/financeiro" element={<Financeiro />} />
          <Route path="/estoque" element={<Estoque />} />
        </Route>
        
        <Route path="/logout" element={<Logout />} />
      </Routes>
    </Router>
  )
}

function Logout() {
    localStorage.removeItem('@OficinaPro:token');
    return <Navigate to="/login" />;
}

export default App
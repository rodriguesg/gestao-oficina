import { useState } from 'react';
import {
  Flex, Box, FormControl, FormLabel, Input, Button, Heading, useToast, useColorModeValue
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const toast = useToast();
  const navigate = useNavigate();
  const bgCard = useColorModeValue('white', 'gray.700');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // FastAPI OAuth2 exige dados como Form URL Encoded
      const params = new URLSearchParams();
      params.append('username', username);
      params.append('password', password);

      const { data } = await api.post('/auth/token', params);

      // Salva o token
      localStorage.setItem('@OficinaPro:token', data.access_token);
      
      toast({ title: 'Bem-vindo!', status: 'success', duration: 2000 });
      navigate('/'); // Vai para o Dashboard
      window.location.reload(); // Recarrega para o App pegar o novo estado (opcional mas seguro)

    } catch (error) {
      toast({ 
        title: 'Falha no login', 
        description: 'Verifique usuário e senha.', 
        status: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Flex minH="100vh" align="center" justify="center" bg={useColorModeValue('gray.50', 'gray.900')}>
      <Box 
        bg={bgCard} 
        p={8} 
        borderRadius="lg" 
        boxShadow="lg" 
        w="full" 
        maxW="md"
        border="1px solid"
        borderColor={useColorModeValue('gray.200', 'gray.600')}
      >
        <Heading size="lg" textAlign="center" mb={6} color="brand.500">Oficina.Pro</Heading>
        
        <form onSubmit={handleLogin}>
          <FormControl id="username" mb={4} isRequired>
            <FormLabel>Usuário</FormLabel>
            <Input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              placeholder="admin"
            />
          </FormControl>
          
          <FormControl id="password" mb={6} isRequired>
            <FormLabel>Senha</FormLabel>
            <Input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
            />
          </FormControl>
          
          <Button 
            type="submit" 
            colorScheme="brand" 
            w="full" 
            isLoading={loading}
          >
            Entrar
          </Button>
        </form>
      </Box>
    </Flex>
  );
}
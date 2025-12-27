import React from 'react'
import ReactDOM from 'react-dom/client'
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react'
import App from './App.tsx'
import { theme } from './theme/theme'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* Isso ajuda a evitar "piscadas" de tema branco ao carregar a página */}
    <ColorModeScript initialColorMode={theme.config.initialColorMode} />
    
    {/* Passamos o tema para o Provider */}
    <ChakraProvider theme={theme}>
      <App />
    </ChakraProvider>
  </React.StrictMode>,
)
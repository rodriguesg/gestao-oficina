import { extendTheme, type ThemeConfig } from '@chakra-ui/react'
import { mode } from '@chakra-ui/theme-tools'

const config: ThemeConfig = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
}

// 1. DEFINIÇÃO DA FONTE (NOVO)
const fonts = {
  heading: "'Plus Jakarta Sans', sans-serif",
  body: "'Plus Jakarta Sans', sans-serif",
}

const colors = {
  brand: {
    500: '#6C5DD3',
    600: '#5a4dbf',
  },
  darkPalette: {
    bgMain: '#161925',
    bgSidebar: '#1E2130',
    textMuted: '#A0AEC0',
  },
  lightPalette: {
    bgMain: '#F7F8FC',
    bgSidebar: '#FFFFFF',
    textMuted: '#718096',
  }
}

const styles = {
  global: (props: any) => ({
    body: {
      bg: mode(colors.lightPalette.bgMain, colors.darkPalette.bgMain)(props),
      color: mode('gray.800', 'white')(props),
    },
  }),
}

const components = {
  Input: {
    variants: {
      filled: (props: any) => ({
        field: {
           bg: mode('gray.100', 'whiteAlpha.100')(props),
           _hover: {
             bg: mode('gray.200', 'whiteAlpha.200')(props)
           },
           _focus: {
            bg: mode('white', 'whiteAlpha.300')(props),
            borderColor: "brand.500"
           }
        }
      })
    },
    defaultProps: {
      variant: 'filled'
    }
  },
  Select: {
    defaultProps: {
      variant: 'filled'
    }
  }
}

// Não esqueça de incluir "fonts" aqui no final!
export const theme = extendTheme({ config, fonts, colors, styles, components })
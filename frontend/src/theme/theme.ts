import { extendTheme, type ThemeConfig } from '@chakra-ui/react'
import { mode } from '@chakra-ui/theme-tools'

const config: ThemeConfig = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
}

const fonts = {
  heading: "'Plus Jakarta Sans', sans-serif",
  body: "'Plus Jakarta Sans', sans-serif",
}

const colors = {
  brand: {
    50: '#f2f0ff',
    100: '#e1dbff',
    200: '#c4baff',
    300: '#a191ff',
    400: '#8262ff',
    500: '#6C5DD3', // Nossa cor principal
    600: '#5a4dbf',
    700: '#4a3f9e',
    800: '#3a327d',
    900: '#2a255c',
  },
  // ... outras cores se houver
}

const components = {
  // CONFIGURAÇÃO DAS TABS PARA PEGAR A COR BRAND
  Tabs: {
    baseStyle: (props: any) => ({
      tab: {
        _selected: {
          color: mode('brand.500', 'brand.200')(props),
          borderColor: mode('brand.500', 'brand.200')(props),
        },
      },
    }),
    variants: {
      'soft-rounded': (props: any) => ({
        tab: {
          _selected: {
            color: 'white',
            bg: 'brand.500',
          },
        },
      }),
    },
  },
  // Ajuste nos Inputs para não ficarem "apagados"
  Input: {
    defaultProps: { variant: 'filled' },
  },
}

export const theme = extendTheme({ config, fonts, colors, components })
import { createTheme } from '@mui/material/styles'

const backgroundPrimary = '#0c0a18'
const backgroundPaper = '#120c27'
const primaryMain = '#a16bff'
const accentMain = '#f7d046'
const secondaryMain = '#65eccc'
const infoMain = '#7da7ff'

export const theme = createTheme({
  direction: 'rtl',
  shape: {
    borderRadius: 14,
  },
  palette: {
    mode: 'dark',
    primary: {
      main: primaryMain,
    },
    secondary: {
      main: secondaryMain,
    },
    warning: {
      main: accentMain,
    },
    info: {
      main: infoMain,
    },
    background: {
      default: backgroundPrimary,
      paper: backgroundPaper,
    },
    text: {
      primary: '#f4edff',
      secondary: '#cbbde6',
    },
    divider: 'rgba(255,255,255,0.12)',
  },
  typography: {
    fontFamily: '"IRANYekanX", "Inter", "Vazirmatn", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 800 },
    h2: { fontWeight: 800 },
    h3: { fontWeight: 800 },
    button: { fontWeight: 700 },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'linear-gradient(135deg, rgba(20,14,36,0.95), rgba(11,8,24,0.9))',
          border: '1px solid rgba(153,126,255,0.25)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 12,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
      },
    },
  },
})

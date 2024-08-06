import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#D8C3A5', // Beige
    },
    secondary: {
      main: '#8E8D8A', // Gray
    },
    background: {
      default: '#EAE7DC', // Light Beige
      paper: '#FFFFFF',
    },
    text: {
      primary: '#8E8D8A', // Gray
      secondary: '#D8C3A5', // Beige
    },
    action: {
      active: '#E98074', // Light Red
    },
    error: {
      main: '#f44336',
    },
    warning: {
      main: '#ff9800',
    },
    info: {
      main: '#2196f3',
    },
    success: {
      main: '#4caf50',
    },
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
    h6: {
      color: '#000000', // AppBar Title
    },
    body1: {
      color: '#000000', // Body text
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#D8C3A5', // AppBar color
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px', // Rounded corners for buttons
          textTransform: 'none', // Avoid all caps
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          padding: '8px', // Add padding to Paper component
          borderRadius: '8px', // Rounded corners for Paper
        },
      },
    },
  },
});

export default theme;

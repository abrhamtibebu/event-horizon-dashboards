import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { AuthProvider } from './hooks/use-auth'
import { ThemeProvider } from './components/theme-provider'

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error('Failed to find the root element');

createRoot(rootElement).render(
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="vite-ui-theme">
    <AuthProvider>
      <App />
    </AuthProvider>
  </ThemeProvider>
);

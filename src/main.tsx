import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './hooks/use-auth'
import { ThemeProvider } from './components/theme-provider'

createRoot(document.getElementById("root")!).render(
<ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="vite-ui-theme">
<AuthProvider>
<App />
</AuthProvider>
</ThemeProvider>
);

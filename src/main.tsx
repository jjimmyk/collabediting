import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@arcgis/core/assets/esri/themes/light/main.css'
import './index.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { AppShell } from '@/AppShell'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  </StrictMode>,
)

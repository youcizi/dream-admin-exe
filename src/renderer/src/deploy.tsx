import './assets/main.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import DeployApp from './components/Deploy/DeployApp'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DeployApp />
  </StrictMode>
)

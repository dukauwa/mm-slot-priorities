import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import SlotPriorities from './SlotPriorities.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SlotPriorities />
  </StrictMode>,
)

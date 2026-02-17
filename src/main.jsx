import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import SlotPriorities from './SlotPriorities.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SlotPriorities />
  </StrictMode>,
)

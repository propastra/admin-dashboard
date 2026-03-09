import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CityProvider } from './context/CityContext'
import { InquiryPopupProvider } from './context/InquiryPopupContext'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CityProvider>
          <InquiryPopupProvider>
            <App />
          </InquiryPopupProvider>
        </CityProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)

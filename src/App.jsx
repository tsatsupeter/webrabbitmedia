import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import Layout from './components/Layout'
import Home from './pages/Home'
import About from './pages/About'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import Powered from './pages/Powered'
import Auth from './pages/Auth'
import MerchantLayout from './merchant/MerchantLayout'
import GetStarted from './merchant/pages/GetStarted'
import Verification from './merchant/pages/Verification'
import MerchantHome from './merchant/pages/MerchantHome'
import Analytics from './merchant/pages/Analytics'
import Sentra from './merchant/pages/Sentra'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <Toaster theme="dark" position="top-center" richColors />
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="privacy" element={<Privacy />} />
          <Route path="terms" element={<Terms />} />
          <Route path="powered" element={<Powered />} />
          <Route path="auth" element={<Auth />} />
        </Route>
        <Route path="/merchant" element={<ProtectedRoute><MerchantLayout /></ProtectedRoute>}>
          <Route index element={<GetStarted />} />
          <Route path="verification" element={<Verification />} />
          <Route path="home" element={<MerchantHome />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="sentra" element={<Sentra />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App

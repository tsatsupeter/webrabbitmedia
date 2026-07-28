import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import Layout from './components/Layout'
import Home from './pages/Home'
import About from './pages/About'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import Powered from './pages/Powered'
import Auth from './pages/Auth'
import CreateBusiness from './pages/CreateBusiness'
import MerchantLayout from './merchant/MerchantLayout'
import GetStarted from './merchant/pages/GetStarted'
import Verification from './merchant/pages/Verification'
import ProductInformation from './merchant/pages/ProductInformation'
import IdentityVerification from './merchant/pages/IdentityVerification'
import BusinessVerification from './merchant/pages/BusinessVerification'
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
        </Route>
        {/* Auth stands alone: no marketing navbar/footer */}
        <Route path="/auth" element={<Auth />} />
        <Route
          path="/auth/create-business"
          element={
            <ProtectedRoute>
              <CreateBusiness />
            </ProtectedRoute>
          }
        />
        <Route path="/merchant" element={<ProtectedRoute requireBusiness><MerchantLayout /></ProtectedRoute>}>

          <Route index element={<GetStarted />} />
          <Route path="verification" element={<Verification />} />
          <Route path="verification/product-information" element={<ProductInformation />} />
          <Route path="verification/identity" element={<IdentityVerification />} />
          <Route path="verification/business" element={<BusinessVerification />} />
          <Route path="home" element={<MerchantHome />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="sentra" element={<Sentra />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App

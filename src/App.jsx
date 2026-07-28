import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import About from './pages/About'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import Powered from './pages/Powered'
import MerchantLayout from './merchant/MerchantLayout'
import GetStarted from './merchant/pages/GetStarted'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="privacy" element={<Privacy />} />
          <Route path="terms" element={<Terms />} />
          <Route path="powered" element={<Powered />} />
        </Route>
        <Route path="/merchant" element={<MerchantLayout />}>
          <Route index element={<GetStarted />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App

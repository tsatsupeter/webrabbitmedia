import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import Layout from './components/Layout'
import Home from './pages/Home'
import About from './pages/About'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import Powered from './pages/Powered'
import Auth from './pages/Auth'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import CreateBusiness from './pages/CreateBusiness'
import Welcome from './pages/Welcome'
import MerchantLayout from './merchant/MerchantLayout'
import GetStarted from './merchant/pages/GetStarted'
import Verification from './merchant/pages/Verification'
import ProductInformation from './merchant/pages/ProductInformation'
import IdentityVerification from './merchant/pages/IdentityVerification'
import BusinessVerification from './merchant/pages/BusinessVerification'
import BankVerification from './merchant/pages/BankVerification'
import MerchantHome from './merchant/pages/MerchantHome'
import Analytics from './merchant/pages/Analytics'
import Docs from './pages/Docs'
import ApiKeys from './merchant/pages/developer/ApiKeys'
import Payments from './merchant/pages/transactions/Payments'
import Payouts from './merchant/pages/payouts/Payouts'
import Balances from './merchant/pages/payouts/Balances'
import History from './merchant/pages/payouts/History'
import Collect from './merchant/pages/sales/Collect'
import Settings from './merchant/pages/Settings'
import AcceptInvite from './pages/AcceptInvite'
import AcceptTransfer from './pages/AcceptTransfer'
import SmsLayout from './sms/SmsLayout'
import SmsOverview from './sms/pages/Overview'
import SmsQuickSend from './sms/pages/QuickSend'
import SmsCampaigns from './sms/pages/Campaigns'
import SmsCampaignDetail from './sms/pages/CampaignDetail'
import SmsMessageLog from './sms/pages/MessageLog'
import SmsSenderIds from './sms/pages/SenderIds'
import SmsContacts from './sms/pages/Contacts'
import SmsOtp from './sms/pages/Otp'
import SmsVoice from './sms/pages/Voice'
import SmsUssd from './sms/pages/Ussd'
import SmsWallet from './sms/pages/Wallet'
import SmsSettingsPage from './sms/pages/SmsSettings'

import StudioLayout from './studio/StudioLayout'
import StudioHome from './studio/pages/Home'
import StudioProjects from './studio/pages/Projects'
import StudioNewProject from './studio/pages/NewProject'
import StudioProjectDetail from './studio/pages/ProjectDetail'
import StudioInvoices from './studio/pages/Invoices'
import StudioCare from './studio/pages/Care'

import SmsApiKeys from './sms/pages/developer/ApiKeys'
import SmsAnalytics from './sms/pages/Analytics'

import AdminLayout from './admin/AdminLayout'
import AdminOverview from './admin/pages/Overview'
import AdminMerchants from './admin/pages/Merchants'
import AdminMerchantDetail from './admin/pages/MerchantDetail'
import AdminVerifications from './admin/pages/Verifications'
import AdminTransactions from './admin/pages/Transactions'
import AdminPayouts from './admin/pages/Payouts'
import AdminMessaging from './admin/pages/Messaging'
import AdminUsers from './admin/pages/Users'
import AdminSettings from './admin/pages/Settings'
import AdminAudit from './admin/pages/Audit'
import AdminDevelopers from './admin/pages/Developers'

import DevLayout from './dev/DevLayout'
import DevOverview from './dev/pages/Overview'
import DevProjects from './dev/pages/Projects'
import DevProjectDetail from './dev/pages/ProjectDetail'
import DevEarnings from './dev/pages/Earnings'
import DevProfile from './dev/pages/Profile'
import DeveloperApply from './pages/DeveloperApply'

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
        <Route path="/auth/forgot-password" element={<ForgotPassword />} />
        <Route path="/auth/reset-password" element={<ResetPassword />} />
        <Route path="/docs" element={<Docs />} />
        <Route path="/docs/:section" element={<Docs />} />
        <Route path="/team/accept" element={<AcceptInvite />} />
        <Route path="/transfer/:token" element={<AcceptTransfer />} />

        <Route
          path="/welcome"
          element={
            <ProtectedRoute>
              <Welcome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/welcome/software"
          element={
            <ProtectedRoute>
              <Navigate to="/studio" replace />
            </ProtectedRoute>
          }
        />
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
          <Route path="verification/bank" element={<BankVerification />} />
          <Route path="home" element={<MerchantHome />} />
          <Route path="analytics" element={<Analytics />} />
          
          <Route path="developer/api-keys" element={<ApiKeys />} />
          <Route path="transactions/payments" element={<Payments />} />
          <Route path="sales/collect" element={<Collect />} />
          <Route path="payouts" element={<Payouts />} />
          <Route path="payouts/balances" element={<Balances />} />
          <Route path="payouts/history" element={<History />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="/sms" element={<ProtectedRoute requireBusiness><SmsLayout /></ProtectedRoute>}>
          <Route index element={<SmsOverview />} />
          <Route path="send" element={<SmsQuickSend />} />
          <Route path="campaigns" element={<SmsCampaigns />} />
          <Route path="campaigns/:id" element={<SmsCampaignDetail />} />
          <Route path="messages" element={<SmsMessageLog />} />
          <Route path="sender-ids" element={<SmsSenderIds />} />
          <Route path="contacts" element={<SmsContacts />} />
          <Route path="otp" element={<SmsOtp />} />
          <Route path="voice" element={<SmsVoice />} />
          <Route path="ussd" element={<SmsUssd />} />
          <Route path="wallet" element={<SmsWallet />} />
          <Route path="analytics" element={<SmsAnalytics />} />
          <Route path="developer" element={<Navigate to="/sms/developer/api-keys" replace />} />
          <Route path="developer/api-keys" element={<SmsApiKeys />} />
          <Route path="settings" element={<SmsSettingsPage />} />

        </Route>

        <Route path="/studio" element={<ProtectedRoute><StudioLayout /></ProtectedRoute>}>
          <Route index element={<StudioHome />} />
          <Route path="new" element={<StudioNewProject />} />
          <Route path="projects" element={<StudioProjects />} />
          <Route path="projects/:id" element={<StudioProjectDetail />} />
          <Route path="invoices" element={<StudioInvoices />} />
          <Route path="care" element={<StudioCare />} />
        </Route>

        <Route path="/developers/apply" element={<DeveloperApply />} />

        <Route path="/dev" element={<ProtectedRoute><DevLayout /></ProtectedRoute>}>
          <Route index element={<DevOverview />} />
          <Route path="projects" element={<DevProjects />} />
          <Route path="projects/:id" element={<DevProjectDetail />} />
          <Route path="earnings" element={<DevEarnings />} />
          <Route path="profile" element={<DevProfile />} />
        </Route>

        <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
          <Route index element={<AdminOverview />} />
          <Route path="merchants" element={<AdminMerchants />} />
          <Route path="merchants/:id" element={<AdminMerchantDetail />} />
          <Route path="verifications" element={<AdminVerifications />} />
          <Route path="transactions" element={<AdminTransactions />} />
          <Route path="payouts" element={<AdminPayouts />} />
          <Route path="messaging" element={<AdminMessaging />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="developers" element={<AdminDevelopers />} />
          <Route path="audit" element={<AdminAudit />} />
        </Route>



      </Routes>
    </BrowserRouter>
  )
}

export default App

import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import UpisLandingPage from './pages/UpisLandingPage';
import RegistrationPageNew from './pages/RegistrationPageNew';
import ContractPageNew from './pages/ContractPageNew';
import ThankYouPage from './pages/ThankYouPage';
import CourseRegistrationPage from './pages/CourseRegistrationPage';
import AdminLogin from './pages/admin/AdminLogin';
import AdminForgotPassword from './pages/admin/AdminForgotPassword';
import AdminResetPassword from './pages/admin/AdminResetPassword';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminStudents from './pages/admin/AdminStudents';
import AdminContracts from './pages/admin/AdminContracts';
import AdminTemplates from './pages/admin/AdminTemplates';
import AdminPackages from './pages/admin/AdminPackages';
import AdminInvoices from './pages/admin/AdminInvoices';
import AdminLandingPages from './pages/admin/AdminLandingPages';
import AdminLayout from './components/AdminLayout';

function App() {
  return (
    <Routes>
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/forgot-password" element={<AdminForgotPassword />} />
      <Route path="/admin/reset-password" element={<AdminResetPassword />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="students" element={<AdminStudents />} />
        <Route path="contracts" element={<AdminContracts />} />
        <Route path="invoices" element={<AdminInvoices />} />
        <Route path="packages" element={<AdminPackages />} />
        <Route path="landing-pages" element={<AdminLandingPages />} />
        <Route path="templates" element={<AdminTemplates />} />
      </Route>

      <Route path="/" element={<LandingPage />} />
      <Route path="/upis" element={<UpisLandingPage />} />
      <Route path="/upis/:slug" element={<CourseRegistrationPage />} />
      <Route path="/registracija" element={<RegistrationPageNew />} />
      <Route path="/ugovor" element={<ContractPageNew />} />
      <Route path="/hvala" element={<ThankYouPage />} />
      <Route path="/:slug" element={<CourseRegistrationPage />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;

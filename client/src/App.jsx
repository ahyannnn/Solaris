import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SolarisLandingPage from './pages/Auth/landingpage';
import LoginPage from './pages/Auth/loginpage';
import RegisterPage from './pages/Auth/registerpage';
import ForgotPage from './pages/Auth/forgotpage';
import Dashboard from "./pages/Dashboard_Layout/dashboard";
import AdminDashboard from './pages/Admin/dashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SolarisLandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgotpassword" element={<ForgotPage />} />
        
        {/* IISA LANG NA ROUTE - /dashboard LANG */}
        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/dashboard/AdminDashboard" element={<AdminDashboard />} />


      </Routes>
    </Router>
  );
}

export default App;
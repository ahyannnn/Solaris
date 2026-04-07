// App.jsx - Updated with Maintenance integration
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';

import SolarisLandingPage from './pages/Auth/landingpage';
import LoginPage from './pages/Auth/loginpage';
import RegisterPage from './pages/Auth/registerpage';
import ForgotPage from './pages/Auth/forgotpage';
import TermsPage from './assets/termspage'; // Import TermsPage

import DashboardLayout from "./pages/Dashboard_Layout/dashboard";
import SetupAccount from "./pages/Customer/setupacc";

import AccountSetupGuard from './guards/AccountSetupGuard';

// Admin Pages
import AdminDashboard from './pages/Admin/dashboard';
import SiteAssessment from './pages/Admin/siteassessment';
import Project from './pages/Admin/project';
import AdminBilling from './pages/Admin/billing';
import SolarInvoices from './pages/Admin/solarInvoices';
import IoTDevice from './pages/Admin/iotdevice';
import Reports from './pages/Admin/reports';
import UserManagement from './pages/Admin/usermanagement';
import Settings from './pages/Admin/settings';
import FreeQuotes from './pages/Admin/freequotes';
import PreAssessment from './pages/Admin/preassessments';
import Schedule from './pages/Admin/schedule';
import Maintenance from './pages/Admin/Maintenance';
import SystemConfig from './pages/Admin/SystemConfig';

// Engineer Pages
import EngineerDashboard from './pages/Engineer/dashboard';
import EngineerSiteAssessment from './pages/Engineer/siteassessment';
import EngineerProject from './pages/Engineer/project';
import EngineerIoTDevice from './pages/Engineer/iotdevice';
import EngineerReports from './pages/Engineer/reports';
import EngineerProfile from './pages/Engineer/profile';
import EngineerQuotation from './pages/Engineer/quotation';
import EngineerSchedule from './pages/Engineer/schedule';

// Customer Pages
import CustomerDashboard from './pages/Customer/dashboard';
import ScheduleAssessment from './pages/Customer/scheduleassessment';
import MyProject from './pages/Customer/myproject';
import Quotation from './pages/Customer/quotation';
import Supports from './pages/Customer/supports';
import CustomerProfile from './pages/Customer/profile';
import CustomerSettings from './pages/Customer/customersettings';
import PaymentSuccess from './pages/Customer/PaymentSuccess';
import PaymentCancel from './pages/Customer/PaymentCancel';

// Maintenance Page (public)
import MaintenancePage from './pages/Maintenance';

// Helper function to get user data from storage
const getUserData = () => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const role = localStorage.getItem('userRole') || sessionStorage.getItem('userRole');
  const name = localStorage.getItem('userName') || sessionStorage.getItem('userName');
  const email = localStorage.getItem('userEmail') || sessionStorage.getItem('userEmail');
  const photo = localStorage.getItem('userPhotoURL') || sessionStorage.getItem('userPhotoURL');
  
  return { token, role, name, email, photo };
};

// Role-based route guard
const RoleRouteGuard = ({ children, allowedRoles }) => {
  const { role: userRole, token } = getUserData();

  if (!token || !userRole) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(userRole)) {
    if (userRole === 'admin') return <Navigate to="/app/admin" replace />;
    if (userRole === 'engineer') return <Navigate to="/app/engineer" replace />;
    if (userRole === 'user') return <Navigate to="/app/customer" replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Maintenance Guard - checks if site is under maintenance
const MaintenanceGuard = ({ children }) => {
  const [isUnderMaintenance, setIsUnderMaintenance] = useState(false);
  const [loading, setLoading] = useState(true);
  const { role: userRole, token } = getUserData();

  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/maintenance/status`);
        const maintenanceData = response.data;
        
        if (maintenanceData.isUnderMaintenance) {
          if (userRole === 'admin') {
            setIsUnderMaintenance(false);
          } else {
            setIsUnderMaintenance(true);
          }
        } else {
          setIsUnderMaintenance(false);
        }
      } catch (error) {
        console.error('Error checking maintenance status:', error);
        setIsUnderMaintenance(false);
      } finally {
        setLoading(false);
      }
    };
    
    checkMaintenance();
  }, [userRole]);

  if (loading) {
    return <div className="loading-container">Checking system status...</div>;
  }

  if (isUnderMaintenance) {
    return <MaintenancePage />;
  }

  return children;
};

// Auth Guard for public routes - redirects to dashboard if already logged in
const PublicRouteGuard = ({ children }) => {
  const token = sessionStorage.getItem('token') || localStorage.getItem('token');
  const role = sessionStorage.getItem('userRole') || localStorage.getItem('userRole');
  
  if (token && role) {
    if (role === 'admin') return <Navigate to="/app/admin" replace />;
    if (role === 'engineer') return <Navigate to="/app/engineer" replace />;
    if (role === 'user') return <Navigate to="/app/customer" replace />;
  }
  
  return children;
};

function App() {
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const role = localStorage.getItem('userRole') || sessionStorage.getItem('userRole');
    setUserRole(role);
  }, []);

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/maintenance" element={<MaintenancePage />} />
        <Route path="/terms" element={<TermsPage />} /> {/* Terms Page Route */}
        
        <Route 
          path="/" 
          element={
            <PublicRouteGuard>
              <SolarisLandingPage />
            </PublicRouteGuard>
          } 
        />
        <Route 
          path="/login" 
          element={
            <PublicRouteGuard>
              <LoginPage />
            </PublicRouteGuard>
          } 
        />
        <Route 
          path="/register" 
          element={
            <PublicRouteGuard>
              <RegisterPage />
            </PublicRouteGuard>
          } 
        />
        <Route 
          path="/forgotpassword" 
          element={
            <PublicRouteGuard>
              <ForgotPage />
            </PublicRouteGuard>
          } 
        />

        {/* Setup Account */}
        <Route path="/setup" element={<SetupAccount />} />

        {/* Admin Routes */}
        <Route
          path="/app/admin"
          element={
            <MaintenanceGuard>
              <AccountSetupGuard>
                <RoleRouteGuard allowedRoles={['admin']}>
                  <DashboardLayout />
                </RoleRouteGuard>
              </AccountSetupGuard>
            </MaintenanceGuard>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="freequotes" element={<FreeQuotes />} />
          <Route path="preassessments" element={<PreAssessment />} />
          <Route path="siteassessment" element={<SiteAssessment />} />
          <Route path="project" element={<Project />} />
          <Route path="billing" element={<AdminBilling />} />
          <Route path="solarinvoices" element={<SolarInvoices />} />
          <Route path="iotdevice" element={<IoTDevice />} />
          <Route path="reports" element={<Reports />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="usermanagement" element={<UserManagement />} />
          <Route path="settings" element={<Settings />} />
          <Route path="maintenance" element={<Maintenance />} />
          <Route path="system-config" element={<SystemConfig />} />
        </Route>

        {/* Engineer Routes */}
        <Route
          path="/app/engineer"
          element={
            <MaintenanceGuard>
              <AccountSetupGuard>
                <RoleRouteGuard allowedRoles={['engineer']}>
                  <DashboardLayout />
                </RoleRouteGuard>
              </AccountSetupGuard>
            </MaintenanceGuard>
          }
        >
          <Route index element={<EngineerDashboard />} />
          <Route path="assessment" element={<EngineerSiteAssessment />} />
          <Route path="project" element={<EngineerProject />} />
          <Route path="device" element={<EngineerIoTDevice />} />
          <Route path="reports" element={<EngineerReports />} />
          <Route path="quotation" element={<EngineerQuotation />} />
          <Route path="schedule" element={<EngineerSchedule />} />
          <Route path="profile" element={<EngineerProfile />} />
        </Route>

        {/* Customer Routes */}
        <Route
          path="/app/customer"
          element={
            <MaintenanceGuard>
              <AccountSetupGuard>
                <RoleRouteGuard allowedRoles={['user']}>
                  <DashboardLayout />
                </RoleRouteGuard>
              </AccountSetupGuard>
            </MaintenanceGuard>
          }
        >
          <Route index element={<CustomerDashboard />} />
          <Route path="project" element={<MyProject />} />
          <Route path="book-assessment" element={<ScheduleAssessment />} />
          <Route path="billing" element={<Quotation />} />
          <Route path="support" element={<Supports />} />
          <Route path="profile" element={<CustomerProfile />} />
          <Route path="settings" element={<CustomerSettings />} />
          <Route path="payment-success" element={<PaymentSuccess />} />
          <Route path="payment-cancel" element={<PaymentCancel />} />
        </Route>

        {/* Catch all - redirect based on role */}
        <Route 
          path="/app" 
          element={
            <Navigate 
              to={`/app/${userRole === 'admin' ? 'admin' : userRole === 'engineer' ? 'engineer' : 'customer'}`} 
              replace 
            />
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;
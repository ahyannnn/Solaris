import { useEffect } from "react";
import { api } from "./services/api";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SolarisLandingPage from './pages/Auth/landingpage';
import LoginPage from './pages/Auth/loginpage';
import RegisterPage from './pages/Auth/registerpage';
import ForgotPage from './pages/Auth/forgotpage';
import Dashboard from "./pages/Dashboard_Layout/dashboard";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SolarisLandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgotpassword" element={<ForgotPage />} />
        <Route path="/Dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
import React, { useEffect } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import AnimatedPage from './components/AnimatedPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AddHelpPage from './pages/AddHelpPage'; 
import MyContributionsPage from './pages/MyContributionsPage';
import ProfilePage from './pages/ProfilePage';
import RewardsPage from './pages/RewardsPage';
import SupportPage from './pages/SupportPage'; 
import InstructionsPage from './pages/InstructionsPage';
import FundraisersPage from './pages/FundraisersPage';
import TasksPage from './pages/TasksPage';
import TaskDetailPage from './pages/TaskDetailPage';
import Footer from './components/Footer/Footer';


const ForgotPasswordPage = () => (
  <div className="auth-page"> 
    <h1 style={{ padding: '50px' }}>Сторінка відновлення паролю</h1>
    <Link to="/login">Повернутись до логіну</Link>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const isGuest = localStorage.getItem('userRole') === 'guest';
  const token = localStorage.getItem('userToken');
  if (isGuest || !token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  const location = useLocation();

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        
        <Route path="/" element={<DashboardPage />} />
        <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboardPage /></ProtectedRoute>} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/add-help" element={<ProtectedRoute><AddHelpPage /></ProtectedRoute>} /> 
        <Route path="/rewards" element={<ProtectedRoute><RewardsPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/my-contributions" element={<ProtectedRoute><MyContributionsPage /></ProtectedRoute>} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/instructions" element={<InstructionsPage />} />
        <Route path="/fundraisers" element={<FundraisersPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/tasks/:id" element={<TaskDetailPage />} />
      </Routes>
      <Footer />
    </AnimatePresence>
  );
}

export default App;
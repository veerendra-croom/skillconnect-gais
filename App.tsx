
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { UserRole } from './types';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import AuthPage from './pages/AuthPage';
import AdminPage from './pages/AdminPage';
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';
import InstallPrompt from './components/InstallPrompt';
import ToastContainer from './components/ToastContainer';
import ProtectedRoute from './components/ProtectedRoute';

// Static Pages
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import HelpPage from './pages/HelpPage';
import LegalPage from './pages/LegalPage';

const App: React.FC = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <HashRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<AuthPage />} />
              
              {/* Informational Pages */}
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/help" element={<HelpPage />} />
              <Route path="/terms" element={<LegalPage initialTab="terms" />} />
              <Route path="/privacy" element={<LegalPage initialTab="privacy" />} />
              <Route path="/safety" element={<LegalPage initialTab="privacy" />} />

              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                    <AdminPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/settings" 
                element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                } 
              />
              <Route path="/404" element={<NotFoundPage />} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
          </Layout>
          <InstallPrompt />
          <ToastContainer />
        </HashRouter>
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;

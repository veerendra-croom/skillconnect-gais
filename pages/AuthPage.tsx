
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { UserRole } from '../types';
import Button from '../components/Button';
import Input from '../components/Input';
import { Wrench, User, Mail, Lock, Phone as PhoneIcon, Shield, ArrowLeft } from 'lucide-react';

type AuthView = 'login' | 'register' | 'forgot_password';

const AuthPage: React.FC = () => {
  const { login, register, resetPassword } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  
  const [view, setView] = useState<AuthView>('login');
  const [activeTab, setActiveTab] = useState<'customer' | 'worker' | 'admin'>('customer');
  const [isLoading, setIsLoading] = useState(false);

  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [adminCode, setAdminCode] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (view === 'login') {
        await login(email, password);
        addToast('Login successful!', 'success');
        navigate('/dashboard');
      } 
      else if (view === 'register') {
        let role = UserRole.CUSTOMER;
        
        if (activeTab === 'worker') {
            role = UserRole.WORKER;
        } else if (activeTab === 'admin') {
            if (adminCode !== 'rani') {
                addToast('Invalid Admin Secret Code', 'error');
                setIsLoading(false);
                return;
            }
            role = UserRole.ADMIN;
        }

        await register(email, password, name, role, phone);
        addToast('Registration successful! Please login.', 'success');
        setView('login');
        setPassword('');
        setAdminCode('');
      }
      else if (view === 'forgot_password') {
        await resetPassword(email);
        addToast('Password reset link sent to your email.', 'success');
        setView('login');
      }
    } catch (error: any) {
      console.error(error);
      addToast(error.message || 'Authentication failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const getTitle = () => {
    switch(view) {
      case 'login': return 'Welcome Back';
      case 'register': return 'Create Account';
      case 'forgot_password': return 'Reset Password';
    }
  };

  const getSubtitle = () => {
    switch(view) {
      case 'login': return 'Login to continue to SkillConnect';
      case 'register': return 'Join our professional network';
      case 'forgot_password': return 'Enter your email to receive a reset link';
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden animate-slide-up border border-gray-100">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-center relative overflow-hidden">
          {/* Decorative background circle */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-xl"></div>
          
          <h2 className="text-3xl font-bold text-white relative z-10">
            {getTitle()}
          </h2>
          <p className="text-blue-100 mt-2 relative z-10">
            {getSubtitle()}
          </p>
        </div>

        {/* Role Tab Switcher - Only visible during Registration */}
        {view === 'register' && (
          <div className="flex border-b border-gray-100 bg-gray-50/50">
            <button
              type="button"
              className={`flex-1 py-4 text-sm font-medium transition-all flex items-center justify-center ${
                activeTab === 'customer' 
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-white shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => setActiveTab('customer')}
            >
              <User size={18} className="mr-2" />
              Customer
            </button>
            <button
              type="button"
              className={`flex-1 py-4 text-sm font-medium transition-all flex items-center justify-center ${
                activeTab === 'worker' 
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-white shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => setActiveTab('worker')}
            >
              <Wrench size={18} className="mr-2" />
              Worker
            </button>
            <button
              type="button"
              className={`flex-1 py-4 text-sm font-medium transition-all flex items-center justify-center ${
                activeTab === 'admin' 
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-white shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => setActiveTab('admin')}
            >
              <Shield size={18} className="mr-2" />
              Admin
            </button>
          </div>
        )}

        <div className="p-8">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {view === 'register' && (
              <>
                <Input
                  label="Full Name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  icon={<User size={18} />}
                />
                <Input
                  label="Phone Number"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  icon={<PhoneIcon size={18} />}
                />
                
                {/* Admin Secret Code Input */}
                {activeTab === 'admin' && (
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 animate-fade-in">
                        <Input
                            label="Admin Secret Code"
                            type="password"
                            placeholder="Enter code to join as Admin"
                            value={adminCode}
                            onChange={(e) => setAdminCode(e.target.value)}
                            required
                            icon={<Shield size={18} />}
                            className="bg-white"
                        />
                        <p className="text-xs text-blue-600 mt-2 ml-1">
                            * Restricted access for platform administrators.
                        </p>
                    </div>
                )}
              </>
            )}

            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              icon={<Mail size={18} />}
            />

            {view !== 'forgot_password' && (
              <div>
                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  icon={<Lock size={18} />}
                />
                {view === 'login' && (
                  <div className="flex justify-end mt-2">
                    <button 
                      type="button" 
                      onClick={() => setView('forgot_password')}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-6 h-12 text-lg shadow-lg shadow-blue-500/30"
              isLoading={isLoading}
            >
              {view === 'login' ? 'Log In' : view === 'register' ? 'Sign Up' : 'Send Reset Link'}
            </Button>
          </form>
          
          {/* Footer Navigation */}
          <div className="mt-8 text-center pt-6 border-t border-gray-100">
            {view === 'forgot_password' ? (
               <button 
                  type="button"
                  onClick={() => setView('login')}
                  className="flex items-center justify-center w-full text-gray-500 hover:text-gray-700 font-medium"
               >
                  <ArrowLeft size={16} className="mr-2" /> Back to Login
               </button>
            ) : (
                <p className="text-sm text-gray-500">
                {view === 'login' ? "Don't have an account?" : "Already have an account?"}{' '}
                <button 
                    type="button"
                    onClick={() => {
                        if (view === 'login') {
                            setView('register');
                            setActiveTab('customer');
                        } else {
                            setView('login');
                        }
                        // Reset form
                        setEmail('');
                        setPassword('');
                        setName('');
                        setPhone('');
                        setAdminCode('');
                    }}
                    className="font-bold text-blue-600 hover:text-blue-500 hover:underline transition-all"
                >
                    {view === 'login' ? 'Register now' : 'Login here'}
                </button>
                </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;

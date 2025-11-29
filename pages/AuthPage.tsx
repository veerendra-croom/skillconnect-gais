import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { UserRole } from '../types';
import Button from '../components/Button';
import Input from '../components/Input';
import { Wrench, User } from 'lucide-react';

const AuthPage: React.FC = () => {
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'customer' | 'worker'>('customer');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      login(activeTab === 'worker' ? UserRole.WORKER : UserRole.CUSTOMER);
      setIsLoading(false);
      addToast(`Welcome back! Logged in as ${activeTab}`, 'success');
      navigate('/dashboard');
    }, 1000);
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-blue-600 p-6 text-center">
          <h2 className="text-2xl font-bold text-white">Welcome Back</h2>
          <p className="text-blue-100 mt-2">Login to manage your jobs</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-gray-100">
          <button
            className={`flex-1 py-4 text-sm font-medium transition-colors flex items-center justify-center ${
              activeTab === 'customer' 
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('customer')}
          >
            <User size={18} className="mr-2" />
            I'm a Customer
          </button>
          <button
            className={`flex-1 py-4 text-sm font-medium transition-colors flex items-center justify-center ${
              activeTab === 'worker' 
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('worker')}
          >
            <Wrench size={18} className="mr-2" />
            I'm a Worker
          </button>
        </div>

        <div className="p-8">
          <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
            <Input
              label="Phone Number"
              type="tel"
              id="phone"
              placeholder="+91 98765 43210"
              required
            />

            <Input
              label="OTP"
              type="text"
              id="otp"
              placeholder="123456"
              defaultValue="123456"
              required
            />
            <p className="-mt-4 text-xs text-gray-500">Use 123456 for demo</p>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={isLoading}
            >
              {activeTab === 'customer' ? 'Login as Customer' : 'Login as Worker'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Don't have an account?{' '}
              <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                Register now
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;

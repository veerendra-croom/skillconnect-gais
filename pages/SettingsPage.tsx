
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { useToast } from '../context/ToastContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import { Lock, Bell, Trash2, Shield, LogOut } from 'lucide-react';

const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdatePassword = async () => {
      if (password !== confirmPassword) {
          addToast('Passwords do not match', 'error');
          return;
      }
      if (password.length < 6) {
          addToast('Password must be at least 6 characters', 'error');
          return;
      }

      setLoading(true);
      try {
          const { error } = await supabase.auth.updateUser({ password: password });
          if (error) throw error;
          addToast('Password updated successfully', 'success');
          setPassword('');
          setConfirmPassword('');
      } catch (e: any) {
          addToast(e.message, 'error');
      } finally {
          setLoading(false);
      }
  };

  const handleSignOut = () => {
      logout();
      navigate('/');
  };

  return (
    <div className="container mx-auto px-4 py-8 pb-20 max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Account Settings</h1>
      <p className="text-gray-500 mb-8">Manage your security and preferences.</p>

      <div className="space-y-6">
          <Card>
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <Lock size={20} className="mr-2 text-blue-600" /> Security
              </h2>
              <div className="space-y-4">
                  <Input 
                     label="New Password" 
                     type="password" 
                     value={password}
                     onChange={(e) => setPassword(e.target.value)}
                     placeholder="••••••••"
                  />
                  <Input 
                     label="Confirm New Password" 
                     type="password" 
                     value={confirmPassword}
                     onChange={(e) => setConfirmPassword(e.target.value)}
                     placeholder="••••••••"
                  />
                  <Button onClick={handleUpdatePassword} isLoading={loading}>
                      Update Password
                  </Button>
              </div>
          </Card>

          <Card>
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <Bell size={20} className="mr-2 text-purple-600" /> Notifications
              </h2>
              <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-700">Email Alerts</span>
                      <div className="w-10 h-6 bg-green-500 rounded-full relative cursor-pointer">
                          <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                      </div>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-700">Push Notifications</span>
                      <div className="w-10 h-6 bg-green-500 rounded-full relative cursor-pointer">
                          <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                      </div>
                  </div>
              </div>
          </Card>

          <Card className="border-red-100 bg-red-50/30">
              <h2 className="text-lg font-bold text-red-700 mb-4 flex items-center">
                  <Shield size={20} className="mr-2" /> Danger Zone
              </h2>
              <div className="space-y-3">
                  <Button variant="outline" className="w-full border-red-200 text-red-600 hover:bg-red-50" onClick={handleSignOut}>
                      <LogOut size={16} className="mr-2" /> Sign Out from All Devices
                  </Button>
                  <Button variant="ghost" className="w-full text-red-500 hover:text-red-700">
                      <Trash2 size={16} className="mr-2" /> Delete Account
                  </Button>
              </div>
          </Card>
      </div>
    </div>
  );
};

export default SettingsPage;

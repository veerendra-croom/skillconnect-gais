
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import Button from '../Button';
import Input from '../Input';
import Card from '../Card';
import { useToast } from '../../context/ToastContext';
import { User, Phone, Mail } from 'lucide-react';

const CustomerProfileView: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await api.profiles.update(user.id, {
        name,
        phone
      });
      addToast('Profile updated successfully!', 'success');
    } catch (e: any) {
      addToast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">My Profile</h2>
      <Card>
        <div className="space-y-4">
           <div className="flex items-center space-x-4 mb-6">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-2xl font-bold">
                 {user?.name?.[0]}
              </div>
              <div>
                 <p className="text-gray-500 text-sm">Role</p>
                 <p className="font-semibold text-gray-900">Customer</p>
              </div>
           </div>

           <Input 
              label="Full Name" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              icon={<User size={16}/>}
           />
           <Input 
              label="Phone Number" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              icon={<Phone size={16}/>}
           />
           <div className="opacity-70">
              <Input 
                 label="Email (Cannot be changed)" 
                 value={user?.email || ''}
                 disabled
                 icon={<Mail size={16}/>}
              />
           </div>

           <Button className="w-full mt-4" onClick={handleSave} isLoading={loading}>
              Save Changes
           </Button>
        </div>
      </Card>
    </div>
  );
};

export default CustomerProfileView;


import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { ServiceCategory } from '../../types';
import Button from '../Button';
import Input from '../Input';
import Card from '../Card';
import Spinner from '../Spinner';
import { useToast } from '../../context/ToastContext';
import { User, Briefcase, MapPin, Star, Award, Settings } from 'lucide-react';
import FileUpload from '../FileUpload';
import { StorageService } from '../../services/storage';

const WorkerProfileView: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  
  // Form State
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [experience, setExperience] = useState<number>(0);
  const [radius, setRadius] = useState<number>(10);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  useEffect(() => {
    if (user) {
      loadProfileData();
    }
  }, [user]);

  const loadProfileData = async () => {
    try {
      const cats = await api.categories.list();
      setCategories(cats || []);
      
      // Pre-fill form
      if (user) {
        setName(user.name || '');
        setBio(user.bio || '');
        setExperience(user.experience_years || 0);
        setRadius(user.service_radius_km || 10);
        setSelectedSkills(user.skills || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSkillToggle = (id: string) => {
    if (selectedSkills.includes(id)) {
      setSelectedSkills(prev => prev.filter(s => s !== id));
    } else {
      setSelectedSkills(prev => [...prev, id]);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      let avatarUrl = user.avatar_url;
      
      // Upload avatar if changed
      if (avatarFile) {
        const path = await StorageService.uploadFile('avatars', avatarFile, user.id);
        avatarUrl = StorageService.getPublicUrl('avatars', path);
      }

      await api.profiles.update(user.id, {
        name,
        bio,
        experience_years: experience,
        service_radius_km: radius,
        skills: selectedSkills,
        avatar_url: avatarUrl
      });
      
      addToast('Profile updated successfully!', 'success');
    } catch (e: any) {
      addToast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-6">
        <div className="relative">
          <div className="w-24 h-24 bg-gray-200 rounded-full overflow-hidden border-4 border-white shadow-md">
             {avatarFile ? (
                <img src={URL.createObjectURL(avatarFile)} className="w-full h-full object-cover" />
             ) : user?.avatar_url ? (
                <img src={user.avatar_url} className="w-full h-full object-cover" />
             ) : (
                <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 text-3xl font-bold">
                  {user?.name?.[0]}
                </div>
             )}
          </div>
          <div className="absolute bottom-0 right-0">
             <label htmlFor="avatar-upload" className="bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 shadow-sm block">
                <Settings size={14} />
             </label>
             <input 
               id="avatar-upload" 
               type="file" 
               className="hidden" 
               accept="image/*"
               onChange={(e) => e.target.files && setAvatarFile(e.target.files[0])} 
             />
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{user?.name}</h2>
          <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
             <span className="flex items-center"><Star size={14} className="text-yellow-500 mr-1"/> {Number(user?.rating || 0).toFixed(1)} Rating</span>
             <span className="flex items-center"><Award size={14} className="text-blue-500 mr-1"/> {user?.worker_status}</span>
          </div>
        </div>
      </div>

      <Card title="Public Details">
        <div className="space-y-4">
          <Input 
             label="Display Name" 
             value={name} 
             onChange={(e) => setName(e.target.value)} 
             icon={<User size={16}/>}
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">About Me (Bio)</label>
            <textarea 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Tell customers about your expertise..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input 
               label="Experience (Years)" 
               type="number"
               value={experience} 
               onChange={(e) => setExperience(Number(e.target.value))} 
               icon={<Briefcase size={16}/>}
            />
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Service Radius (km)</label>
               <div className="flex items-center space-x-2">
                 <input 
                    type="range" 
                    min="1" 
                    max="50" 
                    value={radius} 
                    onChange={(e) => setRadius(Number(e.target.value))}
                    className="flex-1" 
                 />
                 <span className="bg-gray-100 px-3 py-2 rounded-lg text-sm font-bold min-w-[60px] text-center">{radius} km</span>
               </div>
            </div>
          </div>
        </div>
      </Card>

      <Card title="Skills & Services">
         <h3 className="font-semibold text-gray-900 mb-3">Select your expertise</h3>
         <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {categories.map(cat => (
              <div 
                key={cat.id}
                onClick={() => handleSkillToggle(cat.id)}
                className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center space-x-2 ${
                  selectedSkills.includes(cat.id) 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                   selectedSkills.includes(cat.id) ? 'border-blue-600 bg-blue-600' : 'border-gray-400'
                }`}>
                   {selectedSkills.includes(cat.id) && <CheckIcon size={10} className="text-white" />}
                </div>
                <span className="font-medium text-sm">{cat.name}</span>
              </div>
            ))}
         </div>
      </Card>

      <div className="flex justify-end pb-20">
         <Button onClick={handleSave} isLoading={loading} size="lg">
            Save Changes
         </Button>
      </div>
    </div>
  );
};

// Helper Icon
const CheckIcon = ({ size, className }: { size: number, className: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="3" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

export default WorkerProfileView;

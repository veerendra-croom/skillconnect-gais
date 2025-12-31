
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { ServiceCategory, JobStatus, Job } from '../../types';
import { supabase } from '../../services/supabase';
import { Search, MapPin, Zap, Shield, Clock, Camera, CheckCircle, ChevronRight, Phone, MessageSquare } from 'lucide-react';
import Card from '../Card';
import Button from '../Button';
import Modal from '../Modal';
import Input from '../Input';
import Badge from '../Badge';
import CategoryIcon from '../CategoryIcon';
import StatusStepper from '../StatusStepper';
import { useToast } from '../../context/ToastContext';

const CustomerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Booking State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCat, setSelectedCat] = useState<ServiceCategory | null>(null);
  const [description, setDescription] = useState('');

  useEffect(() => {
    const init = async () => {
      try {
        if (!user) return;
        const [cats, job] = await Promise.all([
          api.categories.list(),
          api.jobs.getActiveForCustomer(user.id)
        ]);
        setCategories(cats);
        setActiveJob(job);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [user]);

  // Real-time status sync
  useEffect(() => {
    if (!activeJob?.id) return;
    const sub = supabase.channel(`customer-job-${activeJob.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'jobs', filter: `id=eq.${activeJob.id}` }, (p) => {
        setActiveJob(prev => ({ ...prev, ...(p.new as Job) }));
      }).subscribe();
    return () => { sub.unsubscribe(); };
  }, [activeJob?.id]);

  const handleBook = async () => {
    if (!selectedCat || !user) return;
    try {
      const job = await api.jobs.create({
        customer_id: user.id,
        category_id: selectedCat.id,
        description,
        location_address: 'Current Location'
      });
      setActiveJob(job);
      setIsModalOpen(false);
      addToast('Job request posted!', 'success');
    } catch (e: any) {
      addToast(e.message, 'error');
    }
  };

  if (activeJob) {
    return (
      <div className="max-w-2xl mx-auto p-4 space-y-6 animate-slide-up">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-black text-gray-900">Current Booking</h2>
          <Badge variant="info" className="animate-pulse">Live Status</Badge>
        </div>

        <Card className="p-8 shadow-2xl border-white/50 bg-white/80 backdrop-blur-md">
          <StatusStepper status={activeJob.status} />
          
          <div className="mt-12 text-center space-y-4">
            <h3 className="text-xl font-bold text-gray-900">
              {activeJob.status === JobStatus.SEARCHING ? 'Finding Pro...' : 'Professional Assigned'}
            </h3>
            <p className="text-gray-500 text-sm">
              {activeJob.status === JobStatus.SEARCHING 
                ? 'We are notifying verified professionals in your area.' 
                : 'Your expert is on the way.'}
            </p>
          </div>

          {(activeJob.status === JobStatus.ACCEPTED || activeJob.status === JobStatus.ARRIVED) && (
            <div className="mt-8 bg-blue-50 p-6 rounded-3xl border border-blue-100 text-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-2 block">Your Security Code</span>
              <div className="text-5xl font-mono font-black text-blue-600 tracking-tighter">
                {activeJob.otp}
              </div>
              <p className="text-[10px] text-blue-400 mt-3">Share this with the worker when they arrive.</p>
            </div>
          )}
        </Card>

        {activeJob.worker && (
          <Card className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                {activeJob.worker.name[0]}
              </div>
              <div>
                <p className="font-bold text-gray-900">{activeJob.worker.name}</p>
                <div className="flex gap-1 text-yellow-400">
                  <Badge variant="warning">★ {activeJob.worker.rating?.toFixed(1) || '5.0'}</Badge>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="rounded-full w-10 h-10 p-0"><Phone size={18}/></Button>
              <Button size="sm" variant="secondary" className="rounded-full w-10 h-10 p-0"><MessageSquare size={18}/></Button>
            </div>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-24">
      {/* Hero Header */}
      <div className="mesh-gradient-blue rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
        <div className="relative z-10">
          <h1 className="text-4xl font-black mb-2 tracking-tight">Need help?</h1>
          <p className="text-blue-100 mb-8 opacity-90 text-lg">Connect with local experts instantly.</p>
          
          <div className="glass-morphism rounded-2xl p-2 flex items-center shadow-lg">
            <Search className="text-blue-200 ml-4" />
            <input 
              type="text" 
              placeholder="Search for an electrician, plumber..." 
              className="w-full bg-transparent p-4 outline-none text-white placeholder-blue-200 text-lg font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="px-1">
        <div className="flex justify-between items-end mb-6">
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Services</h2>
          <button className="text-sm font-bold text-blue-600 flex items-center">All <ChevronRight size={16}/></button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).map(cat => (
            <Card 
              key={cat.id} 
              hover 
              className="flex flex-col items-center justify-center p-6 text-center border-transparent hover:border-blue-500/30 transition-all duration-300"
              onClick={() => { setSelectedCat(cat); setIsModalOpen(true); }}
            >
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
                <CategoryIcon iconName={cat.icon} size={28} />
              </div>
              <span className="font-bold text-gray-800">{cat.name}</span>
              <span className="text-[10px] text-gray-400 font-bold uppercase mt-1">Starts ₹{cat.base_price}</span>
            </Card>
          ))}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Request ${selectedCat?.name}`}>
        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-center gap-3 text-sm text-blue-700 font-medium">
            <Shield size={18} className="text-blue-500" />
            Every pro is verified & background-checked.
          </div>
          
          <Input 
            label="Describe the issue" 
            placeholder="e.g. Living room fan is making noise..." 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="flex gap-4">
            <label className="flex-1 cursor-pointer">
              <input type="file" className="hidden" />
              <div className="border-2 border-dashed border-gray-200 rounded-2xl p-4 flex flex-col items-center justify-center text-gray-400 hover:bg-gray-50 transition-colors">
                <Camera size={24} />
                <span className="text-[10px] font-bold mt-1">ADD PHOTO</span>
              </div>
            </label>
            <div className="flex-1 bg-gray-50 rounded-2xl p-4 flex flex-col justify-center border border-gray-100">
               <span className="text-[10px] text-gray-400 font-bold uppercase mb-1">Estimated Cost</span>
               <span className="text-xl font-black text-gray-900">₹{selectedCat?.base_price}+</span>
            </div>
          </div>

          <Button className="w-full py-4 text-lg shadow-xl shadow-blue-500/20" onClick={handleBook} disabled={!description}>
            Find a Professional
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default CustomerDashboard;

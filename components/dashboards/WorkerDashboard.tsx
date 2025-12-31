
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Job, JobStatus, WorkerStatus } from '../../types';
import { supabase } from '../../services/supabase';
import { Power, MapPin, Search, ArrowRight, Wallet as WalletIcon, Clock, Navigation, CheckCircle, ShieldAlert } from 'lucide-react';
import Card from '../Card';
import Button from '../Button';
import Badge from '../Badge';
import Input from '../Input';
import { useToast } from '../../context/ToastContext';
import WalletView from './WalletView';
import WorkerProfileView from './WorkerProfileView';

const WorkerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'radar' | 'wallet' | 'profile'>('radar');
  const [isOnline, setIsOnline] = useState(user?.worker_status === WorkerStatus.ONLINE);
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [availableJobs, setAvailableJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Job Flow State
  const [otp, setOtp] = useState('');
  const [amount, setAmount] = useState('');

  useEffect(() => {
    const init = async () => {
      if (!user) return;
      try {
        const [job, available] = await Promise.all([
          api.jobs.getActiveForWorker(user.id),
          isOnline ? api.jobs.getAvailableForWorker() : Promise.resolve([])
        ]);
        setActiveJob(job);
        setAvailableJobs(available);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    init();
  }, [user, isOnline]);

  // Real-time Feed
  useEffect(() => {
    if (!isOnline) return;
    const sub = supabase.channel('job-radar')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'jobs', filter: 'status=eq.SEARCHING' }, (p) => {
        setAvailableJobs(prev => [p.new as Job, ...prev]);
        addToast('New Job Nearby!', 'info');
      }).subscribe();
    return () => { sub.unsubscribe(); };
  }, [isOnline]);

  const handleToggleOnline = async () => {
    const newStatus = isOnline ? WorkerStatus.OFFLINE : WorkerStatus.ONLINE;
    try {
      await api.profiles.updateWorkerStatus(user!.id, newStatus);
      setIsOnline(!isOnline);
      addToast(`You are now ${newStatus.toLowerCase()}`, 'success');
    } catch (e: any) { addToast(e.message, 'error'); }
  };

  const handleAccept = async (jobId: string) => {
    try {
      const job = await api.jobs.accept(jobId, user!.id);
      setActiveJob(job);
      setAvailableJobs(prev => prev.filter(j => j.id !== jobId));
      addToast('Job Accepted!', 'success');
    } catch (e: any) { addToast(e.message, 'error'); }
  };

  const handleStart = async () => {
    try {
      await api.jobs.verifyOtpAndStart(activeJob!.id, otp);
      addToast('OTP Verified. Job started!', 'success');
      setActiveJob(prev => prev ? ({ ...prev, status: JobStatus.IN_PROGRESS }) : null);
    } catch (e: any) { addToast(e.message, 'error'); }
  };

  const handleComplete = async () => {
    try {
      await api.jobs.updateStatus(activeJob!.id, JobStatus.COMPLETED_PENDING_PAYMENT, { amount: parseFloat(amount) });
      addToast('Job completed! Pending payment.', 'success');
      setActiveJob(prev => prev ? ({ ...prev, status: JobStatus.COMPLETED_PENDING_PAYMENT }) : null);
    } catch (e: any) { addToast(e.message, 'error'); }
  };

  /**
   * Refactored to avoid early returns which cause TypeScript narrowing issues 
   * in the bottom navigation block.
   */
  return (
    <div className="space-y-6 pb-24 max-w-2xl mx-auto">
      {activeTab === 'wallet' ? (
        <WalletView />
      ) : activeTab === 'profile' ? (
        <WorkerProfileView />
      ) : (
        <>
          {/* Worker Header */}
          <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-gray-100 flex justify-between items-center sticky top-4 z-20">
            <div>
              <h2 className="text-xl font-black text-gray-900 tracking-tight">Job Radar</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></span>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  {isOnline ? 'Scanning for jobs' : 'You are offline'}
                </span>
              </div>
            </div>
            <button 
              onClick={handleToggleOnline}
              className={`p-4 rounded-3xl transition-all duration-500 shadow-lg ${isOnline ? 'bg-red-50 text-red-500 hover:bg-red-100 shadow-red-500/10' : 'bg-green-500 text-white shadow-green-500/20'}`}
            >
              <Power size={24} />
            </button>
          </div>

          {activeJob ? (
            <div className="animate-slide-up space-y-4">
              <Card className="p-8 border-l-4 border-l-blue-600 shadow-2xl bg-white/80 backdrop-blur-md">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <Badge variant="info" className="mb-2">{activeJob.status.replace('_', ' ')}</Badge>
                    <h3 className="text-2xl font-black text-gray-900">{activeJob.category?.name}</h3>
                    <p className="text-gray-500 text-sm mt-1">{activeJob.description}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-blue-600">₹{activeJob.category?.base_price}</span>
                    <p className="text-[8px] font-black uppercase text-gray-400 tracking-widest">Base Rate</p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center gap-3 mb-8">
                  <MapPin className="text-red-500" size={20} />
                  <span className="text-sm font-bold text-gray-700">{activeJob.location_address}</span>
                </div>

                {activeJob.status === JobStatus.ACCEPTED && (
                  <Button className="w-full h-14 text-lg bg-blue-600 shadow-xl shadow-blue-500/30" onClick={() => api.jobs.updateStatus(activeJob.id, JobStatus.ARRIVED)}>
                    <Navigation size={20} className="mr-2" /> Mark Arrived
                  </Button>
                )}

                {activeJob.status === JobStatus.ARRIVED && (
                  <div className="space-y-4 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                    <Input label="Ask customer for OTP" placeholder="4-digit code" value={otp} onChange={e => setOtp(e.target.value)} maxLength={4} className="text-center font-mono text-2xl tracking-[0.5em]" />
                    <Button className="w-full" onClick={handleStart} disabled={otp.length < 4}>Start Work</Button>
                  </div>
                )}

                {activeJob.status === JobStatus.IN_PROGRESS && (
                  <div className="space-y-4">
                    <Input label="Final Amount (including materials)" type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder={`Min ₹${activeJob.category?.base_price}`} />
                    <Button variant="secondary" className="w-full h-14" onClick={handleComplete}>
                      <CheckCircle size={20} className="mr-2" /> Mark Complete
                    </Button>
                  </div>
                )}
              </Card>
            </div>
          ) : (
            <div className="space-y-4">
              {!isOnline && (
                <div className="bg-amber-50 border border-amber-100 p-8 rounded-[2rem] text-center">
                  <ShieldAlert className="mx-auto mb-4 text-amber-500" size={48} />
                  <h3 className="text-xl font-bold text-gray-900">Get to work!</h3>
                  <p className="text-gray-500 text-sm mt-2 mb-6">Switch to online to start receiving nearby job requests.</p>
                  <Button onClick={handleToggleOnline} className="bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-500/20">Go Online Now</Button>
                </div>
              )}

              {isOnline && availableJobs.length === 0 && (
                <div className="p-20 text-center relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-48 bg-blue-500/10 rounded-full animate-radar"></div>
                    <div className="w-32 h-32 bg-blue-500/10 rounded-full animate-radar" style={{animationDelay: '1s'}}></div>
                  </div>
                  <div className="relative z-10">
                    <Search className="mx-auto mb-4 text-blue-500 opacity-50" size={48} />
                    <h3 className="font-bold text-gray-900">Scanning Area...</h3>
                    <p className="text-xs text-gray-400 mt-2">New requests will appear here instantly.</p>
                  </div>
                </div>
              )}

              {isOnline && availableJobs.map(job => (
                <Card key={job.id} hover className="p-6 border-l-4 border-l-green-500 group animate-slide-up">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="success">NEW</Badge>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{new Date(job.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <h4 className="text-lg font-black text-gray-900 group-hover:text-blue-600 transition-colors">{job.category?.name}</h4>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{job.description}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-black text-emerald-600">₹{job.category?.base_price}</span>
                      <Button size="sm" className="mt-4 rounded-full" onClick={() => handleAccept(job.id)}>
                        Accept <ArrowRight size={14} className="ml-1" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modern Bottom Bar - Now consistently rendered */}
      <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-xl border-t border-gray-100 px-8 py-4 flex justify-between items-center shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-40">
        <button onClick={() => setActiveTab('radar')} className={`flex flex-col items-center gap-1 ${activeTab === 'radar' ? 'text-blue-600' : 'text-gray-400'}`}>
          <Search size={24} strokeWidth={activeTab === 'radar' ? 3 : 2} />
          <span className="text-[8px] font-black uppercase tracking-widest">Radar</span>
        </button>
        <button onClick={() => setActiveTab('wallet')} className={`flex flex-col items-center gap-1 ${activeTab === 'wallet' ? 'text-blue-600' : 'text-gray-400'}`}>
          <WalletIcon size={24} strokeWidth={activeTab === 'wallet' ? 3 : 2} />
          <span className="text-[8px] font-black uppercase tracking-widest">Wallet</span>
        </button>
        <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-1 ${activeTab === 'profile' ? 'text-blue-600' : 'text-gray-400'}`}>
          <Clock size={24} strokeWidth={activeTab === 'profile' ? 3 : 2} />
          <span className="text-[8px] font-black uppercase tracking-widest">Profile</span>
        </button>
      </div>
    </div>
  );
};

export default WorkerDashboard;

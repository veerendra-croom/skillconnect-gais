
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { LocationService, Coordinates } from '../../services/location';
import { StorageService } from '../../services/storage';
import { Job, JobStatus, WorkerStatus } from '../../types';
import { supabase } from '../../services/supabase';
import { useToast } from '../../context/ToastContext';
import { useNativeNotification } from '../../hooks/useNativeNotification';
import { MapPin, Navigation, Phone, Upload, AlertTriangle, Power, MessageSquare, Briefcase, Wallet as WalletIcon, User, Clock, ArrowRight, Search, Calendar, Image as ImageIcon } from 'lucide-react';
import Card from '../Card';
import Button from '../Button';
import Badge from '../Badge';
import Input from '../Input';
import Modal from '../Modal';
import ChatWindow from '../ChatWindow';
import FileUpload from '../FileUpload';
import WalletView from './WalletView';
import WorkerProfileView from './WorkerProfileView';
import JobCardSkeleton from '../skeletons/JobCardSkeleton';
import CategoryIcon from '../CategoryIcon';

const WorkerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const { fireNotification, requestPermission } = useNativeNotification();
  
  const [activeTab, setActiveTab] = useState<'jobs' | 'wallet' | 'profile'>('jobs');
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [availableJobs, setAvailableJobs] = useState<Job[]>([]);
  const [isOnline, setIsOnline] = useState(user?.worker_status === WorkerStatus.ONLINE);
  const [loading, setLoading] = useState(true);
  const [workerLocation, setWorkerLocation] = useState<Coordinates | null>(null);
  const [verificationFile, setVerificationFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [finalAmount, setFinalAmount] = useState('');
  const [newJobAlert, setNewJobAlert] = useState<Job | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchInitialState();
      setIsOnline(user.worker_status === WorkerStatus.ONLINE);
      requestPermission();
    }
  }, [user]);

  useEffect(() => {
    if (user?.worker_status !== WorkerStatus.ONLINE) return;

    const newJobSub = supabase
      .channel('public:jobs')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'jobs',
        filter: 'status=eq.SEARCHING'
      }, (payload) => {
        const job = payload.new as Job;
        if (user?.skills && user.skills.includes(job.category_id)) {
            setNewJobAlert(job);
            fetchAvailableJobs();
            fireNotification('New Job Opportunity!', {
                body: `${job.description} nearby. Click to view.`,
                tag: 'new-job'
            });
        }
      })
      .subscribe();

    const myJobSub = activeJob ? supabase
      .channel(`my-job-${activeJob.id}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'jobs', 
        filter: `id=eq.${activeJob.id}`
      }, () => {
        fetchActiveJob();
      })
      .subscribe() : null;

    return () => {
      newJobSub.unsubscribe();
      myJobSub?.unsubscribe();
    };
  }, [isOnline, activeJob?.id, user?.worker_status, fireNotification, user?.skills]);

  const fetchInitialState = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const location = await LocationService.getCurrentPosition();
      setWorkerLocation(location);
    } catch (e) {
      console.warn("Could not fetch worker location", e);
    }
    await Promise.all([fetchActiveJob(), fetchAvailableJobs()]);
    setLoading(false);
  };

  const fetchActiveJob = async () => {
    try {
      if (!user) return;
      const job = await api.jobs.getActiveForWorker(user.id);
      setActiveJob(job);
    } catch (e) {
      setActiveJob(null);
    }
  };

  const fetchAvailableJobs = async () => {
    if (user?.worker_status !== WorkerStatus.ONLINE) return;
    try {
      const jobs = await api.jobs.getAvailableForWorker();
      const mySkills = user?.skills || [];
      const filteredJobs = jobs.filter(job => mySkills.includes(job.category_id));
      setAvailableJobs(filteredJobs || []);
    } catch (e) { console.error(e); }
  };

  const handleToggleOnline = async () => {
    if (!user) return;
    const newStatus = isOnline ? WorkerStatus.OFFLINE : WorkerStatus.ONLINE;
    try {
      await api.profiles.updateWorkerStatus(user.id, newStatus);
      setIsOnline(!isOnline);
      if (newStatus === WorkerStatus.ONLINE) {
          fetchAvailableJobs();
          requestPermission();
      }
    } catch (e: any) {
      addToast(e.message, 'error');
    }
  };

  const handleAcceptJob = async (jobId: string) => {
    if (!user) return;
    try {
      await api.jobs.accept(jobId, user.id);
      addToast('Job Accepted! Navigate to location.', 'success');
      setNewJobAlert(null);
      fetchInitialState();
    } catch (e: any) {
      addToast(e.message, 'error');
      fetchAvailableJobs();
    }
  };

  const handleArrive = async () => {
    if (!activeJob) return;
    await api.jobs.updateStatus(activeJob.id, JobStatus.ARRIVED);
    fetchActiveJob();
  };

  const handleStartJob = async () => {
    if (!activeJob) return;
    try {
      await api.jobs.verifyOtpAndStart(activeJob.id, otpInput);
      addToast('OTP Verified. Job Started!', 'success');
      fetchActiveJob();
    } catch (e: any) {
      addToast(e.message, 'error');
    }
  };

  const handleFinishJob = async () => {
    if (!activeJob) return;
    try {
      const amount = parseFloat(finalAmount) || (activeJob.category?.base_price || 0);
      await api.jobs.updateStatus(activeJob.id, JobStatus.COMPLETED_PENDING_PAYMENT, { amount });
      addToast('Job marked complete. Waiting for payment.', 'success');
      fetchActiveJob();
    } catch (e: any) {
      addToast(e.message, 'error');
    }
  };

  const submitVerification = async () => {
    if (!user || !verificationFile) return;
    try {
      setIsUploading(true);
      const path = await StorageService.uploadFile('verification-docs', verificationFile, user.id);
      await api.profiles.submitVerification(user.id, path);
      addToast('Documents uploaded successfully. Under Review.', 'success');
      window.location.reload(); 
    } catch (e: any) {
      addToast(e.message || 'Upload failed', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const getSortedJobs = () => {
    if (!workerLocation) return availableJobs;
    return [...availableJobs].sort((a, b) => {
      if (a.location_lat && a.location_lng && b.location_lat && b.location_lng) {
        const distA = LocationService.calculateDistance(workerLocation.lat, workerLocation.lng, a.location_lat, a.location_lng);
        const distB = LocationService.calculateDistance(workerLocation.lat, workerLocation.lng, b.location_lat, b.location_lng);
        return distA - distB;
      }
      return 0;
    });
  };

  const getDistanceText = (job: Job) => {
    if (!workerLocation || !job.location_lat || !job.location_lng) return null;
    const dist = LocationService.calculateDistance(workerLocation.lat, workerLocation.lng, job.location_lat, job.location_lng);
    return `${dist} km`;
  };

  const handleNavigate = (address: string, lat?: number, lng?: number) => {
      if (lat && lng) {
          window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
      } else {
          window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
      }
  };

  const renderJobImages = (job: Job) => {
    if (!job.images || job.images.length === 0) return null;
    return (
      <div className="flex space-x-2 overflow-x-auto no-scrollbar py-2">
        {job.images.map((path, i) => (
          <div key={i} className="flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border border-gray-100 bg-gray-50">
            <img 
               src={StorageService.getPublicUrl('job-images', path)} 
               className="w-full h-full object-cover hover:scale-110 transition-transform cursor-pointer" 
               onClick={() => window.open(StorageService.getPublicUrl('job-images', path), '_blank')}
            />
          </div>
        ))}
      </div>
    );
  };

  if (user?.worker_status === WorkerStatus.UNVERIFIED || user?.worker_status === WorkerStatus.PENDING_REVIEW) {
    return (
      <div className="max-w-md mx-auto py-12 space-y-6 animate-fade-in px-4">
        <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome, {user.name}</h1>
            <p className="text-gray-500">Let's get your profile verified to start earning.</p>
        </div>
        
        <Card glass className="text-center p-8 shadow-2xl border-white/50">
          <div className="bg-gradient-to-br from-blue-100 to-indigo-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce-in shadow-inner">
            <Upload className="text-blue-600" size={32} />
          </div>
          <h2 className="text-xl font-bold mb-3 text-gray-900">Upload ID Proof</h2>
          <p className="text-gray-500 mb-8 text-sm leading-relaxed">Please upload a clear photo of your Aadhaar Card, PAN Card, or Driving License.</p>
          
          {user.worker_status === WorkerStatus.PENDING_REVIEW ? (
             <div className="bg-amber-50 text-amber-800 p-6 rounded-2xl flex flex-col items-center justify-center border border-amber-100 animate-pulse-soft">
                <Clock size={32} className="mb-3 text-amber-600" />
                <h3 className="font-bold">Under Review</h3>
                <p className="text-xs mt-1 opacity-80">Admin will verify your details shortly.</p>
             </div>
          ) : (
             <div className="space-y-6 text-left">
                <FileUpload 
                  label="Government ID Document"
                  onFileSelect={setVerificationFile}
                  isLoading={isUploading}
                />
                <Button 
                  className="w-full shadow-lg h-12 text-lg" 
                  onClick={submitVerification}
                  disabled={!verificationFile || isUploading}
                  isLoading={isUploading}
                >
                  Submit for Verification
                </Button>
             </div>
          )}
        </Card>
      </div>
    );
  }

  const renderContent = () => {
    if (activeTab === 'wallet') return <WalletView />;
    if (activeTab === 'profile') return <WorkerProfileView />;

    if (activeJob) {
      return (
        <div className="max-w-2xl mx-auto space-y-6 animate-slide-up pb-24 px-1">
          <div className="flex justify-between items-center mb-2">
              <h2 className="text-2xl font-bold text-gray-900">Active Job</h2>
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm border border-green-200">
                {activeJob.status.replace('_', ' ')}
              </div>
          </div>

          <Card glass className="shadow-2xl border-white/60 relative overflow-hidden">
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-1 flex items-center">
                       <CategoryIcon iconName={activeJob.category?.icon} size={28} className="mr-2 text-blue-600"/>
                       {activeJob.category?.name}
                    </h3>
                    <p className="text-gray-500 text-sm leading-relaxed mb-4">{activeJob.description}</p>
                    
                    {/* Visual context for worker */}
                    {renderJobImages(activeJob)}

                    {activeJob.scheduled_time && (
                         <div className="mt-4 inline-flex items-center text-amber-700 bg-amber-50 px-2 py-1 rounded text-xs font-bold">
                            <Calendar size={12} className="mr-1"/> Scheduled: {new Date(activeJob.scheduled_time).toLocaleString()}
                         </div>
                    )}
                </div>
                <div className="text-right bg-white/50 p-2 rounded-xl border border-white/60 shadow-sm">
                    <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">₹{activeJob.category?.base_price}</div>
                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Base Rate</div>
                </div>
                </div>

                <div className="bg-white/60 p-4 rounded-xl mb-6 flex items-start space-x-4 border border-white/60 shadow-inner">
                <div className="bg-red-50 p-2 rounded-lg text-red-500">
                    <MapPin className="mt-0.5" size={20} />
                </div>
                <div>
                    <p className="font-bold text-gray-900 text-sm uppercase tracking-wide text-xs mb-1">Location</p>
                    <p className="text-gray-700 font-medium">{activeJob.location_address}</p>
                </div>
                </div>

                <div className="flex items-center space-x-4 border-t border-gray-200/50 pt-6 mb-6">
                <div className="w-12 h-12 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-full flex items-center justify-center font-bold text-white shadow-lg text-lg">
                    {activeJob.customer?.name?.[0]}
                </div>
                <div className="flex-1">
                    <p className="font-bold text-gray-900">{activeJob.customer?.name}</p>
                    <p className="text-xs text-blue-500 font-medium">Customer</p>
                </div>
                <div className="flex space-x-2">
                    <Button size="sm" variant="outline" className="rounded-full w-10 h-10 p-0 flex items-center justify-center bg-white"><Phone size={18}/></Button>
                    <Button 
                        size="sm" 
                        variant="secondary" 
                        className="rounded-full px-4 shadow-md bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                        onClick={() => setIsChatOpen(true)}
                    >
                        <MessageSquare size={16} className="mr-2 text-blue-500" /> Chat
                    </Button>
                </div>
                </div>

                <div className="space-y-4">
                {activeJob.status === JobStatus.ACCEPTED && (
                    <Button className="w-full shadow-xl h-14 text-lg bg-gradient-to-r from-blue-600 to-indigo-600" onClick={handleArrive}>
                        <Navigation className="mr-2" /> Navigate & Arrive
                    </Button>
                )}

                {activeJob.status === JobStatus.ARRIVED && (
                    <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                        <label className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-2 block">Ask Customer for OTP</label>
                        <div className="flex space-x-2">
                            <Input 
                                placeholder="4-digit OTP" 
                                className="flex-1 bg-white text-center font-mono text-xl tracking-widest"
                                value={otpInput}
                                onChange={(e) => setOtpInput(e.target.value)}
                                maxLength={4}
                            />
                            <Button onClick={handleStartJob} className="px-8 shadow-lg">Start</Button>
                        </div>
                    </div>
                )}

                {activeJob.status === JobStatus.IN_PROGRESS && (
                    <div className="space-y-4 p-4 bg-gray-50 rounded-2xl border border-gray-200">
                        <h4 className="font-bold text-gray-900 flex items-center"><Clock size={16} className="mr-2 text-gray-500"/> Job in Progress</h4>
                        <Input 
                        label="Final Amount (Add material costs)"
                        type="number"
                        value={finalAmount}
                        onChange={(e) => setFinalAmount(e.target.value)}
                        placeholder={`Min ₹${activeJob.category?.base_price}`}
                        className="bg-white"
                        />
                        <Button className="w-full shadow-lg bg-emerald-600 hover:bg-emerald-700 text-white border-transparent" onClick={handleFinishJob}>
                            Mark Job Completed
                        </Button>
                    </div>
                )}

                {activeJob.status === JobStatus.COMPLETED_PENDING_PAYMENT && (
                    <div className="bg-emerald-50 text-emerald-800 p-6 rounded-2xl text-center font-medium border border-emerald-100 flex flex-col items-center animate-pulse-soft">
                        <div className="bg-white p-3 rounded-full shadow-sm mb-3">
                            <WalletIcon size={24} className="text-emerald-600" />
                        </div>
                        Waiting for payment confirmation...
                    </div>
                )}
                </div>
            </div>
          </Card>
          
          {activeJob.customer && (
            <ChatWindow 
              jobId={activeJob.id} 
              recipientName={activeJob.customer.name} 
              isOpen={isChatOpen} 
              onClose={() => setIsChatOpen(false)} 
            />
          )}
        </div>
      );
    }

    const sortedJobs = getSortedJobs();
    const hasSkills = user?.skills && user.skills.length > 0;

    return (
      <div className="space-y-8 pb-24">
        <div className="flex justify-between items-center bg-white/80 backdrop-blur-xl p-5 rounded-3xl shadow-lg border border-white/60 sticky top-24 z-20">
          <div>
             <h1 className="text-xl font-bold text-gray-900 tracking-tight">Job Radar</h1>
             <p className={`text-xs font-bold uppercase tracking-wider flex items-center mt-1 ${isOnline ? 'text-green-600' : 'text-gray-400'}`}>
                <span className={`w-2.5 h-2.5 rounded-full mr-2 shadow-sm ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
                {isOnline ? 'Scanning for Jobs' : 'You are Offline'}
             </p>
          </div>
          <button 
             onClick={handleToggleOnline}
             className={`p-4 rounded-2xl transition-all duration-500 shadow-inner active:scale-95 ${
                 isOnline 
                 ? 'bg-gradient-to-br from-red-50 to-white text-red-500 hover:text-red-600 border border-red-100' 
                 : 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-green-500/40 hover:shadow-green-500/60'
             }`}
          >
             <Power size={24} />
          </button>
        </div>

        {!hasSkills && (
             <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl text-amber-900 mb-4 flex items-start animate-fade-in shadow-sm mx-1">
                 <AlertTriangle size={24} className="mr-4 flex-shrink-0 mt-0.5 text-amber-600"/>
                 <div>
                    <p className="font-bold text-lg">Setup Required</p>
                    <p className="text-sm mt-1 leading-relaxed opacity-90">Please go to the <strong>Profile Tab</strong> and select your skills to start receiving job alerts.</p>
                 </div>
             </div>
        )}

        {isOnline && hasSkills && (
          <div className="space-y-4 px-1">
             {loading ? (
                 <div className="space-y-4">
                     {[1,2,3].map(i => <JobCardSkeleton key={i} />)}
                 </div>
             ) : availableJobs.length === 0 ? (
               <div className="text-center py-20 px-6 bg-white/40 rounded-3xl border border-dashed border-gray-300/50">
                   <div className="relative w-16 h-16 mx-auto mb-6">
                       <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping"></div>
                       <div className="relative z-10 bg-white w-full h-full rounded-full flex items-center justify-center shadow-sm">
                           <Search className="text-blue-500" size={24} />
                       </div>
                   </div>
                   <h3 className="text-lg font-bold text-gray-900">Scanning Area...</h3>
                   <p className="text-gray-400 text-sm mt-2">No jobs available right now. We'll notify you instantly.</p>
               </div>
             ) : (
               <div className="space-y-4">
                  <div className="flex items-center justify-between px-2 pb-2">
                     <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider">Available Now</h3>
                     <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-bold">{availableJobs.length}</span>
                  </div>
                  {sortedJobs.map((job, idx) => (
                      <div 
                        key={job.id} 
                        className="animate-slide-up" 
                        style={{animationDelay: `${idx * 100}ms`}}
                      >
                          <Card 
                            glass 
                            hover 
                            className="border-l-4 border-l-blue-500 transition-all duration-300 group"
                          >
                            <div className="flex justify-between items-start">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-2 mb-2">
                                     <div className="bg-blue-50 p-1.5 rounded-lg text-blue-600">
                                        <CategoryIcon iconName={job.category?.icon} size={20} />
                                     </div>
                                     <h4 className="font-bold text-gray-900 text-lg group-hover:text-blue-600 transition-colors truncate">{job.category?.name}</h4>
                                     {getDistanceText(job) && (
                                       <Badge variant="info" className="flex items-center bg-blue-50 text-blue-700 border-blue-100 shadow-sm whitespace-nowrap">
                                         <MapPin size={10} className="mr-1"/> {getDistanceText(job)}
                                       </Badge>
                                     )}
                                  </div>
                                  <p className="text-sm text-gray-600 mt-2 line-clamp-2 leading-relaxed">{job.description}</p>
                                  
                                  {/* Preview images in the feed */}
                                  {renderJobImages(job)}

                                  <p className="text-xs text-gray-400 mt-3 flex items-center font-medium">
                                      <Clock size={12} className="mr-1"/> {new Date(job.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                      <span className="mx-2 text-gray-300">|</span>
                                      <MapPin size={12} className="mr-1"/> {job.location_address.slice(0, 30)}...
                                  </p>
                                </div>
                                <div className="text-right pl-4 flex flex-col items-end flex-shrink-0">
                                  <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg font-bold text-lg border border-emerald-100 mb-3">
                                      ₹{job.category?.base_price}
                                  </div>
                                  <Button 
                                    size="sm" 
                                    className="shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform" 
                                    onClick={() => handleAcceptJob(job.id)}
                                  >
                                    Accept <ArrowRight size={14} className="ml-1" />
                                  </Button>
                                </div>
                            </div>
                          </Card>
                      </div>
                  ))}
               </div>
             )}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {renderContent()}

      <Modal isOpen={!!newJobAlert} onClose={() => setNewJobAlert(null)} title="Nearby Opportunity">
         {newJobAlert && (
            <div className="text-center space-y-6 py-4">
               <div className="relative w-24 h-24 mx-auto">
                   <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-radar"></div>
                   <div className="relative z-10 bg-gradient-to-br from-blue-500 to-indigo-600 w-full h-full rounded-full flex items-center justify-center shadow-lg text-white">
                       <CategoryIcon iconName={newJobAlert.category?.icon} size={36} />
                   </div>
               </div>
               <div>
                  <h3 className="text-2xl font-bold text-gray-900 leading-tight">New {newJobAlert.category?.name} Request</h3>
                  <p className="text-gray-500 mt-3 leading-relaxed">{newJobAlert.description}</p>
                  {renderJobImages(newJobAlert)}
                  <div className="mt-4 inline-flex items-center px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600">
                     <MapPin size={12} className="mr-1"/> {newJobAlert.location_address}
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-4 pt-2">
                  <Button variant="ghost" className="h-12 border border-gray-200" onClick={() => setNewJobAlert(null)}>Ignore</Button>
                  <Button variant="primary" className="h-12 shadow-xl shadow-blue-500/30" onClick={() => handleAcceptJob(newJobAlert.id)}>Accept Job</Button>
               </div>
            </div>
         )}
      </Modal>

      <div className="mobile-bottom-bar bg-white/80 backdrop-blur-xl border-t border-white/50 shadow-[0_-5px_30px_rgba(0,0,0,0.08)] z-40 pb-safe">
        <div className="flex justify-around items-center h-20 w-full">
          <button 
             onClick={() => setActiveTab('jobs')}
             className={`flex flex-col items-center justify-center w-full h-full relative transition-all active:scale-95 group ${activeTab === 'jobs' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
             <div className={`p-1.5 rounded-xl mb-1 transition-colors ${activeTab === 'jobs' ? 'bg-blue-100' : 'bg-transparent group-hover:bg-gray-100'}`}>
                <Briefcase size={22} className={activeTab === 'jobs' ? 'animate-bounce-in' : ''} />
             </div>
             <span className="text-[10px] font-bold tracking-wide">Jobs</span>
          </button>
          <button 
             onClick={() => setActiveTab('wallet')}
             className={`flex flex-col items-center justify-center w-full h-full relative transition-all active:scale-95 group ${activeTab === 'wallet' ? 'text-blue-600' : 'text-gray-400'}`}
          >
             <div className={`p-1.5 rounded-xl mb-1 transition-colors ${activeTab === 'wallet' ? 'bg-blue-100' : 'bg-transparent group-hover:bg-gray-100'}`}>
                <WalletIcon size={22} className={activeTab === 'wallet' ? 'animate-bounce-in' : ''} />
             </div>
             <span className="text-[10px] font-bold tracking-wide">Wallet</span>
          </button>
          <button 
             onClick={() => setActiveTab('profile')}
             className={`flex flex-col items-center justify-center w-full h-full relative transition-all active:scale-95 group ${activeTab === 'profile' ? 'text-blue-600' : 'text-gray-400'}`}
          >
             <div className={`p-1.5 rounded-xl mb-1 transition-colors ${activeTab === 'profile' ? 'bg-blue-100' : 'bg-transparent group-hover:bg-gray-100'}`}>
                <User size={22} className={activeTab === 'profile' ? 'animate-bounce-in' : ''} />
             </div>
             <span className="text-[10px] font-bold tracking-wide">Profile</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default WorkerDashboard;

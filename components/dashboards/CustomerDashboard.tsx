
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { ServiceCategory, JobStatus, Job, RazorpayResponse } from '../../types';
import { supabase } from '../../services/supabase';
import { StorageService } from '../../services/storage';
import { MapPin, Search, Phone, MessageSquare, Shield, History, Briefcase, User, Sparkles, Calendar, Clock, AlertCircle, Camera, X as XIcon, Image as ImageIcon } from 'lucide-react';
import { LocationService } from '../../services/location';
import Card from '../Card';
import Button from '../Button';
import Modal from '../Modal';
import Input from '../Input';
import Spinner from '../Spinner';
import Badge from '../Badge';
import StarRating from '../StarRating';
import { useToast } from '../../context/ToastContext';
import ChatWindow from '../ChatWindow';
import CustomerProfileView from './CustomerProfileView';
import JobCardSkeleton from '../skeletons/JobCardSkeleton';
import CategoryIcon from '../CategoryIcon';
import StatusStepper from '../StatusStepper'; 
import { useSearchParams } from 'react-router-dom';

// Add Razorpay window type
declare global {
  interface Window {
    Razorpay: any;
  }
}

const CustomerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [searchParams] = useSearchParams();
  
  // Navigation State
  const [activeTab, setActiveTab] = useState<'home' | 'profile'>('home');

  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [pastJobs, setPastJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Create Job Modal State
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null);
  const [description, setDescription] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);
  const [scheduledTime, setScheduledTime] = useState(''); 
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  // Review Modal State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [jobToReview, setJobToReview] = useState<Job | null>(null);

  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // Payment State
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
  // Search state
  const [dashboardSearch, setDashboardSearch] = useState('');

  // Initial Data Fetch
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user?.id) return;
        
        const query = searchParams.get('q');
        const loc = searchParams.get('loc');
        
        if (loc) setLocationAddress(loc);
        if (query) setDashboardSearch(query);

        let cats: ServiceCategory[] = [];

        if (query) {
           cats = await api.categories.search(query);
           if (cats.length === 0) {
               addToast(`No services found for "${query}". Showing all.`, 'info');
               cats = await api.categories.list();
           }
        } else {
           cats = await api.categories.list();
        }
        
        const [job, history] = await Promise.all([
          api.jobs.getActiveForCustomer(user.id),
          api.jobs.getHistoryForCustomer(user.id)
        ]);
        
        setCategories(cats || []);
        setActiveJob(job);
        setPastJobs(history || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, searchParams]);

  const handleDashboardSearch = async (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
          setLoading(true);
          try {
              if (!dashboardSearch.trim()) {
                  const allCats = await api.categories.list();
                  setCategories(allCats);
              } else {
                  const results = await api.categories.search(dashboardSearch);
                  setCategories(results);
              }
          } catch(e) { console.error(e); }
          finally { setLoading(false); }
      }
  };

  useEffect(() => {
    if (!activeJob?.id || !user?.id) return;

    const subscription = supabase
      .channel(`job-${activeJob.id}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'jobs', 
        filter: `id=eq.${activeJob.id}` 
      }, () => {
        api.jobs.getActiveForCustomer(user.id).then(setActiveJob);
        api.jobs.getHistoryForCustomer(user.id).then(setPastJobs);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [activeJob?.id, user?.id]);

  const handleCategoryClick = (cat: ServiceCategory) => {
    setSelectedCategory(cat);
    setCreateModalOpen(true);
    setDescription('');
    setScheduledTime('');
    setSelectedImages([]);
    if (!locationAddress) handleGetLocation();
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (selectedImages.length + files.length > 5) {
        addToast('Maximum 5 images allowed', 'warning');
        return;
      }
      setSelectedImages(prev => [...prev, ...files]);
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleGetLocation = async () => {
    setIsLocating(true);
    try {
      const position = await LocationService.getCurrentPosition();
      setCoords(position);
      setLocationAddress(`Detected: ${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}`);
      addToast('Location detected successfully', 'success');
    } catch (e: any) {
      addToast(e.message || 'Could not detect location', 'warning');
    } finally {
      setIsLocating(false);
    }
  };

  const handleCreateJob = async () => {
    if (!selectedCategory || !user?.id) return;
    
    try {
      setLoading(true);
      setIsUploadingImages(true);

      const imageUrls: string[] = [];
      for (const file of selectedImages) {
        const path = await StorageService.uploadFile('job-images', file, user.id);
        imageUrls.push(path);
      }

      const newJob = await api.jobs.create({
        customer_id: user.id,
        category_id: selectedCategory.id,
        description,
        location_address: locationAddress || 'Current Location',
        location_lat: coords?.lat,
        location_lng: coords?.lng,
        scheduled_time: scheduledTime || undefined,
        images: imageUrls
      });
      
      setActiveJob(newJob); 
      setCreateModalOpen(false);
      addToast('Request posted! Finding workers...', 'success');
      api.jobs.getActiveForCustomer(user.id).then(setActiveJob);
    } catch (e: any) {
      addToast(e.message, 'error');
    } finally {
      setLoading(false);
      setIsUploadingImages(false);
    }
  };

  const handleCompletePayment = async () => {
    if (!activeJob?.id || !user?.id) return;
    
    setIsProcessingPayment(true);
    try {
      const payAmount = activeJob.amount || (activeJob.category?.base_price || 300) + 50;
      
      let order;
      try {
        order = await api.payment.createOrder(payAmount, activeJob.id);
      } catch (e) {
        if (process.env.NODE_ENV === 'development') {
           await api.jobs.completeJobPayment(activeJob.id, payAmount, activeJob.worker_id || '');
           handlePaymentSuccess(activeJob);
           return;
        }
        throw new Error("Payment initialization failed. Please try again.");
      }

      const env = (import.meta as any).env || {};
      const razorpayKey = env.VITE_RAZORPAY_KEY_ID || '';

      const options = {
        key: razorpayKey, 
        amount: order.amount,
        currency: order.currency,
        name: "SkillConnect",
        description: `Payment for ${activeJob.category?.name}`,
        image: "https://picsum.photos/100", 
        order_id: order.id,
        handler: async function (response: RazorpayResponse) {
          try {
             await api.payment.verifyPayment(
                 response, 
                 activeJob.id, 
                 activeJob.worker_id || '', 
                 payAmount
             );
             handlePaymentSuccess(activeJob);
          } catch (err: any) {
             addToast('Payment verification failed: ' + err.message, 'error');
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
          contact: user.phone
        },
        theme: {
          color: "#2563EB"
        }
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.on('payment.failed', function (response: any){
          addToast(response.error.description, 'error');
      });
      rzp1.open();

    } catch (e: any) {
      addToast(e.message, 'error');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handlePaymentSuccess = (job: Job) => {
      setJobToReview(job);
      setActiveJob(null);
      addToast('Payment successful!', 'success');
      setIsReviewModalOpen(true);
      api.jobs.getHistoryForCustomer(user!.id).then(setPastJobs);
  };

  const handleSubmitReview = async () => {
    if (!jobToReview?.id || !user?.id || !jobToReview.worker_id) return;
    if (reviewRating === 0) {
      addToast('Please select a star rating', 'warning');
      return;
    }
    try {
      setIsSubmittingReview(true);
      await api.reviews.create(
        jobToReview.id,
        user.id,
        jobToReview.worker_id, 
        reviewRating,
        reviewComment
      );
      addToast('Review submitted! Thank you.', 'success');
      setIsReviewModalOpen(false);
      setJobToReview(null);
      setReviewRating(0);
      setReviewComment('');
    } catch (e: any) {
      addToast(e.message, 'error');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleSkipReview = () => {
    setIsReviewModalOpen(false);
    setJobToReview(null);
  };

  const handleCancelJob = async () => {
     if (!activeJob?.id || !user?.id) return;
     if(!window.confirm("Are you sure you want to cancel?")) return;
     
     try {
       await api.jobs.updateStatus(activeJob.id, JobStatus.CANCELLED);
       setActiveJob(null);
       addToast('Job Request Cancelled', 'info');
       const history = await api.jobs.getHistoryForCustomer(user.id);
       setPastJobs(history || []);
     } catch (e: any) {
       addToast(e.message, 'error');
     }
  }

  const handleReportIssue = async () => {
     if (!activeJob?.id) return;
     if (!window.confirm("Are you sure you want to report an issue with this job? Admin will be notified.")) return;
     try {
       await api.jobs.reportIssue(activeJob.id, "Customer reported issue via dashboard");
       addToast('Issue reported to Support Team', 'warning');
       api.jobs.getActiveForCustomer(user!.id).then(setActiveJob);
     } catch(e: any) {
       addToast(e.message, 'error');
     }
  }

  if (loading && !categories.length && !activeJob) {
    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
            <JobCardSkeleton />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1,2,3,4].map(i => <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse"></div>)}
            </div>
        </div>
    );
  }

  const renderHome = () => {
    if (activeJob) {
      return (
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
          
          <div className="flex justify-between items-end">
            <h2 className="text-2xl font-bold text-gray-900">Current Booking</h2>
            {activeJob.scheduled_time && (
                <Badge variant="warning" className="mb-1 flex items-center bg-amber-50 text-amber-800 border-amber-200">
                    <Calendar size={12} className="mr-1"/> 
                    {new Date(activeJob.scheduled_time).toLocaleString(undefined, {
                        month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric'
                    })}
                </Badge>
            )}
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
              <StatusStepper status={activeJob.status} />
              
              <div className="text-center mt-8">
                 <h3 className="text-xl font-bold text-gray-900">
                    {activeJob.status === JobStatus.SEARCHING && 'Finding Professional...'}
                    {activeJob.status === JobStatus.ACCEPTED && 'Professional Assigned'}
                    {activeJob.status === JobStatus.ARRIVED && 'Professional Arrived'}
                    {activeJob.status === JobStatus.IN_PROGRESS && 'Work In Progress'}
                    {activeJob.status === JobStatus.COMPLETED_PENDING_PAYMENT && 'Job Completed'}
                    {activeJob.status === JobStatus.DISPUTED && 'Job Disputed'}
                 </h3>
                 <p className="text-gray-500 text-sm mt-1">
                    {activeJob.status === JobStatus.SEARCHING && 'We are notifying experts nearby.'}
                    {activeJob.status === JobStatus.ACCEPTED && `${activeJob.worker?.name} is on the way.`}
                    {activeJob.status === JobStatus.ARRIVED && 'Please share the OTP below to start the job.'}
                    {activeJob.status === JobStatus.IN_PROGRESS && 'Sit back and relax while the work gets done.'}
                 </p>
              </div>
          </div>

          {activeJob.status === JobStatus.SEARCHING && (
            <Card className="text-center py-8 border-blue-100 bg-blue-50/30">
              <div className="relative w-32 h-32 mx-auto mb-6 flex items-center justify-center">
                <div className="absolute w-full h-full bg-blue-500/10 rounded-full animate-radar"></div>
                <div className="absolute w-20 h-20 bg-blue-500/20 rounded-full animate-radar" style={{animationDelay: '0.5s'}}></div>
                <div className="relative z-10 bg-white rounded-full p-3 shadow-lg border-2 border-blue-100">
                  <CategoryIcon iconName={activeJob.category?.icon} size={32} className="text-blue-600" />
                </div>
              </div>
              <Button variant="outline" className="text-red-500 border-red-200 hover:bg-red-50 hover:border-red-300" onClick={handleCancelJob}>
                 Cancel Request
              </Button>
            </Card>
          )}

          {activeJob.worker && (
            <Card className="border-l-4 border-l-blue-500">
              <div className="flex items-start space-x-4">
                 <div className="w-16 h-16 bg-gray-200 rounded-2xl flex-shrink-0 overflow-hidden shadow-md">
                   {activeJob.worker.avatar_url ? (
                     <img src={activeJob.worker.avatar_url} alt="Worker" className="w-full h-full object-cover" />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700 font-bold text-2xl">
                       {activeJob.worker.name?.[0]}
                     </div>
                   )}
                 </div>
                 <div className="flex-1">
                   <h4 className="text-lg font-bold text-gray-900">{activeJob.worker.name}</h4>
                   <div className="flex items-center text-sm text-yellow-500 mb-3">
                     <StarRating rating={Number(activeJob.worker.rating || 0)} readonly size={14} />
                     <span className="ml-1 text-gray-700 font-bold bg-yellow-50 px-1.5 rounded">{Number(activeJob.worker.rating || 0).toFixed(1)}</span>
                   </div>
                   <div className="flex space-x-3">
                      <Button size="sm" variant="outline" className="flex-1 rounded-lg">
                        <Phone size={14} className="mr-2" /> Call
                      </Button>
                      <Button 
                        size="sm" 
                        variant="secondary" 
                        className="flex-1 rounded-lg"
                        onClick={() => setIsChatOpen(true)}
                      >
                        <MessageSquare size={14} className="mr-2" /> Chat
                      </Button>
                   </div>
                 </div>
              </div>
            </Card>
          )}

          {(activeJob.status === JobStatus.ACCEPTED || activeJob.status === JobStatus.ARRIVED) && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-6 text-center">
                <p className="text-emerald-800 text-xs font-bold uppercase tracking-widest mb-3">Share OTP to Start Job</p>
                <div className="text-5xl font-mono font-bold text-emerald-600 tracking-[0.2em] drop-shadow-sm">
                  {activeJob.otp}
                </div>
            </div>
          )}

          {activeJob.status === JobStatus.COMPLETED_PENDING_PAYMENT && (
            <Card className="border-2 border-blue-600 shadow-xl shadow-blue-200">
              <h3 className="text-lg font-bold mb-4 flex items-center"><Sparkles className="mr-2 text-yellow-500"/> Payment Due</h3>
              <div className="bg-gray-50 p-5 rounded-xl space-y-3 mb-6 border border-gray-100">
                <div className="flex justify-between text-gray-600">
                  <span>Base Charge</span>
                  <span>₹{activeJob.category?.base_price || 300}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Service Fee</span>
                  <span>₹50</span>
                </div>
                <div className="flex justify-between font-bold text-xl pt-3 border-t border-gray-200 text-gray-900">
                  <span>Total</span>
                  <span>₹{activeJob.amount || (activeJob.category?.base_price || 300) + 50}</span>
                </div>
              </div>
              <Button 
                variant="primary" 
                className="w-full h-12 text-lg shadow-lg shadow-blue-500/30" 
                onClick={handleCompletePayment}
                isLoading={isProcessingPayment}
              >
                Pay Now (Razorpay)
              </Button>
            </Card>
          )}

          {['ACCEPTED', 'ARRIVED', 'IN_PROGRESS'].includes(activeJob.status) && (
             <div className="text-center">
                 <button onClick={handleReportIssue} className="text-gray-400 text-xs hover:text-red-500 hover:underline transition-colors flex items-center justify-center mx-auto">
                    <AlertCircle size={12} className="mr-1"/> Report an issue
                 </button>
             </div>
          )}

          {activeJob.worker && (
            <ChatWindow 
              jobId={activeJob.id} 
              recipientName={activeJob.worker.name} 
              isOpen={isChatOpen} 
              onClose={() => setIsChatOpen(false)} 
            />
          )}
        </div>
      );
    }

    return (
      <div className="space-y-8 animate-fade-in">
        <div className="relative bg-gradient-to-br from-blue-600 to-indigo-800 text-white p-8 md:p-10 rounded-3xl shadow-2xl shadow-blue-900/20 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-10 -mb-10 blur-xl"></div>
          
          <div className="relative z-10">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Hi, {user?.name}</h1>
            <p className="text-blue-100 mb-8 text-lg opacity-90">What do you need help with today?</p>
            <div className="bg-white rounded-xl p-2 flex items-center shadow-lg transform transition-transform hover:scale-[1.01]">
                <Search className="text-gray-400 ml-3" />
                <input 
                  type="text" 
                  placeholder="Search services..."
                  value={dashboardSearch}
                  onChange={(e) => setDashboardSearch(e.target.value)}
                  onKeyDown={handleDashboardSearch}
                  className="w-full px-4 py-3 outline-none text-gray-800 text-lg placeholder-gray-400 bg-transparent"
                />
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4 px-1">
             {dashboardSearch ? `Results for "${dashboardSearch}"` : 'Services'}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <Card 
                key={cat.id} 
                hover 
                onClick={() => handleCategoryClick(cat)}
                className="flex flex-col items-center justify-center py-8 border-transparent hover:border-blue-500 transition-all text-center group bg-white shadow-sm"
              >
                <div className="mb-4 transform group-hover:scale-110 transition-transform duration-300 drop-shadow-sm text-blue-600">
                    <CategoryIcon iconName={cat.icon} size={40} />
                </div>
                <span className="font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{cat.name}</span>
                <span className="text-xs text-blue-500 font-medium mt-1 bg-blue-50 px-2 py-0.5 rounded-md">
                    Starts ₹{cat.base_price}
                </span>
              </Card>
            ))}
          </div>
        </div>

        {pastJobs.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4 px-1 flex items-center">
              <History className="mr-2 text-gray-500" size={20} /> Past Jobs
            </h2>
            <div className="grid gap-4">
              {pastJobs.map(job => (
                <Card key={job.id} className="flex justify-between items-center p-5 hover:bg-gray-50 transition-colors cursor-default">
                  <div className="flex items-center space-x-4">
                     <div className="bg-gray-100 p-3 rounded-xl text-gray-600">
                       <CategoryIcon iconName={job.category?.icon} size={24} />
                     </div>
                     <div>
                       <h4 className="font-bold text-gray-900">{job.category?.name}</h4>
                       <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                           {new Date(job.created_at).toLocaleDateString()}
                       </p>
                     </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={job.status === JobStatus.COMPLETED ? 'success' : 'secondary'}>
                      {job.status === JobStatus.COMPLETED ? 'Completed' : 'Cancelled'}
                    </Badge>
                    {job.amount && <p className="text-sm font-bold text-gray-700 mt-1">₹{job.amount}</p>}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="pb-20 md:pb-0">
         {activeTab === 'home' ? renderHome() : <CustomerProfileView />}
      </div>

      <div className="mobile-bottom-bar bg-white/90 backdrop-blur-md border-t border-gray-200 shadow-lg z-40 pb-safe">
        <div className="flex justify-around items-center h-16 w-full">
          <button 
             onClick={() => setActiveTab('home')}
             className={`flex flex-col items-center justify-center w-full h-full relative ${activeTab === 'home' ? 'text-blue-600' : 'text-gray-400'}`}
          >
             {activeTab === 'home' && <span className="absolute top-0 w-full h-0.5 bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.5)]"></span>}
             <Briefcase size={24} />
             <span className="text-[10px] font-bold mt-1 uppercase tracking-wide">Services</span>
          </button>
          <button 
             onClick={() => setActiveTab('profile')}
             className={`flex flex-col items-center justify-center w-full h-full relative ${activeTab === 'profile' ? 'text-blue-600' : 'text-gray-400'}`}
          >
             {activeTab === 'profile' && <span className="absolute top-0 w-full h-0.5 bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.5)]"></span>}
             <User size={24} />
             <span className="text-[10px] font-bold mt-1 uppercase tracking-wide">Profile</span>
          </button>
        </div>
      </div>

      <Modal 
        isOpen={isCreateModalOpen} 
        onClose={() => !isUploadingImages && setCreateModalOpen(false)}
        title={`Request ${selectedCategory?.name}`}
      >
        <div className="space-y-5">
          <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg flex items-center text-blue-800 text-sm">
             <Shield size={16} className="mr-2 text-blue-600" />
             Verified professionals only
          </div>
          
          <Input 
            label="Describe the issue" 
            placeholder="e.g. Fan making noise, tap leaking..." 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="w-full">
             <label className="block text-sm font-bold text-gray-800 mb-1.5 ml-1">Schedule Time (Optional)</label>
             <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500 z-10">
                   <Clock size={18} />
                </div>
                <input 
                   type="datetime-local"
                   className="input-field w-full pl-11 pr-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
                   value={scheduledTime}
                   onChange={(e) => setScheduledTime(e.target.value)}
                />
             </div>
          </div>
          
          <div className="relative">
             <Input 
                label="Location" 
                placeholder="House No, Street, Area" 
                value={locationAddress}
                onChange={(e) => setLocationAddress(e.target.value)}
             />
             <button 
                className="absolute right-2 top-8 text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-50 rounded"
                onClick={handleGetLocation}
                title="Use Current Location"
             >
                {isLocating ? <Spinner size="sm" /> : <MapPin size={20} />}
             </button>
          </div>

          <div className="w-full">
             <label className="block text-sm font-bold text-gray-800 mb-1.5 ml-1">Attach Photos (Max 5)</label>
             <div className="grid grid-cols-4 gap-2">
                {selectedImages.map((file, idx) => (
                    <div key={idx} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                        <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
                        <button 
                          onClick={() => removeImage(idx)}
                          className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-red-500 transition-colors"
                        >
                            <XIcon size={12} />
                        </button>
                    </div>
                ))}
                {selectedImages.length < 5 && (
                    <label className="aspect-square bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-all">
                        <Camera size={20} className="text-gray-400" />
                        <span className="text-[10px] text-gray-500 mt-1 font-bold">ADD</span>
                        <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageSelect} />
                    </label>
                )}
             </div>
          </div>

          <div className="pt-2">
            <p className="text-sm text-gray-500 mb-2 flex justify-between px-1">
                <span>Estimated Cost:</span>
                <span className="font-bold text-gray-900 text-lg">₹{selectedCategory?.base_price} <span className="text-xs font-normal text-gray-400">+</span></span>
            </p>
            <Button 
                variant="primary" 
                className="w-full h-12 text-lg shadow-blue-500/25" 
                onClick={handleCreateJob}
                isLoading={loading || isUploadingImages}
                disabled={!description || !locationAddress}
            >
                {isUploadingImages ? 'Uploading Photos...' : (scheduledTime ? 'Schedule Booking' : 'Find Worker Now')}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isReviewModalOpen}
        onClose={handleSkipReview}
        title="Rate your experience"
      >
        <div className="text-center space-y-6 py-4">
           <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto overflow-hidden border-4 border-white shadow-lg">
              {jobToReview?.worker?.avatar_url ? (
                 <img src={jobToReview.worker.avatar_url} className="w-full h-full object-cover"/>
              ) : (
                 <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 text-2xl font-bold">
                    {jobToReview?.worker?.name?.[0]}
                 </div>
              )}
           </div>
           
           <div>
              <h3 className="text-xl font-bold text-gray-900">{jobToReview?.worker?.name}</h3>
              <p className="text-gray-500">How was the {jobToReview?.category?.name} service?</p>
           </div>

           <div className="flex justify-center py-2">
              <StarRating 
                 rating={reviewRating} 
                 onRatingChange={setReviewRating} 
                 size={36}
                 className="space-x-3"
              />
           </div>

           <textarea
              className="w-full p-4 border border-gray-200 bg-gray-50 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
              rows={3}
              placeholder="Write a short review (optional)..."
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
           />

           <div className="space-y-3">
              <Button 
                variant="primary" 
                className="w-full h-12 shadow-lg" 
                onClick={handleSubmitReview}
                isLoading={isSubmittingReview}
              >
                Submit Review
              </Button>
              <Button 
                variant="ghost" 
                className="w-full text-gray-400 hover:text-gray-600" 
                onClick={handleSkipReview}
              >
                Skip
              </Button>
           </div>
        </div>
      </Modal>
    </>
  );
};

export default CustomerDashboard;

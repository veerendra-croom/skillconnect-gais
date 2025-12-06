
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { ServiceCategory, JobStatus, Job, RazorpayResponse } from '../../types';
import { supabase } from '../../services/supabase';
import { MapPin, Clock, Search, Phone, MessageSquare, Star, Shield, History, Briefcase, User, Sparkles } from 'lucide-react';
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
        
        // Check for URL search param
        const query = searchParams.get('q');
        const loc = searchParams.get('loc');
        
        if (loc) setLocationAddress(loc);
        if (query) setDashboardSearch(query);

        let cats: ServiceCategory[] = [];

        if (query) {
           // Use Full Text Search
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

  // Realtime Subscription for Active Job
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
        // Refresh full job data
        api.jobs.getActiveForCustomer(user.id).then(setActiveJob);
        // Also refresh history in case it just completed
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
    // Attempt auto-location when modal opens if not already set from URL
    if (!locationAddress) handleGetLocation();
  };

  const handleGetLocation = async () => {
    setIsLocating(true);
    try {
      const position = await LocationService.getCurrentPosition();
      setCoords(position);
      setLocationAddress(`Lat: ${position.lat.toFixed(4)}, Lng: ${position.lng.toFixed(4)}`);
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
      const newJob = await api.jobs.create({
        customer_id: user.id,
        category_id: selectedCategory.id,
        description,
        location_address: locationAddress || 'Current Location',
        location_lat: coords?.lat,
        location_lng: coords?.lng,
      });
      setActiveJob(newJob); 
      setCreateModalOpen(false);
      addToast('Request posted! Finding workers...', 'success');
      // Refetch to get expanded relations
      api.jobs.getActiveForCustomer(user.id).then(setActiveJob);
    } catch (e: any) {
      addToast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCompletePayment = async () => {
    if (!activeJob?.id || !user?.id) return;
    
    setIsProcessingPayment(true);
    try {
      const payAmount = activeJob.amount || (activeJob.category?.base_price || 300) + 50;
      
      // 1. Create Order on Server
      // NOTE: Ensure 'razorpay' Edge Function is deployed
      let order;
      try {
        order = await api.payment.createOrder(payAmount, activeJob.id);
      } catch (e) {
        console.warn("Edge Function failed, using Mock Fallback if available or throwing error");
        // Fallback for development if edge function not present
        if (process.env.NODE_ENV === 'development') {
           console.log("Using Legacy Payment (Mock)");
           await api.jobs.completeJobPayment(activeJob.id, payAmount, activeJob.worker_id || '');
           handlePaymentSuccess(activeJob);
           return;
        }
        throw new Error("Payment initialization failed. Please try again.");
      }

      // 2. Open Razorpay Options
      const options = {
        key: "YOUR_RAZORPAY_KEY_ID", // Replace with your Public Key ID
        amount: order.amount,
        currency: order.currency,
        name: "SkillConnect",
        description: `Payment for ${activeJob.category?.name}`,
        image: "https://picsum.photos/100", // Logo
        order_id: order.id,
        handler: async function (response: RazorpayResponse) {
          try {
             // 3. Verify on Server
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
        user.id, // Reviewer (Customer)
        jobToReview.worker_id, // Reviewee (Worker)
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
     try {
       await api.jobs.updateStatus(activeJob.id, JobStatus.CANCELLED);
       setActiveJob(null);
       addToast('Job Request Cancelled', 'info');
       // Update history
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

  // Use Skeleton for loading state
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
    // --- VIEW: ACTIVE JOB TRACKING ---
    if (activeJob) {
      return (
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
          <h2 className="text-2xl font-bold text-gray-900">Current Booking</h2>
          
          {/* Animated Status Banner */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-2xl shadow-xl shadow-blue-500/20 flex items-center justify-between relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-blue-100 text-sm font-bold uppercase tracking-widest mb-1">Status Update</p>
              <h3 className="text-2xl font-bold">
                {activeJob.status === JobStatus.SEARCHING && 'Finding Professional...'}
                {activeJob.status === JobStatus.ACCEPTED && 'Worker Assigned'}
                {activeJob.status === JobStatus.ARRIVED && 'Worker Arrived'}
                {activeJob.status === JobStatus.IN_PROGRESS && 'Work In Progress'}
                {activeJob.status === JobStatus.COMPLETED_PENDING_PAYMENT && 'Job Completed'}
                {activeJob.status === JobStatus.DISPUTED && 'Disputed / On Hold'}
              </h3>
            </div>
            <div className="relative z-10 bg-white/10 backdrop-blur-md p-3 rounded-full border border-white/20">
              {activeJob.status === JobStatus.SEARCHING ? (
                <Search className="animate-pulse" size={32} />
              ) : (
                <Clock size={32} />
              )}
            </div>
            
            {/* Background pattern */}
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          </div>

          {/* Searching View with Radar Animation */}
          {activeJob.status === JobStatus.SEARCHING && (
            <Card className="text-center py-12 border-blue-100 bg-blue-50/30">
              <div className="relative w-48 h-48 mx-auto mb-8 flex items-center justify-center">
                {/* Radar Ripples */}
                <div className="absolute w-full h-full bg-blue-500/10 rounded-full animate-radar"></div>
                <div className="absolute w-32 h-32 bg-blue-500/20 rounded-full animate-radar" style={{animationDelay: '0.5s'}}></div>
                <div className="relative z-10 bg-white rounded-full p-4 shadow-lg border-2 border-blue-100">
                  <Search size={40} className="text-blue-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Broadcasting Request</h3>
              <p className="text-gray-500 mb-8 max-w-xs mx-auto">
                 We are notifying nearby {activeJob.category?.name || 'professionals'} about your request...
              </p>
              <Button variant="outline" className="text-red-500 border-red-200 hover:bg-red-50 hover:border-red-300" onClick={handleCancelJob}>
                 Cancel Request
              </Button>
            </Card>
          )}

          {/* Worker Details (If Accepted+) */}
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

          {/* OTP Section (Before Start) */}
          {(activeJob.status === JobStatus.ACCEPTED || activeJob.status === JobStatus.ARRIVED) && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-6 text-center">
                <p className="text-emerald-800 text-xs font-bold uppercase tracking-widest mb-3">Share OTP to Start Job</p>
                <div className="text-5xl font-mono font-bold text-emerald-600 tracking-[0.2em] drop-shadow-sm">
                  {activeJob.otp}
                </div>
            </div>
          )}

          {/* Payment Section */}
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

          {/* Dispute Button */}
          {['ACCEPTED', 'ARRIVED', 'IN_PROGRESS'].includes(activeJob.status) && (
             <button onClick={handleReportIssue} className="text-gray-400 text-xs hover:text-red-500 hover:underline w-full text-center transition-colors">
                Report an issue with this job
             </button>
          )}

          {/* Chat Window */}
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

    // --- VIEW: CATEGORY SELECTION & HISTORY ---
    return (
      <div className="space-y-8 animate-fade-in">
        {/* Welcome / Search */}
        <div className="relative bg-gradient-to-br from-blue-600 to-indigo-800 text-white p-8 md:p-10 rounded-3xl shadow-2xl shadow-blue-900/20 overflow-hidden">
          {/* Decorative circles */}
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

        {/* Categories */}
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
                <span className="text-4xl mb-4 transform group-hover:scale-110 transition-transform duration-300 drop-shadow-sm">
                    {['⚡','wrench','hammer','droplet','palette'].includes(cat.icon) ? '🛠️' : cat.icon || '🛠️'}
                </span>
                <span className="font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{cat.name}</span>
                <span className="text-xs text-blue-500 font-medium mt-1 bg-blue-50 px-2 py-0.5 rounded-md">
                    Starts ₹{cat.base_price}
                </span>
              </Card>
            ))}
          </div>
        </div>

        {/* Past Jobs History */}
        {pastJobs.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4 px-1 flex items-center">
              <History className="mr-2 text-gray-500" size={20} /> Past Jobs
            </h2>
            <div className="grid gap-4">
              {pastJobs.map(job => (
                <Card key={job.id} className="flex justify-between items-center p-5 hover:bg-gray-50 transition-colors cursor-default">
                  <div className="flex items-center space-x-4">
                     <div className="bg-gray-100 p-3 rounded-xl text-2xl">
                       {job.category?.icon || '🔧'}
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

      {/* Bottom Nav for Mobile */}
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

      {/* Create Job Modal */}
      <Modal 
        isOpen={isCreateModalOpen} 
        onClose={() => setCreateModalOpen(false)}
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

          <div className="pt-2">
            <p className="text-sm text-gray-500 mb-2 flex justify-between px-1">
                <span>Estimated Cost:</span>
                <span className="font-bold text-gray-900 text-lg">₹{selectedCategory?.base_price} <span className="text-xs font-normal text-gray-400">+</span></span>
            </p>
            <Button 
                variant="primary" 
                className="w-full h-12 text-lg shadow-blue-500/25" 
                onClick={handleCreateJob}
                isLoading={loading}
            >
                Find Worker Now
            </Button>
          </div>
        </div>
      </Modal>

      {/* Review Modal */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={handleSkipReview} // Allow closing to skip
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

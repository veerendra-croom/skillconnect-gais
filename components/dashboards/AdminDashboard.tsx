
import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { supabase } from '../../services/supabase';
import { StorageService } from '../../services/storage';
import { WorkerStatus, Profile, Job, Transaction, UserRole, SystemSettings } from '../../types';
import { useToast } from '../../context/ToastContext';
import Card from '../Card';
import Button from '../Button';
import Input from '../Input';
import { Check, X, Users, Activity, Settings, Trash2, AlertCircle, Search, Clock, DollarSign, TrendingUp, ChevronRight, Ban, Unlock, Download, RefreshCw } from 'lucide-react';
import Modal from '../Modal';
import Badge from '../Badge';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'verifications' | 'live_jobs' | 'users' | 'financials' | 'disputes' | 'cms' | 'settings'>('verifications');
  
  // Data States
  const [pendingWorkers, setPendingWorkers] = useState<Profile[]>([]);
  const [activeJobs, setActiveJobs] = useState<Job[]>([]);
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [disputedJobs, setDisputedJobs] = useState<Job[]>([]);
  const [recentWithdrawals, setRecentWithdrawals] = useState<(Transaction & { worker: Profile })[]>([]);
  const [platformStats, setPlatformStats] = useState({ totalGMV: 0, totalRevenue: 0 });
  
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  // Search/Filter States
  const [userSearch, setUserSearch] = useState('');
  const [jobSearch, setJobSearch] = useState('');

  // CMS Form
  const [newCatName, setNewCatName] = useState('');
  const [newCatPrice, setNewCatPrice] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('');

  // Settings State (DB)
  const [settings, setSettings] = useState<SystemSettings>({
      id: '',
      maintenance_mode: false,
      allow_registration: true,
      commission_rate: 10,
      updated_at: ''
  });

  // Job Detail Modal
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  useEffect(() => {
    loadData();
    loadSettings();
    
    // --- REALTIME SUBSCRIPTIONS ---
    
    // 1. Listen for new workers (Profiles table changes)
    const profileSub = supabase
      .channel('admin-profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
         // Refresh users and pending workers
         if (activeTab === 'users' || activeTab === 'verifications') {
             api.admin.getAllUsers().then(setAllUsers);
             api.profiles.getPendingWorkers().then(setPendingWorkers);
         }
      })
      .subscribe();

    // 2. Listen for Job changes
    const jobSub = supabase
      .channel('admin-jobs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, () => {
         api.jobs.getAllActive().then(jobs => {
             setActiveJobs(jobs);
             setDisputedJobs(jobs.filter((j: Job) => j.status === 'DISPUTED'));
         });
         // Also update stats if completed
         if (activeTab === 'financials') api.admin.getPlatformStats().then(setPlatformStats);
      })
      .subscribe();

    // 3. Listen for Transactions (Withdrawals)
    const txSub = supabase
       .channel('admin-tx')
       .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transactions' }, () => {
           if (activeTab === 'financials') api.wallet.getAllWithdrawals().then(setRecentWithdrawals);
       })
       .subscribe();

    return () => {
        profileSub.unsubscribe();
        jobSub.unsubscribe();
        txSub.unsubscribe();
    };
  }, [activeTab]);

  const loadSettings = async () => {
      try {
          const data = await api.settings.get();
          if (data) setSettings(data);
      } catch (e) {
          console.warn("Could not load settings", e);
      }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const promises: Promise<any>[] = [
        api.profiles.getPendingWorkers(),
        api.jobs.getAllActive(),
      ];

      if (activeTab === 'users') promises.push(api.admin.getAllUsers());
      if (activeTab === 'financials') {
          promises.push(api.wallet.getAllWithdrawals());
          promises.push(api.admin.getPlatformStats());
      }
      if (activeTab === 'cms') promises.push(api.categories.list());

      const results = await Promise.all(promises);
      
      setPendingWorkers(results[0] || []);
      const jobs = results[1] || [];
      setActiveJobs(jobs);
      setDisputedJobs(jobs.filter((j: Job) => j.status === 'DISPUTED'));

      if (activeTab === 'users') setAllUsers(results[2] || []);
      if (activeTab === 'financials') {
          setRecentWithdrawals(results[2] || []);
          setPlatformStats(results[3] || { totalGMV: 0, totalRevenue: 0 });
      }
      if (activeTab === 'cms') setCategories(results[2] || []);

    } catch (e) {
      console.error(e);
      addToast('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDoc = async (path: string) => {
    try {
      const url = await StorageService.createSignedUrl('verification-docs', path);
      if (url) window.open(url, '_blank');
    } catch (e: any) {
      console.error(e);
      addToast('Could not access secure document', 'error');
    }
  };

  const handleVerify = async (id: string, approve: boolean) => {
    try {
      await api.profiles.updateWorkerStatus(
        id, 
        approve ? WorkerStatus.VERIFIED : WorkerStatus.UNVERIFIED
      );
      addToast(approve ? 'Worker Approved' : 'Worker Rejected', approve ? 'success' : 'info');
      // No need to manually loadData() due to realtime, but safer to keep for immediate local feedback
      loadData();
    } catch (e: any) {
      addToast(e.message, 'error');
    }
  };

  const handleToggleBan = async (user: Profile) => {
      const isSuspended = user.worker_status === WorkerStatus.SUSPENDED;
      const confirmMsg = isSuspended 
        ? `Reactivate ${user.name}?` 
        : `Suspend ${user.name}? They will lose access to the platform.`;
      
      if (!window.confirm(confirmMsg)) return;

      try {
          await api.admin.toggleUserSuspension(user.id, !isSuspended);
          addToast(`User ${isSuspended ? 'reactivated' : 'suspended'}`, 'success');
          loadData();
      } catch (e: any) {
          addToast(e.message, 'error');
      }
  };

  const handleAddCategory = async () => {
      if(!newCatName || !newCatPrice) return;
      try {
          await api.categories.create(newCatName, parseFloat(newCatPrice), newCatIcon || 'wrench');
          addToast('Category created', 'success');
          setNewCatName('');
          setNewCatPrice('');
          setNewCatIcon('');
          loadData();
      } catch(e: any) {
          addToast(e.message, 'error');
      }
  };

  const handleDeleteCategory = async (id: string) => {
      if(!window.confirm('Delete this category?')) return;
      try {
          await api.categories.delete(id);
          addToast('Category deleted', 'info');
          loadData();
      } catch(e: any) {
          addToast(e.message, 'error');
      }
  };

  const handleResolveDispute = async (jobId: string, resolution: 'REFUND' | 'PAY') => {
      try {
          await api.jobs.resolveDispute(jobId, resolution);
          addToast(`Dispute resolved: ${resolution}`, 'success');
          loadData();
      } catch (e: any) {
          addToast(e.message, 'error');
      }
  };

  const saveSettings = async () => {
      try {
          await api.settings.update(settings);
          addToast('System settings saved to database', 'success');
      } catch (e: any) {
          addToast(e.message, 'error');
      }
  };

  // Filtered Users
  const filteredUsers = allUsers.filter(u => 
      u.name?.toLowerCase().includes(userSearch.toLowerCase()) || 
      u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  // Filtered Jobs
  const filteredJobs = activeJobs.filter(j => 
      j.category?.name.toLowerCase().includes(jobSearch.toLowerCase()) ||
      j.id.includes(jobSearch)
  );

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Admin Console</h1>
            <p className="text-gray-500 mt-1">Super Admin privileges enabled.</p>
        </div>
        <div className="flex space-x-3">
            <Button size="sm" variant="outline" onClick={loadData}><RefreshCw size={16} className="mr-2"/> Force Refresh</Button>
            <div className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-xl text-xs font-bold border border-emerald-200 shadow-sm flex items-center">
               <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-2"></span> SYSTEM LIVE
            </div>
        </div>
      </div>
      
      {/* Navigation Tabs - Scrollable */}
      <div className="flex space-x-1 border-b border-gray-200/60 overflow-x-auto pb-0.5 no-scrollbar">
          {['verifications', 'live_jobs', 'users', 'financials', 'disputes', 'cms', 'settings'].map((tab) => (
             <button 
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-6 py-4 font-bold text-sm tracking-wide rounded-t-2xl transition-all relative whitespace-nowrap ${activeTab === tab 
                   ? 'bg-white text-blue-600 shadow-sm border border-b-0 border-gray-100 z-10' 
                   : 'text-gray-400 hover:text-gray-600 hover:bg-white/40'}`}
             >
                {tab.replace('_', ' ').toUpperCase()}
                {activeTab === tab && <div className="absolute top-0 left-0 w-full h-1 bg-blue-600 rounded-t-2xl"></div>}
             </button>
          ))}
      </div>

      {/* Main Content Area */}
      <div className="min-h-[500px] animate-fade-in">
        {loading && activeJobs.length === 0 ? (
             <div className="flex justify-center py-32">
               <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
             </div>
        ) : (
             <div className="space-y-6">
                
                {/* --- VERIFICATIONS TAB --- */}
                {activeTab === 'verifications' && (
                  <>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-800">Pending Approvals</h2>
                        <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold border border-blue-100">{pendingWorkers.length} Pending</span>
                    </div>
                    {pendingWorkers.length === 0 ? (
                      <div className="bg-white/50 backdrop-blur-sm p-16 rounded-3xl border border-dashed border-gray-300 text-center text-gray-500">
                        <Check className="mx-auto mb-4 text-green-500 bg-green-50 p-3 rounded-full" size={64} />
                        <h3 className="text-lg font-bold text-gray-900">All Clear!</h3>
                        <p>No workers waiting for verification.</p>
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {pendingWorkers.map((worker, idx) => (
                          <div key={worker.id} className="animate-slide-up" style={{animationDelay: `${idx * 100}ms`}}>
                             <Card glass className="flex flex-col md:flex-row justify-between items-center gap-6 group hover:shadow-lg transition-all border-l-4 border-l-blue-500">
                                <div className="flex items-center space-x-5 w-full md:w-auto">
                                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center font-bold text-2xl text-white shadow-md">
                                    {worker.name[0]}
                                    </div>
                                    <div>
                                    <h4 className="font-bold text-gray-900 text-xl">{worker.name}</h4>
                                    <p className="text-sm text-gray-500 font-medium flex items-center mt-1"><Clock size={14} className="mr-1"/> Applied: {new Date(worker.created_at || '').toLocaleDateString()}</p>
                                    <div className="mt-2 flex space-x-2">
                                        <Badge variant="secondary">{worker.phone}</Badge>
                                        <Badge variant="info">ID Proof Uploaded</Badge>
                                    </div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
                                    {worker.verification_docs?.[0] && (
                                         <Button 
                                            size="sm" 
                                            variant="outline" 
                                            onClick={() => handleViewDoc(worker.verification_docs![0])}
                                            className="mr-2"
                                         >
                                            View Doc
                                         </Button>
                                    )}
                                    <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-50 border border-red-100" onClick={() => handleVerify(worker.id, false)}>
                                        Reject
                                    </Button>
                                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md" onClick={() => handleVerify(worker.id, true)}>
                                        Approve Worker
                                    </Button>
                                </div>
                             </Card>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* --- USERS MANAGEMENT TAB --- */}
                {activeTab === 'users' && (
                    <div className="space-y-6">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                             <div className="relative w-full md:w-96">
                                 <Input 
                                    placeholder="Search users by name or email..." 
                                    value={userSearch}
                                    onChange={(e) => setUserSearch(e.target.value)}
                                    icon={<Search size={18} />}
                                 />
                             </div>
                             <div className="flex space-x-2">
                                 <Badge variant="primary" className="h-10 px-4 text-sm">Total: {allUsers.length}</Badge>
                             </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">User</th>
                                        <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                                        <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Joined</th>
                                        <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredUsers.map(u => (
                                        <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="p-4">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                                                        {u.name?.[0]}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900 text-sm">{u.name}</p>
                                                        <p className="text-xs text-gray-500">{u.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <Badge variant={u.role === UserRole.WORKER ? 'info' : u.role === UserRole.ADMIN ? 'primary' : 'secondary'}>
                                                    {u.role}
                                                </Badge>
                                            </td>
                                            <td className="p-4">
                                                {u.worker_status === WorkerStatus.SUSPENDED ? (
                                                    <Badge variant="error" className="flex w-fit items-center"><Ban size={10} className="mr-1"/> Suspended</Badge>
                                                ) : (
                                                    <Badge variant="success" className="w-fit">Active</Badge>
                                                )}
                                            </td>
                                            <td className="p-4 text-sm text-gray-500">
                                                {new Date(u.created_at || '').toLocaleDateString()}
                                            </td>
                                            <td className="p-4 text-right">
                                                <button 
                                                    onClick={() => handleToggleBan(u)}
                                                    className={`p-2 rounded-lg transition-colors ${u.worker_status === WorkerStatus.SUSPENDED ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                                                    title={u.worker_status === WorkerStatus.SUSPENDED ? "Reactivate User" : "Suspend User"}
                                                >
                                                    {u.worker_status === WorkerStatus.SUSPENDED ? <Unlock size={16} /> : <Ban size={16} />}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* --- FINANCIALS TAB --- */}
                {activeTab === 'financials' && (
                    <div className="space-y-8">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card glass className="bg-gradient-to-r from-gray-900 to-gray-800 text-white border-none shadow-2xl">
                                <div className="p-4">
                                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Total Gross Merchandise Value</p>
                                    <h3 className="text-5xl font-black tracking-tight">₹{platformStats.totalGMV.toLocaleString()}</h3>
                                    <p className="text-sm text-gray-400 mt-4 flex items-center">
                                        <TrendingUp size={16} className="text-green-500 mr-2" /> Lifetime transaction volume
                                    </p>
                                </div>
                            </Card>
                            <Card glass className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-none shadow-2xl">
                                <div className="p-4">
                                    <p className="text-emerald-100 text-xs font-bold uppercase tracking-wider mb-2">Platform Revenue ({settings.commission_rate}%)</p>
                                    <h3 className="text-5xl font-black tracking-tight">₹{platformStats.totalRevenue.toLocaleString()}</h3>
                                    <p className="text-sm text-emerald-100 mt-4 flex items-center">
                                        <DollarSign size={16} className="text-white mr-2" /> Net earnings
                                    </p>
                                </div>
                            </Card>
                        </div>

                        {/* Withdrawals List */}
                        <div>
                            <h3 className="font-bold text-gray-900 text-lg mb-4">Recent Withdrawals</h3>
                            <div className="space-y-3">
                                {recentWithdrawals.length === 0 ? (
                                    <div className="text-center p-8 bg-gray-50 rounded-xl text-gray-500">No recent withdrawal requests.</div>
                                ) : (
                                    recentWithdrawals.map(tx => (
                                        <div key={tx.id} className="flex justify-between items-center p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center">
                                                    <Download size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900">₹{tx.amount}</p>
                                                    <p className="text-xs text-gray-500">Requested by {tx.worker?.name}</p>
                                                </div>
                                            </div>
                                            <Badge variant={tx.status === 'PENDING' ? 'warning' : tx.status === 'COMPLETED' ? 'success' : 'error'}>
                                                {tx.status}
                                            </Badge>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* --- LIVE JOBS TAB --- */}
                {activeTab === 'live_jobs' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center mb-2">
                            <h2 className="text-xl font-bold text-gray-800">Live Operations</h2>
                            <div className="w-64">
                                <Input placeholder="Search jobs..." value={jobSearch} onChange={e => setJobSearch(e.target.value)} icon={<Search size={16}/>} />
                            </div>
                        </div>
                        
                        <div className="space-y-3">
                            {filteredJobs.map((job, idx) => (
                                <div 
                                    key={job.id} 
                                    className="group relative bg-white/70 backdrop-blur-md rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer animate-slide-up flex items-center justify-between"
                                    style={{animationDelay: `${idx * 50}ms`}}
                                    onClick={() => setSelectedJob(job)}
                                >
                                    <div className="flex items-center space-x-4">
                                        <div className={`w-3 h-3 rounded-full shadow-sm ${
                                            job.status === 'IN_PROGRESS' ? 'bg-purple-500 animate-pulse' :
                                            job.status === 'ACCEPTED' ? 'bg-blue-500' :
                                            'bg-gray-400'
                                        }`}></div>
                                        <div>
                                            <p className="font-bold text-gray-900">{job.category?.name}</p>
                                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                                                ID: {job.id.slice(0,8)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="hidden md:block">
                                        <p className="text-sm font-semibold text-gray-700">{job.customer?.name}</p>
                                        <p className="text-xs text-gray-400">Customer</p>
                                    </div>

                                    <div className="hidden md:block">
                                        <p className="text-sm font-semibold text-gray-700">{job.worker?.name || 'Unassigned'}</p>
                                        <p className="text-xs text-gray-400">Worker</p>
                                    </div>

                                    <div className="flex items-center space-x-3">
                                        <Badge variant={job.status === 'IN_PROGRESS' ? 'primary' : 'secondary'} className="px-3 py-1">
                                            {job.status.replace('_', ' ')}
                                        </Badge>
                                        <ChevronRight size={18} className="text-gray-300 group-hover:text-blue-500 transition-colors"/>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- DISPUTES TAB --- */}
                {activeTab === 'disputes' && (
                     <div className="space-y-4">
                        <h2 className="text-xl font-bold text-gray-800">Resolution Center</h2>
                        {disputedJobs.length === 0 ? (
                            <div className="text-center py-20 bg-white/50 rounded-3xl border border-dashed border-gray-200">
                               <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                   <Check className="text-green-500" size={32} />
                               </div>
                               <h3 className="font-bold text-gray-900">Zero Disputes</h3>
                               <p className="text-gray-500 mt-1">Platform operations are running smoothly.</p>
                            </div>
                        ) : (
                            disputedJobs.map(job => (
                                <Card key={job.id} glass className="border-l-4 border-l-red-500 bg-red-50/30">
                                    <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                                        <div className="flex-1">
                                            <div className="flex items-center mb-3">
                                               <Badge variant="error" className="flex items-center px-2 py-1">
                                                   <AlertCircle size={14} className="mr-1" /> Needs Attention
                                               </Badge>
                                               <span className="text-xs text-gray-400 ml-3 font-mono">{job.id}</span>
                                            </div>
                                            <h4 className="font-bold text-gray-900 text-lg mb-2">Issue with {job.category?.name} Service</h4>
                                            <div className="grid grid-cols-2 gap-4 bg-white/50 p-4 rounded-xl border border-white/60">
                                                <div>
                                                    <p className="text-xs text-gray-500 uppercase font-bold">Customer Claim</p>
                                                    <p className="text-sm font-medium">{job.customer?.name}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 uppercase font-bold">Worker Involved</p>
                                                    <p className="text-sm font-medium">{job.worker?.name}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-3 w-full md:w-auto">
                                            <Button size="sm" className="w-full bg-white text-red-600 border border-red-200 hover:bg-red-50 shadow-sm" onClick={() => handleResolveDispute(job.id, 'REFUND')}>
                                                Refund Customer
                                            </Button>
                                            <Button size="sm" variant="primary" className="w-full bg-gray-900 text-white shadow-lg" onClick={() => handleResolveDispute(job.id, 'PAY')}>
                                                Release Payment to Worker
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            ))
                        )}
                     </div>
                )}

                {/* --- CMS TAB --- */}
                {activeTab === 'cms' && (
                    <div className="space-y-8">
                         <Card glass className="border-t-4 border-t-blue-500 shadow-xl">
                             <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center"><Settings size={20} className="mr-2 text-blue-500"/> Add New Service Category</h3>
                             <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                                 <Input 
                                    label="Service Name" 
                                    placeholder="e.g. Gardener" 
                                    value={newCatName}
                                    onChange={(e) => setNewCatName(e.target.value)}
                                 />
                                 <Input 
                                    label="Base Price (₹)" 
                                    type="number"
                                    placeholder="300" 
                                    value={newCatPrice}
                                    onChange={(e) => setNewCatPrice(e.target.value)}
                                 />
                                 <Input 
                                    label="Icon Name (Lucide)" 
                                    placeholder="flower" 
                                    value={newCatIcon}
                                    onChange={(e) => setNewCatIcon(e.target.value)}
                                 />
                                 <Button onClick={handleAddCategory} className="h-12 shadow-lg w-full md:w-auto">Create Service</Button>
                             </div>
                         </Card>

                         <div className="space-y-4">
                             <h3 className="font-bold text-gray-700 ml-1 text-sm uppercase tracking-wide">Active Services Directory</h3>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {categories.map(cat => (
                                    <div key={cat.id} className="flex justify-between items-center bg-white/70 backdrop-blur-sm p-5 border border-gray-100 rounded-2xl hover:shadow-lg hover:-translate-y-1 transition-all group">
                                        <div className="flex items-center space-x-4">
                                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-3 rounded-xl text-blue-600 group-hover:scale-110 transition-transform shadow-sm border border-blue-100">
                                                <Settings size={20} />
                                            </div>
                                            <div>
                                                <span className="font-bold text-gray-900 block text-lg">{cat.name}</span>
                                                <span className="text-gray-500 text-sm font-medium">Base Price: ₹{cat.base_price}</span>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleDeleteCategory(cat.id)} 
                                            className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-2.5 rounded-xl transition-colors"
                                            title="Delete Category"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                ))}
                             </div>
                         </div>
                    </div>
                )}
                
                {/* --- SETTINGS TAB (CONNECTED TO DB) --- */}
                {activeTab === 'settings' && (
                    <div className="max-w-2xl mx-auto space-y-6">
                        <Card>
                            <h3 className="font-bold text-lg mb-4">Platform Configuration</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                                    <div>
                                        <p className="font-bold text-gray-900">Maintenance Mode</p>
                                        <p className="text-xs text-gray-500">Suspend all new job requests temporarily.</p>
                                    </div>
                                    <div 
                                        className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${settings.maintenance_mode ? 'bg-red-500' : 'bg-gray-300'}`}
                                        onClick={() => setSettings(s => ({...s, maintenance_mode: !s.maintenance_mode}))}
                                    >
                                        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${settings.maintenance_mode ? 'left-7' : 'left-1'}`}></div>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                                    <div>
                                        <p className="font-bold text-gray-900">Worker Registration</p>
                                        <p className="text-xs text-gray-500">Allow new workers to sign up.</p>
                                    </div>
                                    <div 
                                        className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${settings.allow_registration ? 'bg-green-500' : 'bg-gray-300'}`}
                                        onClick={() => setSettings(s => ({...s, allow_registration: !s.allow_registration}))}
                                    >
                                        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${settings.allow_registration ? 'left-7' : 'left-1'}`}></div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                        <Card>
                             <h3 className="font-bold text-lg mb-4">Commission Model</h3>
                             <div className="flex items-center space-x-4">
                                 <Input 
                                    label="Base Commission (%)" 
                                    type="number" 
                                    value={settings.commission_rate}
                                    onChange={(e) => setSettings(s => ({...s, commission_rate: parseInt(e.target.value)}))}
                                    className="w-24" 
                                 />
                                 <p className="text-sm text-gray-500 mt-6">Current standard take-rate for all completed jobs.</p>
                             </div>
                             <div className="mt-4 text-right">
                                 <Button size="sm" onClick={saveSettings}>Save Database Changes</Button>
                             </div>
                        </Card>
                    </div>
                )}
             </div>
        )}
      </div>

      {/* Detail Modal */}
      <Modal isOpen={!!selectedJob} onClose={() => setSelectedJob(null)} title="Job Details">
        {selectedJob && (
            <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Description</p>
                    <p className="text-gray-900 font-medium">{selectedJob.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Customer</p>
                        <p className="font-bold">{selectedJob.customer?.name}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Worker</p>
                        <p className="font-bold">{selectedJob.worker?.name || 'Unassigned'}</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Date</p>
                        <p className="font-bold text-sm">{new Date(selectedJob.created_at).toLocaleString()}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Location</p>
                        <p className="font-bold text-sm truncate">{selectedJob.location_address}</p>
                    </div>
                </div>
                <Button variant="ghost" className="w-full border" onClick={() => setSelectedJob(null)}>Close</Button>
            </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminDashboard;

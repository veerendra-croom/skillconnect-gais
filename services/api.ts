
import { supabase } from './supabase';
import { Job, JobStatus, WorkerStatus, ServiceCategory, Profile, Message, Transaction, Review, NotificationItem, UserRole, SystemSettings, RazorpayOrder, RazorpayResponse } from '../types';

export const api = {
  categories: {
    list: async () => {
      const { data, error } = await supabase
        .from('service_categories')
        .select('*');
      if (error) throw error;
      return data as ServiceCategory[];
    },
    search: async (query: string) => {
      const { data, error } = await supabase
        .rpc('search_categories', { keyword: query });
      
      if (error) throw error;
      return data as ServiceCategory[];
    },
    create: async (name: string, basePrice: number, icon: string) => {
        const { error } = await supabase.from('service_categories').insert([{
            name, base_price: basePrice, icon, description: 'Service'
        }]);
        if (error) throw error;
    },
    delete: async (id: string) => {
        const { error } = await supabase.from('service_categories').delete().eq('id', id);
        if (error) throw error;
    }
  },

  profiles: {
    get: async (id: string) => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Profile;
    },
    update: async (id: string, updates: Partial<Profile>) => {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    updateWorkerStatus: async (id: string, status: WorkerStatus) => {
      const { error } = await supabase
        .from('profiles')
        .update({ worker_status: status })
        .eq('id', id);
      if (error) throw error;
    },
    getPendingWorkers: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('worker_status', WorkerStatus.PENDING_REVIEW);
      if (error) throw error;
      return data as Profile[];
    },
    submitVerification: async (id: string, docPath: string) => {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          worker_status: WorkerStatus.PENDING_REVIEW,
          verification_docs: [docPath]
        })
        .eq('id', id);
      if (error) throw error;
    }
  },

  admin: {
    getAllUsers: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Profile[];
    },
    toggleUserSuspension: async (userId: string, isSuspended: boolean) => {
      // 1. Fetch user role to determine appropriate unsuspended status
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (fetchError) throw fetchError;

      let status: WorkerStatus | null = null;

      if (isSuspended) {
        status = WorkerStatus.SUSPENDED;
      } else {
        // Reactivating logic
        if (profile.role === UserRole.WORKER) {
            status = WorkerStatus.VERIFIED; // Assume verified if unbanning a worker
        } else {
            status = null; // Customers have null status
        }
      }
      
      const { error } = await supabase
        .from('profiles')
        .update({ worker_status: status }) 
        .eq('id', userId);
      if (error) throw error;
    },
    getPlatformStats: async () => {
      // Get all completed jobs to calc GMV
      const { data: jobs, error } = await supabase
        .from('jobs')
        .select('amount')
        .eq('status', JobStatus.COMPLETED);
      
      if (error) throw error;

      // Fetch Commission Rate from Settings
      const { data: settings } = await supabase
        .from('system_settings')
        .select('commission_rate')
        .single();
      
      const commissionRate = (settings?.commission_rate || 10) / 100;

      const totalGMV = jobs?.reduce((sum, job) => sum + (job.amount || 0), 0) || 0;
      const totalRevenue = totalGMV * commissionRate;
      
      return { totalGMV, totalRevenue };
    }
  },

  settings: {
    get: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .single();
      if (error && error.code !== 'PGRST116') throw error; // Ignore no rows error if table empty initially
      return data as SystemSettings;
    },
    update: async (settings: Partial<SystemSettings>) => {
      // Upsert to handle first-time creation
      const { error } = await supabase
        .from('system_settings')
        .upsert([{ ...settings, updated_at: new Date().toISOString() }]); // Assumes ID is constant or single row policy
      
      // Since we don't know the ID, we might need to fetch first or ensure logic. 
      // Better approach for single row config:
      const { data: existing } = await supabase.from('system_settings').select('id').single();
      
      if (existing) {
         const { error: updateError } = await supabase
            .from('system_settings')
            .update({ ...settings, updated_at: new Date().toISOString() })
            .eq('id', existing.id);
         if (updateError) throw updateError;
      } else {
         const { error: insertError } = await supabase
            .from('system_settings')
            .insert([{ ...settings }]);
         if (insertError) throw insertError;
      }
    }
  },

  jobs: {
    create: async (job: Partial<Job>) => {
      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      const { data, error } = await supabase
        .from('jobs')
        .insert([{ ...job, otp, status: JobStatus.SEARCHING }])
        .select()
        .single();
      if (error) throw error;
      return data as Job;
    },
    
    getActiveForCustomer: async (customerId: string) => {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          worker:worker_id (*),
          category:category_id (*)
        `)
        .eq('customer_id', customerId)
        .neq('status', JobStatus.COMPLETED)
        .neq('status', JobStatus.CANCELLED)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data as Job;
    },

    getHistoryForCustomer: async (customerId: string) => {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          worker:worker_id (*),
          category:category_id (*)
        `)
        .eq('customer_id', customerId)
        .in('status', [JobStatus.COMPLETED, JobStatus.CANCELLED])
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Job[];
    },

    getActiveForWorker: async (workerId: string) => {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          customer:customer_id (*),
          category:category_id (*)
        `)
        .eq('worker_id', workerId)
        .neq('status', JobStatus.COMPLETED)
        .neq('status', JobStatus.CANCELLED)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as Job;
    },

    getAllActive: async () => {
        const { data, error } = await supabase
          .from('jobs')
          .select(`*, worker:worker_id(*), category:category_id(*), customer:customer_id(*)`)
          .in('status', [JobStatus.ACCEPTED, JobStatus.ARRIVED, JobStatus.IN_PROGRESS, JobStatus.DISPUTED]);
        if (error) throw error;
        return data as Job[];
    },

    getAvailableForWorker: async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
           *,
           customer:customer_id (*),
           category:category_id (*)
        `)
        .eq('status', JobStatus.SEARCHING)
        .is('worker_id', null)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Job[];
    },

    accept: async (jobId: string, workerId: string) => {
      const { data, error } = await supabase
        .from('jobs')
        .update({ 
          worker_id: workerId, 
          status: JobStatus.ACCEPTED 
        })
        .eq('id', jobId)
        .eq('status', JobStatus.SEARCHING)
        .select();

      if (error) throw error;
      
      if (!data || data.length === 0) {
        throw new Error('This job has already been accepted by another worker.');
      }
      return data[0] as Job;
    },

    updateStatus: async (jobId: string, status: JobStatus, extraData?: any) => {
      const { error } = await supabase
        .from('jobs')
        .update({ status, ...extraData })
        .eq('id', jobId);
      if (error) throw error;
    },

    verifyOtpAndStart: async (jobId: string, otp: string) => {
        // First check OTP
        const { data: job, error: fetchError } = await supabase
          .from('jobs')
          .select('otp')
          .eq('id', jobId)
          .single();
        
        if (fetchError) throw fetchError;
        if (job.otp !== otp) throw new Error('Invalid OTP');
  
        const { error } = await supabase
          .from('jobs')
          .update({ status: JobStatus.IN_PROGRESS })
          .eq('id', jobId);
        if (error) throw error;
    },

    // Legacy method - kept for fallback if edge functions aren't deployed
    completeJobPayment: async (jobId: string, amount: number, workerId: string) => {
      // 1. Update Job Status
      const { error: jobError } = await supabase
        .from('jobs')
        .update({ status: JobStatus.COMPLETED })
        .eq('id', jobId);
      if (jobError) throw jobError;

      // 2. Create Transaction (Credit) for Worker
      const { error: transError } = await supabase
        .from('transactions')
        .insert([{
            worker_id: workerId,
            job_id: jobId,
            amount: amount,
            type: 'CREDIT',
            status: 'COMPLETED',
            description: 'Job Payment'
        }]);
      
      if (transError) {
          console.error("Transaction failed but job completed", transError);
      }
    },
    
    completeJob: async (jobId: string) => {
         const { error } = await supabase.from('jobs').update({ status: JobStatus.COMPLETED }).eq('id', jobId);
         if (error) throw error;
    },

    reportIssue: async (jobId: string, reason: string) => {
        const { error } = await supabase
          .from('jobs')
          .update({ status: JobStatus.DISPUTED })
          .eq('id', jobId);
        if (error) throw error;
    },

    resolveDispute: async (jobId: string, resolution: 'REFUND' | 'PAY') => {
        const status = resolution === 'PAY' ? JobStatus.COMPLETED : JobStatus.CANCELLED;
        const { error } = await supabase
          .from('jobs')
          .update({ status })
          .eq('id', jobId);
        if (error) throw error;
    }
  },

  payment: {
    createOrder: async (amount: number, jobId: string) => {
      // Call Supabase Edge Function 'razorpay'
      const { data, error } = await supabase.functions.invoke('razorpay', {
        body: { action: 'create_order', amount, jobId }
      });
      
      if (error) throw error;
      return data as RazorpayOrder;
    },
    verifyPayment: async (response: RazorpayResponse, jobId: string, workerId: string, amount: number) => {
       const { data, error } = await supabase.functions.invoke('razorpay', {
        body: { 
          action: 'verify_payment', 
          ...response,
          jobId,
          workerId,
          amount
        }
      });
      if (error) throw error;
      return data;
    }
  },

  messages: {
    list: async (jobId: string) => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('job_id', jobId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as Message[];
    },
    send: async (jobId: string, senderId: string, text: string) => {
      const { error } = await supabase
        .from('messages')
        .insert([{ job_id: jobId, sender_id: senderId, text }]);
      if (error) throw error;
    }
  },

  wallet: {
      getTransactions: async (workerId: string) => {
          const { data, error } = await supabase
              .from('transactions')
              .select('*')
              .eq('worker_id', workerId)
              .order('created_at', { ascending: false });
          if (error) throw error;
          return data as Transaction[];
      },
      // Admin: Get all withdrawals
      getAllWithdrawals: async () => {
         const { data, error } = await supabase
            .from('transactions')
            .select(`*, worker:worker_id(*)`)
            .eq('type', 'DEBIT')
            .order('created_at', { ascending: false });
         if (error) throw error;
         return data as (Transaction & { worker: Profile })[];
      },
      withdraw: async (workerId: string, amount: number) => {
          const { error } = await supabase
              .from('transactions')
              .insert([{
                  worker_id: workerId,
                  amount: amount,
                  type: 'DEBIT',
                  status: 'PENDING',
                  description: 'Withdrawal Request'
              }]);
          if (error) throw error;
      }
  },

  reviews: {
    create: async (jobId: string, reviewerId: string, revieweeId: string, rating: number, comment: string) => {
      const { error } = await supabase
        .from('reviews')
        .insert([{
          job_id: jobId,
          reviewer_id: reviewerId,
          reviewee_id: revieweeId,
          rating,
          comment
        }]);
      if (error) throw error;
    }
  },

  notifications: {
      list: async (userId: string) => {
          const { data, error } = await supabase
              .from('notifications')
              .select('*')
              .eq('user_id', userId)
              .order('created_at', { ascending: false });
          if (error) throw error;
          return data as NotificationItem[];
      },
      markRead: async (id: string) => {
          const { error } = await supabase
              .from('notifications')
              .update({ is_read: true })
              .eq('id', id);
          if (error) throw error;
      },
      create: async (userId: string, title: string, message: string, type: 'INFO' | 'SUCCESS' | 'WARNING' = 'INFO') => {
          await supabase.from('notifications').insert([{ user_id: userId, title, message, type }]);
      }
  }
};

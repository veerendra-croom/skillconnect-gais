
import { supabase } from './supabase';
import { Job, JobStatus, WorkerStatus, ServiceCategory, Profile, Transaction, Message, NotificationItem, SystemSettings } from '../types';

export const api = {
  categories: {
    list: async () => {
      const { data, error } = await supabase.from('service_categories').select('*').order('name');
      if (error) throw error;
      return data as ServiceCategory[];
    },
    search: async (query: string) => {
      const { data, error } = await supabase.rpc('search_categories', { keyword: query });
      if (error) {
        // Fallback for dev
        const { data: all } = await supabase.from('service_categories').select('*');
        return (all || []).filter(c => c.name.toLowerCase().includes(query.toLowerCase()));
      }
      return data as ServiceCategory[];
    },
    // Added create and delete methods for CMS
    create: async (name: string, base_price: number, icon: string) => {
      const { data, error } = await supabase.from('service_categories').insert([{ name, base_price, icon }]).select().single();
      if (error) throw error;
      return data as ServiceCategory;
    },
    delete: async (id: string) => {
      const { error } = await supabase.from('service_categories').delete().eq('id', id);
      if (error) throw error;
    }
  },

  profiles: {
    update: async (id: string, updates: Partial<Profile>) => {
      const { error } = await supabase.from('profiles').update(updates).eq('id', id);
      if (error) throw error;
    },
    updateWorkerStatus: async (id: string, status: WorkerStatus) => {
      const { error } = await supabase.from('profiles').update({ worker_status: status }).eq('id', id);
      if (error) throw error;
    },
    // Added for admin verification
    getPendingWorkers: async () => {
      const { data, error } = await supabase.from('profiles').select('*').eq('worker_status', WorkerStatus.PENDING_REVIEW);
      if (error) throw error;
      return data as Profile[];
    }
  },

  jobs: {
    create: async (job: Partial<Job>) => {
      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      const { data, error } = await supabase.from('jobs').insert([{ ...job, otp, status: JobStatus.SEARCHING }]).select().single();
      if (error) throw error;
      return data as Job;
    },
    getActiveForCustomer: async (customerId: string) => {
      const { data, error } = await supabase
        .from('jobs')
        .select('*, worker:worker_id(*), category:category_id(*)')
        .eq('customer_id', customerId)
        .not('status', 'in', `("${JobStatus.COMPLETED}","${JobStatus.CANCELLED}")`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as Job;
    },
    getActiveForWorker: async (workerId: string) => {
      const { data, error } = await supabase
        .from('jobs')
        .select('*, customer:customer_id(*), category:category_id(*)')
        .eq('worker_id', workerId)
        .not('status', 'in', `("${JobStatus.COMPLETED}","${JobStatus.CANCELLED}")`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as Job;
    },
    getAvailableForWorker: async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select('*, customer:customer_id(*), category:category_id(*)')
        .eq('status', JobStatus.SEARCHING)
        .is('worker_id', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Job[];
    },
    accept: async (jobId: string, workerId: string) => {
      const { data, error } = await supabase
        .from('jobs')
        .update({ worker_id: workerId, status: JobStatus.ACCEPTED })
        .eq('id', jobId)
        .eq('status', JobStatus.SEARCHING)
        .select()
        .single();
      if (error) throw error;
      return data as Job;
    },
    updateStatus: async (jobId: string, status: JobStatus, extra?: any) => {
      const { error } = await supabase.from('jobs').update({ status, ...extra }).eq('id', jobId);
      if (error) throw error;
    },
    verifyOtpAndStart: async (jobId: string, otp: string) => {
      const { data, error } = await supabase.from('jobs').select('otp').eq('id', jobId).single();
      if (error) throw error;
      if (data.otp !== otp) throw new Error('Incorrect OTP');
      await api.jobs.updateStatus(jobId, JobStatus.IN_PROGRESS);
    },
    // Added for admin live ops
    getAllActive: async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select('*, customer:customer_id(*), worker:worker_id(*), category:category_id(*)')
        .not('status', 'in', `("${JobStatus.COMPLETED}","${JobStatus.CANCELLED}")`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Job[];
    },
    resolveDispute: async (jobId: string, resolution: 'REFUND' | 'PAY') => {
      const status = resolution === 'REFUND' ? JobStatus.CANCELLED : JobStatus.COMPLETED;
      const { error } = await supabase.from('jobs').update({ status }).eq('id', jobId);
      if (error) throw error;
    }
  },

  wallet: {
    getTransactions: async (workerId: string) => {
      const { data, error } = await supabase.from('transactions').select('*').eq('worker_id', workerId).order('created_at', { ascending: false });
      if (error) throw error;
      return data as Transaction[];
    },
    // Added missing wallet methods
    withdraw: async (workerId: string, amount: number) => {
      const { error } = await supabase.from('transactions').insert([{
        worker_id: workerId,
        amount,
        type: 'DEBIT',
        status: 'PENDING',
        description: 'Withdrawal request'
      }]);
      if (error) throw error;
    },
    getAllWithdrawals: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*, worker:worker_id(*)')
        .eq('type', 'DEBIT')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as (Transaction & { worker: Profile })[];
    }
  },

  // Added missing admin namespace
  admin: {
    getAllUsers: async () => {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as Profile[];
    },
    getPlatformStats: async () => {
      const { data, error } = await supabase.from('transactions').select('amount, type').eq('status', 'COMPLETED');
      if (error) throw error;
      const totalGMV = data.filter(t => t.type === 'CREDIT').reduce((sum, t) => sum + t.amount, 0);
      const totalRevenue = totalGMV * 0.1; // Simple calculation if commission isn't tracked per row
      return { totalGMV, totalRevenue };
    },
    toggleUserSuspension: async (userId: string, suspend: boolean) => {
      const status = suspend ? WorkerStatus.SUSPENDED : WorkerStatus.UNVERIFIED;
      const { error } = await supabase.from('profiles').update({ worker_status: status }).eq('id', userId);
      if (error) throw error;
    }
  },

  // Added missing settings namespace
  settings: {
    get: async () => {
      const { data, error } = await supabase.from('system_settings').select('*').single();
      if (error && error.code !== 'PGRST116') throw error;
      return data as SystemSettings;
    },
    update: async (settings: SystemSettings) => {
      const { error } = await supabase.from('system_settings').upsert([settings]);
      if (error) throw error;
    }
  },

  // Added missing messages namespace
  messages: {
    list: async (jobId: string) => {
      const { data, error } = await supabase.from('messages').select('*').eq('job_id', jobId).order('created_at', { ascending: true });
      if (error) throw error;
      return data as Message[];
    },
    send: async (jobId: string, senderId: string, text: string) => {
      const { error } = await supabase.from('messages').insert([{ job_id: jobId, sender_id: senderId, text }]);
      if (error) throw error;
    }
  },

  // Added missing notifications namespace
  notifications: {
    list: async (userId: string) => {
      const { data, error } = await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      if (error) throw error;
      return data as NotificationItem[];
    },
    markRead: async (id: string) => {
      const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
      if (error) throw error;
    }
  }
};

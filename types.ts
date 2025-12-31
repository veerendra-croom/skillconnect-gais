
export enum UserRole {
  GUEST = 'GUEST',
  CUSTOMER = 'CUSTOMER',
  WORKER = 'WORKER',
  ADMIN = 'ADMIN'
}

export enum WorkerStatus {
  UNVERIFIED = 'UNVERIFIED',
  PENDING_REVIEW = 'PENDING_REVIEW',
  VERIFIED = 'VERIFIED',
  SUSPENDED = 'SUSPENDED',
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE'
}

export enum JobStatus {
  SEARCHING = 'SEARCHING',
  ACCEPTED = 'ACCEPTED',
  ARRIVED = 'ARRIVED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED_PENDING_PAYMENT = 'COMPLETED_PENDING_PAYMENT',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  DISPUTED = 'DISPUTED'
}

export interface Profile {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  avatar_url?: string;
  worker_status?: WorkerStatus;
  skills?: string[];
  verification_docs?: string[];
  rating?: number;
  review_count?: number;
  bio?: string;
  experience_years?: number;
  service_radius_km?: number;
  created_at?: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  base_price: number;
}

export interface Job {
  id: string;
  customer_id: string;
  worker_id?: string;
  category_id: string;
  description: string;
  images?: string[];
  location_address: string;
  location_lat?: number;
  location_lng?: number;
  status: JobStatus;
  scheduled_time?: string;
  amount?: number;
  otp?: string;
  created_at: string;
  updated_at: string;
  customer?: Profile;
  worker?: Profile;
  category?: ServiceCategory;
}

export interface Transaction {
  id: string;
  worker_id: string;
  job_id?: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  description: string;
  created_at: string;
}

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

/**
 * Added missing types for chat, notifications and admin settings
 */
export interface Message {
  id: string;
  job_id: string;
  sender_id: string;
  text: string;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface SystemSettings {
  id: string;
  maintenance_mode: boolean;
  allow_registration: boolean;
  commission_rate: number;
  updated_at: string;
}

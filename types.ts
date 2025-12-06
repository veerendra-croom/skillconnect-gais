
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

// Mirrors 'profiles' table
export interface Profile {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  avatar_url?: string;
  worker_status?: WorkerStatus;
  skills?: string[]; // Array of category IDs
  verification_docs?: string[]; // Array of storage paths
  rating?: number;
  review_count?: number;
  
  // New Fields
  bio?: string;
  experience_years?: number;
  service_radius_km?: number;
  
  created_at?: string;
}

// Mirrors 'service_categories' table
export interface ServiceCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  base_price: number;
}

// Mirrors 'jobs' table
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
  
  // Relations (Joined fields)
  customer?: Profile;
  worker?: Profile;
  category?: ServiceCategory;
}

// Mirrors 'messages' table
export interface Message {
  id: string;
  job_id: string;
  sender_id: string;
  text: string;
  created_at: string;
}

// Mirrors 'transactions' table
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

// Mirrors 'reviews' table
export interface Review {
  id: string;
  job_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment: string;
  created_at: string;
}

// Mirrors 'notifications' table
export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  is_read: boolean;
  link?: string;
  created_at: string;
}

// Mirrors 'system_settings' table
export interface SystemSettings {
  id: string;
  maintenance_mode: boolean;
  allow_registration: boolean;
  commission_rate: number;
  support_phone?: string;
  updated_at: string;
}

// Payment Interfaces
export interface RazorpayOrder {
  id: string;
  currency: string;
  amount: number;
}

export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}
# SkillConnect Database Setup

This document provides a robust, **idempotent** SQL script for setting up your SkillConnect database in Supabase. You can run this script multiple times without encountering errors like "relation already exists."

## Implementation Instructions

1.  Log in to your **Supabase Dashboard**.
2.  Navigate to the **SQL Editor** in the left sidebar.
3.  Click **New Query**.
4.  Paste the entire SQL block below into the editor.
5.  Click **Run**.

---

## Complete Idempotent SQL Script

```sql
-- ==========================================
-- 1. EXTENSIONS
-- ==========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 2. TABLES (Idempotent)
-- ==========================================

-- Profiles: Main user information table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  role TEXT DEFAULT 'CUSTOMER' CHECK (role IN ('GUEST', 'CUSTOMER', 'WORKER', 'ADMIN')),
  avatar_url TEXT,
  worker_status TEXT CHECK (worker_status IN ('UNVERIFIED', 'PENDING_REVIEW', 'VERIFIED', 'SUSPENDED', 'ONLINE', 'OFFLINE')),
  skills UUID[] DEFAULT '{}',
  verification_docs TEXT[] DEFAULT '{}',
  rating NUMERIC(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  bio TEXT,
  experience_years INTEGER DEFAULT 0,
  service_radius_km INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service Categories: Catalog of available service types
CREATE TABLE IF NOT EXISTS public.service_categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT DEFAULT 'wrench',
  description TEXT,
  base_price NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Jobs: Transactional records for service requests
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_id UUID REFERENCES public.profiles(id) NOT NULL,
  worker_id UUID REFERENCES public.profiles(id),
  category_id UUID REFERENCES public.service_categories(id) NOT NULL,
  description TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  location_address TEXT NOT NULL,
  location_lat NUMERIC,
  location_lng NUMERIC,
  status TEXT DEFAULT 'SEARCHING' CHECK (status IN ('SEARCHING', 'ACCEPTED', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED_PENDING_PAYMENT', 'COMPLETED', 'CANCELLED', 'DISPUTED')),
  scheduled_time TIMESTAMPTZ,
  amount NUMERIC,
  otp TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages: Chat history for jobs
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions: Financial ledger for workers
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  worker_id UUID REFERENCES public.profiles(id) NOT NULL,
  job_id UUID REFERENCES public.jobs(id),
  amount NUMERIC NOT NULL,
  type TEXT CHECK (type IN ('CREDIT', 'DEBIT')),
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews: Peer-to-peer feedback
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES public.profiles(id) NOT NULL,
  reviewee_id UUID REFERENCES public.profiles(id) NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications: User alerts
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'INFO' CHECK (type IN ('INFO', 'SUCCESS', 'WARNING', 'ERROR')),
  is_read BOOLEAN DEFAULT FALSE,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- System Settings: Global platform config
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  maintenance_mode BOOLEAN DEFAULT FALSE,
  allow_registration BOOLEAN DEFAULT TRUE,
  commission_rate NUMERIC DEFAULT 10,
  support_phone TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 3. FUNCTIONS & TRIGGERS (Re-runnable)
-- ==========================================

-- Function to handle profile creation on Auth Sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, phone, worker_status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'CUSTOMER'),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    CASE 
      WHEN (NEW.raw_user_meta_data->>'role') = 'WORKER' THEN 'UNVERIFIED'
      ELSE NULL
    END
  ) ON CONFLICT (id) DO UPDATE SET 
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    phone = EXCLUDED.phone;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Advanced Search Function
CREATE OR REPLACE FUNCTION public.search_categories(keyword TEXT)
RETURNS SETOF public.service_categories AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.service_categories
  WHERE 
    name ILIKE '%' || keyword || '%' OR 
    description ILIKE '%' || keyword || '%';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 4. SECURITY (RLS)
-- ==========================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Idempotent Policy Creation using a DO block
DO $$
BEGIN
    -- Profiles Policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public profiles viewable by everyone') THEN
        CREATE POLICY "Public profiles viewable by everyone" ON public.profiles FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own profile') THEN
        CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
    END IF;

    -- Categories Policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Categories viewable by everyone') THEN
        CREATE POLICY "Categories viewable by everyone" ON public.service_categories FOR SELECT USING (true);
    END IF;

    -- Jobs Policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users see own jobs') THEN
        CREATE POLICY "Users see own jobs" ON public.jobs FOR SELECT USING (auth.uid() = customer_id OR auth.uid() = worker_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Customers can create jobs') THEN
        CREATE POLICY "Customers can create jobs" ON public.jobs FOR INSERT WITH CHECK (auth.uid() = customer_id);
    END IF;

    -- Messages Policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Job participants see messages') THEN
        CREATE POLICY "Job participants see messages" ON public.messages FOR SELECT USING (
          EXISTS (SELECT 1 FROM public.jobs WHERE id = messages.job_id AND (customer_id = auth.uid() OR worker_id = auth.uid()))
        );
    END IF;

    -- Notifications Policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users see own notifications') THEN
        CREATE POLICY "Users see own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

-- ==========================================
-- 5. SEED DATA
-- ==========================================

-- Seed Categories (Only if empty)
INSERT INTO public.service_categories (name, icon, description, base_price)
SELECT 'Electrician', 'zap', 'Electrical repairs and wiring', 350
WHERE NOT EXISTS (SELECT 1 FROM public.service_categories WHERE name = 'Electrician');

INSERT INTO public.service_categories (name, icon, description, base_price)
SELECT 'Plumber', 'droplet', 'Pipe fixes and leakages', 300
WHERE NOT EXISTS (SELECT 1 FROM public.service_categories WHERE name = 'Plumber');

INSERT INTO public.service_categories (name, icon, description, base_price)
SELECT 'AC Repair', 'thermometer', 'AC servicing and gas filling', 500
WHERE NOT EXISTS (SELECT 1 FROM public.service_categories WHERE name = 'AC Repair');

INSERT INTO public.service_categories (name, icon, description, base_price)
SELECT 'Cleaning', 'home', 'Deep home cleaning services', 600
WHERE NOT EXISTS (SELECT 1 FROM public.service_categories WHERE name = 'Cleaning');

-- Default System Settings (Only if empty)
INSERT INTO public.system_settings (maintenance_mode, allow_registration, commission_rate)
SELECT false, true, 10
WHERE NOT EXISTS (SELECT 1 FROM public.system_settings);
```

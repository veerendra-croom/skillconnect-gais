
import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import CustomerDashboard from '../components/dashboards/CustomerDashboard';
import WorkerDashboard from '../components/dashboards/WorkerDashboard';
import Spinner from '../components/Spinner';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && user?.role === UserRole.ADMIN) {
        navigate('/admin', { replace: true });
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <div className="p-8 text-center">Please log in to view the dashboard.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 pb-24">
      {user.role === UserRole.CUSTOMER && <CustomerDashboard />}
      {user.role === UserRole.WORKER && <WorkerDashboard />}
    </div>
  );
};

export default Dashboard;

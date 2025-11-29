import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { MapPin, Clock, Star, MessageSquare, Plus } from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Skeleton from '../components/Skeleton';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  // Simulate loading delay for demonstration
  useEffect(() => {
    if (user) {
      const timer = setTimeout(() => setLoading(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  if (!user || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <Skeleton className="h-6 w-40 mb-4" />
            {[1, 2].map((i) => (
              <Card key={i}>
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-20 rounded-full" />
                    <Skeleton className="h-6 w-64" />
                  </div>
                  <Skeleton className="h-6 w-24" />
                </div>
                <div className="space-y-2 mb-4">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <div className="flex gap-3 pt-4 border-t border-gray-50">
                  <Skeleton className="h-9 w-24" />
                  <Skeleton className="h-9 w-24" />
                </div>
              </Card>
            ))}
          </div>
          <div className="space-y-6">
            <Card>
              <Skeleton className="h-6 w-32 mb-4" />
              <Skeleton className="h-8 w-24 mb-2" />
              <Skeleton className="h-4 w-32" />
            </Card>
            <Card>
              <Skeleton className="h-6 w-32 mb-4" />
              <Skeleton className="h-8 w-full mb-2" />
              <Skeleton className="h-2 w-full rounded-full" />
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {user.role === UserRole.WORKER ? 'Worker Dashboard' : 'My Requests'}
          </h1>
          <p className="text-gray-600">
            Welcome back, {user.name}!
          </p>
        </div>
        
        {user.role === UserRole.CUSTOMER && (
          <Button variant="primary">
            <Plus size={18} className="mr-2" />
            New Request
          </Button>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Main Feed / Job List */}
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
             {user.role === UserRole.WORKER ? 'Available Jobs Nearby' : 'Active Jobs'}
          </h2>

          {/* Job Card 1 */}
          <Card>
            <div className="flex justify-between items-start mb-4">
              <div>
                <Badge variant="info" className="mb-2">Plumbing</Badge>
                <h3 className="text-lg font-semibold text-gray-900">Leaking Kitchen Sink</h3>
              </div>
              <span className="text-emerald-600 font-bold">₹350 - ₹500</span>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center text-sm text-gray-500 mb-4 space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center"><MapPin size={16} className="mr-1"/> Indiranagar, Bangalore</div>
              <div className="flex items-center"><Clock size={16} className="mr-1"/> Posted 20m ago</div>
            </div>

            <div className="flex items-center space-x-3 mt-4 pt-4 border-t border-gray-50">
              <Button size="sm" variant={user.role === UserRole.WORKER ? 'primary' : 'outline'}>
                {user.role === UserRole.WORKER ? 'Accept Job' : 'View Details'}
              </Button>
              <Button size="sm" variant="ghost">
                <MessageSquare size={16} className="mr-2" /> Chat
              </Button>
            </div>
          </Card>

          {/* Job Card 2 */}
          <Card>
            <div className="flex justify-between items-start mb-4">
              <div>
                <Badge variant="warning" className="mb-2">Electrical</Badge>
                <h3 className="text-lg font-semibold text-gray-900">Fan Installation (2 units)</h3>
              </div>
              <span className="text-emerald-600 font-bold">₹400</span>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center text-sm text-gray-500 mb-4 space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center"><MapPin size={16} className="mr-1"/> Koramangala, Bangalore</div>
              <div className="flex items-center"><Clock size={16} className="mr-1"/> Posted 1h ago</div>
            </div>

            <div className="flex items-center space-x-3 mt-4 pt-4 border-t border-gray-50">
              <Button size="sm" variant={user.role === UserRole.WORKER ? 'primary' : 'outline'}>
                 {user.role === UserRole.WORKER ? 'Accept Job' : 'View Details'}
              </Button>
              <Button size="sm" variant="ghost">
                <MessageSquare size={16} className="mr-2" /> Chat
              </Button>
            </div>
          </Card>
        </div>

        {/* Sidebar / Stats */}
        <div className="space-y-6">
           {user.role === UserRole.WORKER ? (
             <>
                <Card>
                  <h3 className="font-semibold text-gray-900 mb-4">Earnings Overview</h3>
                  <div className="text-3xl font-bold text-gray-900 mb-1">₹4,250</div>
                  <p className="text-sm text-emerald-600 flex items-center">
                    <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded-full mr-2">+12%</span> 
                    from last week
                  </p>
                </Card>

                <Card>
                  <h3 className="font-semibold text-gray-900 mb-4">Your Reputation</h3>
                  <div className="flex items-center space-x-2 mb-2">
                    <Star className="text-yellow-400 fill-current" />
                    <span className="text-2xl font-bold">4.8</span>
                    <span className="text-gray-500 text-sm">(24 Reviews)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-yellow-400 h-2 rounded-full" style={{ width: '96%' }}></div>
                  </div>
                </Card>
             </>
           ) : (
             <>
                <Card>
                  <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="space-y-2">
                    <button className="w-full text-left px-4 py-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-sm font-medium text-gray-700 flex justify-between items-center group">
                      View Past Bookings
                      <span className="text-gray-400 group-hover:text-blue-500">→</span>
                    </button>
                    <button className="w-full text-left px-4 py-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-sm font-medium text-gray-700 flex justify-between items-center group">
                      Manage Addresses
                      <span className="text-gray-400 group-hover:text-blue-500">→</span>
                    </button>
                    <button className="w-full text-left px-4 py-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-sm font-medium text-gray-700 flex justify-between items-center group">
                      Payment Methods
                       <span className="text-gray-400 group-hover:text-blue-500">→</span>
                    </button>
                  </div>
                </Card>
             </>
           )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
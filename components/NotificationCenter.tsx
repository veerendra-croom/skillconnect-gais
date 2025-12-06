
import React, { useState, useEffect } from 'react';
import { Bell, X, Check, Trash2, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { NotificationItem } from '../types';
import { supabase } from '../services/supabase';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && isOpen) {
        loadNotifications();
    }
  }, [user, isOpen]);

  useEffect(() => {
    if (!user) return;
    // Realtime listener
    const channel = supabase
      .channel('public:notifications')
      .on('postgres_changes', { 
         event: 'INSERT', 
         schema: 'public', 
         table: 'notifications', 
         filter: `user_id=eq.${user.id}`
      }, (payload) => {
          setNotifications(prev => [payload.new as NotificationItem, ...prev]);
      })
      .subscribe();

    return () => {
        supabase.removeChannel(channel);
    }
  }, [user]);

  const loadNotifications = async () => {
      setLoading(true);
      try {
          if (!user) return;
          const data = await api.notifications.list(user.id);
          setNotifications(data || []);
      } catch (e) {
          console.error(e);
      } finally {
          setLoading(false);
      }
  };

  const handleMarkRead = async (id: string) => {
      try {
          await api.notifications.markRead(id);
          setNotifications(prev => prev.map(n => n.id === id ? {...n, is_read: true} : n));
      } catch (e) { console.error(e); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose}></div>
        
        {/* Panel */}
        <div className="relative w-full max-w-sm bg-white h-full shadow-2xl animate-slide-up flex flex-col">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
                <h3 className="font-bold text-gray-900 flex items-center">
                    <Bell size={18} className="mr-2 text-blue-600" /> Notifications
                </h3>
                <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                    <X size={20} className="text-gray-500" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loading ? (
                    <div className="text-center py-10 text-gray-400">Loading...</div>
                ) : notifications.length === 0 ? (
                    <div className="text-center py-12 flex flex-col items-center opacity-50">
                        <Bell size={48} className="text-gray-300 mb-3" />
                        <p className="text-gray-500 font-medium">No new notifications</p>
                    </div>
                ) : (
                    notifications.map(n => (
                        <div 
                           key={n.id} 
                           onClick={() => !n.is_read && handleMarkRead(n.id)}
                           className={`p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md ${
                               n.is_read ? 'bg-white border-gray-100 opacity-60' : 'bg-blue-50/50 border-blue-100'
                           }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-3">
                                    <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${n.is_read ? 'bg-transparent' : 'bg-blue-500'}`}></div>
                                    <div>
                                        <h4 className={`text-sm font-bold ${n.is_read ? 'text-gray-600' : 'text-gray-900'}`}>{n.title}</h4>
                                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">{n.message}</p>
                                        <p className="text-[10px] text-gray-400 mt-2">
                                            {new Date(n.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    </div>
  );
};

export default NotificationCenter;

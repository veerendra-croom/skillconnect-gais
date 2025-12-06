import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Message } from '../types';
import { supabase } from '../services/supabase';
import { Send, X, MessageSquare, Check, CheckCheck } from 'lucide-react';
import Button from './Button';

interface ChatWindowProps {
  jobId: string;
  recipientName: string;
  isOpen: boolean;
  onClose: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ jobId, recipientName, isOpen, onClose }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && jobId) {
      loadMessages();
      subscribeToMessages();
    }
  }, [isOpen, jobId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const data = await api.messages.list(jobId);
      setMessages(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    const subscription = supabase
      .channel(`chat-${jobId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `job_id=eq.${jobId}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message]);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || !user) return;

    try {
      const text = newMessage;
      setNewMessage(''); // Optimistic clear
      await api.messages.send(jobId, user.id, text);
    } catch (e) {
      console.error("Failed to send", e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-0 right-0 md:right-8 w-full md:w-[24rem] h-[32rem] bg-white md:rounded-t-2xl shadow-2xl border border-gray-200 z-50 flex flex-col animate-slide-up overflow-hidden">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-md border-b border-gray-100 p-4 flex justify-between items-center shrink-0 z-10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
             {recipientName?.[0]}
          </div>
          <div>
              <p className="font-bold text-gray-900 leading-none">{recipientName}</p>
              <p className="text-xs text-green-500 font-medium mt-1 flex items-center">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></span> Online
              </p>
          </div>
        </div>
        <button onClick={onClose} className="hover:bg-gray-100 p-2 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Messages Area with Pattern Background */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 relative">
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{backgroundImage: 'radial-gradient(#4b5563 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>
        
        {loading && messages.length === 0 ? (
          <div className="flex justify-center mt-10"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-400 mt-10 relative z-10">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">👋</span>
            </div>
            <p className="text-sm font-medium">Say hello to {recipientName}</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} relative z-10`}>
                <div 
                  className={`max-w-[75%] px-4 py-2.5 text-sm shadow-sm ${
                    isMe 
                      ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm' 
                      : 'bg-white text-gray-800 rounded-2xl rounded-tl-sm border border-gray-100'
                  }`}
                >
                  {msg.text}
                  <div className={`text-[10px] mt-1 text-right flex justify-end items-center opacity-70 ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    {isMe && <CheckCheck size={12} className="ml-1" />}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-white border-t border-gray-100 shrink-0 z-10">
        <form onSubmit={handleSend} className="flex items-center space-x-2">
          <input
            className="flex-1 pl-4 pr-4 py-3 bg-white border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-sm transition-all text-gray-900 placeholder-gray-400"
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <button 
            type="submit" 
            disabled={!newMessage.trim()}
            className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 shadow-md shadow-blue-500/30"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
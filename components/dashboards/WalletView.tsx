
import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../services/api';
import { Transaction } from '../../types';
import { useAuth } from '../../context/AuthContext';
import Card from '../Card';
import Button from '../Button';
import Spinner from '../Spinner';
import Badge from '../Badge';
import Modal from '../Modal';
import Input from '../Input';
import { Wallet, ArrowUpRight, ArrowDownLeft, DollarSign, TrendingUp, Clock, CreditCard, RefreshCw, ChevronUp, ChevronDown } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

const WalletView: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);

  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (user) {
        fetchTransactions();
    }
  }, [user]);

  const fetchTransactions = async () => {
    if (!user) return;
    try {
        const data = await api.wallet.getTransactions(user.id);
        setTransactions(data || []);
        
        const total = (data || []).reduce((acc, curr) => {
            if (curr.status === 'FAILED') return acc;
            return curr.type === 'CREDIT' ? acc + curr.amount : acc - curr.amount;
        }, 0);
        setBalance(total);
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  // Generate simple data for earnings trend (last 7 days)
  const dailyStats = useMemo(() => {
    const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
    }).reverse();

    const stats = last7Days.map(date => {
        const dailyTotal = transactions
            .filter(tx => tx.type === 'CREDIT' && tx.status === 'COMPLETED' && tx.created_at.startsWith(date))
            .reduce((sum, tx) => sum + tx.amount, 0);
        return { date, total: dailyTotal };
    });

    const maxTotal = Math.max(...stats.map(s => s.total), 1);
    return stats.map(s => ({ ...s, percent: (s.total / maxTotal) * 100 }));
  }, [transactions]);

  const handleWithdraw = async () => {
      const amount = parseFloat(withdrawAmount);
      if (!user || isNaN(amount) || amount <= 0) {
          addToast('Invalid amount', 'error');
          return;
      }
      if (amount > balance) {
          addToast('Insufficient funds', 'error');
          return;
      }

      setIsProcessing(true);
      try {
          await api.wallet.withdraw(user.id, amount);
          addToast('Withdrawal request submitted', 'success');
          setIsWithdrawModalOpen(false);
          setWithdrawAmount('');
          fetchTransactions();
      } catch (e: any) {
          addToast(e.message, 'error');
      } finally {
          setIsProcessing(false);
      }
  };

  if (loading) return <div className="flex justify-center p-12"><Spinner /></div>;

  return (
    <div className="space-y-8 animate-fade-in max-w-2xl mx-auto px-1">
       {/* Premium Balance Card */}
       <div className="relative overflow-hidden rounded-[2rem] shadow-2xl transition-transform hover:scale-[1.01] duration-500 group">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black"></div>
          
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl -mr-16 -mt-16 animate-pulse-soft"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -ml-16 -mb-16"></div>

          <div className="relative z-10 p-8 text-white h-full flex flex-col justify-between min-h-[220px]">
             <div className="flex justify-between items-start">
                 <div>
                     <p className="text-gray-400 text-sm font-medium tracking-widest uppercase mb-1">Total Balance</p>
                     <h2 className="text-5xl font-bold tracking-tight text-white drop-shadow-sm">
                        <span className="text-2xl align-top opacity-70">₹</span>{balance.toFixed(2)}
                     </h2>
                 </div>
                 <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10 shadow-lg">
                     <CreditCard size={24} className="text-blue-300" />
                 </div>
             </div>

             <div className="mt-8 flex items-end justify-between">
                 <div className="flex space-x-3">
                     <Button 
                        onClick={() => setIsWithdrawModalOpen(true)}
                        className="bg-white text-gray-900 hover:bg-gray-100 border-none shadow-lg px-6 font-bold"
                     >
                        <ArrowUpRight size={18} className="mr-2" /> Withdraw
                     </Button>
                 </div>
                 <div className="text-right">
                     <p className="text-xs text-gray-500 font-mono tracking-wider">WALLET ID</p>
                     <p className="text-sm text-gray-300 font-mono tracking-widest">•••• 8924</p>
                 </div>
             </div>
          </div>
       </div>

       {/* Earnings Trend Visualizer */}
       <Card glass className="p-6">
          <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-gray-900 flex items-center"><TrendingUp size={18} className="mr-2 text-emerald-500"/> Weekly Trend</h3>
              <Badge variant="success" className="bg-emerald-50 text-emerald-700">Earnings</Badge>
          </div>
          <div className="flex items-end justify-between h-32 gap-2">
              {dailyStats.map((stat, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center group relative">
                      {/* Bar */}
                      <div 
                        className="w-full bg-blue-100 rounded-t-lg transition-all duration-700 ease-out group-hover:bg-blue-500 relative"
                        style={{ height: `${stat.percent}%`, minHeight: '4px' }}
                      >
                         {/* Tooltip on hover */}
                         <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                            ₹{stat.total}
                         </div>
                      </div>
                      <span className="text-[10px] text-gray-400 mt-2 font-bold">{new Date(stat.date).toLocaleDateString([], { weekday: 'narrow' })}</span>
                  </div>
              ))}
          </div>
       </Card>

       {/* Transactions List */}
       <div>
          <div className="flex justify-between items-center mb-4 px-2">
              <h3 className="font-bold text-gray-900 text-lg">Recent Activity</h3>
              <button onClick={fetchTransactions} className="text-gray-400 hover:text-blue-600 transition-colors p-1 rounded-full hover:bg-blue-50">
                  <RefreshCw size={18} />
              </button>
          </div>
          
          <div className="space-y-3">
             {transactions.length === 0 ? (
                 <div className="text-center py-16 bg-white/50 rounded-3xl border border-dashed border-gray-200">
                    <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Clock className="text-gray-400" size={32} />
                    </div>
                    <p className="text-gray-500 font-medium">No transactions yet.</p>
                 </div>
             ) : (
                 transactions.map((tx, idx) => (
                     <div 
                        key={tx.id} 
                        className="animate-slide-up group" 
                        style={{animationDelay: `${idx * 50}ms`}}
                     >
                        <Card 
                            glass 
                            noPadding 
                            className="p-4 flex justify-between items-center hover:bg-white hover:shadow-md transition-all border-b border-gray-100/50 last:border-0"
                        >
                            <div className="flex items-center space-x-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-110 ${
                                    tx.type === 'CREDIT' 
                                    ? 'bg-gradient-to-br from-green-100 to-emerald-200 text-emerald-700' 
                                    : 'bg-gradient-to-br from-red-50 to-orange-100 text-red-600'
                                }`}>
                                    {tx.type === 'CREDIT' ? <ChevronDown size={24} /> : <ChevronUp size={24} />}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 text-sm truncate max-w-[150px]">{tx.description}</p>
                                    <p className="text-xs text-gray-400 font-medium mt-0.5">{new Date(tx.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className={`font-bold text-lg ${tx.type === 'CREDIT' ? 'text-emerald-600' : 'text-gray-900'}`}>
                                    {tx.type === 'CREDIT' ? '+' : '-'}₹{tx.amount}
                                </p>
                                <div className="flex justify-end mt-1">
                                    <Badge 
                                        variant={tx.status === 'COMPLETED' ? 'success' : tx.status === 'PENDING' ? 'warning' : 'error'} 
                                        className="text-[10px] px-1.5 py-0"
                                    >
                                        {tx.status}
                                    </Badge>
                                </div>
                            </div>
                        </Card>
                     </div>
                 ))
             )}
          </div>
       </div>

       <Modal 
          isOpen={isWithdrawModalOpen} 
          onClose={() => setIsWithdrawModalOpen(false)}
          title="Withdraw Funds"
       >
           <div className="space-y-6">
               <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-2xl border border-gray-200 text-center">
                   <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Available Balance</p>
                   <p className="text-4xl font-black text-gray-900">₹{balance.toFixed(2)}</p>
               </div>
               
               <Input 
                   label="Amount to Withdraw"
                   type="number"
                   placeholder="0.00"
                   icon={<DollarSign size={16} />}
                   value={withdrawAmount}
                   onChange={(e) => setWithdrawAmount(e.target.value)}
                   className="text-lg font-bold"
               />
               
               <div className="bg-blue-50 p-4 rounded-xl flex items-start space-x-3 text-sm text-blue-800 border border-blue-100">
                  <Clock size={18} className="mt-0.5 flex-shrink-0 text-blue-600" />
                  <p className="leading-relaxed">Funds will be transferred to your registered bank account within <span className="font-bold">24 hours</span>.</p>
               </div>

               <Button 
                   className="w-full h-12 shadow-xl text-lg" 
                   onClick={handleWithdraw}
                   isLoading={isProcessing}
               >
                   Confirm Withdrawal
               </Button>
           </div>
       </Modal>
    </div>
  );
};

export default WalletView;

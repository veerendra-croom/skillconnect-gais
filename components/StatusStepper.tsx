
import React from 'react';
import { JobStatus } from '../types';
import { Search, UserCheck, MapPin, Wrench, CreditCard, CheckCircle } from 'lucide-react';

interface StatusStepperProps {
  status: JobStatus;
}

const StatusStepper: React.FC<StatusStepperProps> = ({ status }) => {
  const steps = [
    { id: JobStatus.SEARCHING, label: 'Searching', icon: Search },
    { id: JobStatus.ACCEPTED, label: 'Assigned', icon: UserCheck },
    { id: JobStatus.ARRIVED, label: 'Arrived', icon: MapPin },
    { id: JobStatus.IN_PROGRESS, label: 'Working', icon: Wrench },
    { id: JobStatus.COMPLETED_PENDING_PAYMENT, label: 'Payment', icon: CreditCard },
  ];

  // Map status to a numeric index for progress calculation
  const getStepIndex = (s: JobStatus) => {
    switch (s) {
      case JobStatus.SEARCHING: return 0;
      case JobStatus.ACCEPTED: return 1;
      case JobStatus.ARRIVED: return 2;
      case JobStatus.IN_PROGRESS: return 3;
      case JobStatus.COMPLETED_PENDING_PAYMENT: return 4;
      case JobStatus.COMPLETED: return 5;
      default: return -1;
    }
  };

  const currentIndex = getStepIndex(status);

  if (currentIndex === -1) return null; // Cancelled or Disputed handled separately

  return (
    <div className="w-full py-6">
      <div className="relative flex items-center justify-between w-full">
        {/* Progress Bar Background */}
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 -z-10 rounded-full"></div>
        
        {/* Active Progress Bar */}
        <div 
          className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-blue-600 -z-10 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
        ></div>

        {steps.map((step, idx) => {
          const isActive = idx <= currentIndex;
          const isCurrent = idx === currentIndex;
          const Icon = step.icon;

          return (
            <div key={step.id} className="flex flex-col items-center group">
              <div 
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-300 z-10
                  ${isActive 
                    ? 'bg-blue-600 border-blue-100 text-white shadow-lg shadow-blue-500/30 scale-110' 
                    : 'bg-white border-gray-200 text-gray-400'
                  }
                  ${isCurrent ? 'animate-bounce-in ring-2 ring-blue-500 ring-offset-2' : ''}
                `}
              >
                {isActive && !isCurrent && idx < currentIndex ? (
                    <CheckCircle size={18} />
                ) : (
                    <Icon size={18} />
                )}
              </div>
              <span 
                className={`
                  absolute -bottom-6 text-[10px] font-bold uppercase tracking-wider transition-colors duration-300 w-20 text-center
                  ${isActive ? 'text-blue-700' : 'text-gray-400'}
                  ${isCurrent ? 'scale-110' : ''}
                `}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StatusStepper;

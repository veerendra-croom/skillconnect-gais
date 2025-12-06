import React from 'react';
import Card from '../Card';
import Skeleton from '../Skeleton';

const JobCardSkeleton: React.FC = () => {
  return (
    <Card glass className="relative overflow-hidden mb-4 border-l-4 border-l-gray-200">
      <div className="flex justify-between items-start">
        <div className="w-full">
           <div className="flex items-center space-x-2 mb-3">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-5 w-16" />
           </div>
           <Skeleton className="h-4 w-full max-w-md mb-2" />
           <Skeleton className="h-4 w-2/3 mb-4" />
           
           <div className="flex items-center space-x-4 mt-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-32" />
           </div>
        </div>
        <div className="hidden md:flex flex-col items-end space-y-3 pl-4">
            <Skeleton className="h-8 w-20 rounded-lg" />
            <Skeleton className="h-10 w-28 rounded-xl" />
        </div>
      </div>
    </Card>
  );
};

export default JobCardSkeleton;
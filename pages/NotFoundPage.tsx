
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import { Home, AlertTriangle } from 'lucide-react';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="bg-amber-50 p-6 rounded-full mb-6 animate-bounce">
        <AlertTriangle size={64} className="text-amber-500" />
      </div>
      <h1 className="text-6xl font-black text-gray-900 mb-2">404</h1>
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Page Not Found</h2>
      <p className="text-gray-500 max-w-md mb-8">
        Oops! The page you are looking for seems to have gone on a vacation or doesn't exist.
      </p>
      <div className="flex space-x-4">
          <Button onClick={() => navigate('/')} size="lg" className="shadow-xl">
              <Home size={18} className="mr-2" /> Go Home
          </Button>
          <Button variant="outline" onClick={() => navigate(-1)} size="lg">
              Go Back
          </Button>
      </div>
    </div>
  );
};

export default NotFoundPage;

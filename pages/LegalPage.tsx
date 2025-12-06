
import React, { useState } from 'react';
import Card from '../components/Card';
import { Shield, FileText, Lock } from 'lucide-react';

interface LegalPageProps {
  initialTab?: 'terms' | 'privacy';
}

const LegalPage: React.FC<LegalPageProps> = ({ initialTab = 'terms' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Legal Center</h1>
        <p className="text-gray-500">Transparency is key to our relationship with you.</p>
      </div>

      <div className="flex space-x-1 mb-8 bg-gray-100 p-1 rounded-xl w-full md:w-auto md:inline-flex">
        <button
          onClick={() => setActiveTab('terms')}
          className={`flex-1 md:flex-none px-6 py-3 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'terms' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Terms of Service
        </button>
        <button
          onClick={() => setActiveTab('privacy')}
          className={`flex-1 md:flex-none px-6 py-3 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'privacy' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Privacy Policy
        </button>
      </div>

      <Card className="p-8 md:p-12 leading-relaxed text-gray-700">
        {activeTab === 'terms' ? (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center space-x-3 mb-6">
              <FileText className="text-blue-500" size={32} />
              <h2 className="text-2xl font-bold text-gray-900">Terms of Service</h2>
            </div>
            <p className="text-sm text-gray-400 uppercase font-bold tracking-wider">Last Updated: March 2024</p>
            
            <h3 className="text-lg font-bold text-gray-900">1. Acceptance of Terms</h3>
            <p>
              By accessing and using SkillConnect, you accept and agree to be bound by the terms and provision of this agreement.
            </p>

            <h3 className="text-lg font-bold text-gray-900">2. Service Description</h3>
            <p>
              SkillConnect is a platform that connects users seeking services ("Customers") with independent professionals ("Workers"). We do not provide the services ourselves but act as a marketplace.
            </p>

            <h3 className="text-lg font-bold text-gray-900">3. User Conduct</h3>
            <p>
              You agree to use the platform only for lawful purposes. Harassment, fraud, or misuse of the rating system will result in immediate account suspension.
            </p>
            
            <h3 className="text-lg font-bold text-gray-900">4. Payments & Refunds</h3>
            <p>
              Payments are processed securely via third-party gateways. Refunds are subject to our Dispute Resolution Policy and are handled on a case-by-case basis.
            </p>
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center space-x-3 mb-6">
              <Lock className="text-emerald-500" size={32} />
              <h2 className="text-2xl font-bold text-gray-900">Privacy Policy</h2>
            </div>
             <p className="text-sm text-gray-400 uppercase font-bold tracking-wider">Last Updated: March 2024</p>

            <h3 className="text-lg font-bold text-gray-900">1. Information Collection</h3>
            <p>
              We collect information you provide directly to us, such as name, email address, phone number, and location data when you use our services.
            </p>

            <h3 className="text-lg font-bold text-gray-900">2. Use of Information</h3>
            <p>
              We use your information to facilitate service connections, process payments, and improve our platform. We do not sell your personal data to advertisers.
            </p>

            <h3 className="text-lg font-bold text-gray-900">3. Data Security</h3>
            <p>
              We implement appropriate technical and organizational measures to protect your personal data against unauthorized access or disclosure.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default LegalPage;

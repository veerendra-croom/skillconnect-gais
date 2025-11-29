import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Zap, Shield, Users, ArrowRight } from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const categories = [
    { name: 'Electrician', icon: '⚡', count: '120+ Pros' },
    { name: 'Plumber', icon: '🔧', count: '85+ Pros' },
    { name: 'Carpenter', icon: '🔨', count: '60+ Pros' },
    { name: 'Cleaning', icon: '🧹', count: '200+ Pros' },
    { name: 'Painter', icon: '🎨', count: '50+ Pros' },
    { name: 'Driver', icon: '🚗', count: '150+ Pros' },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-blue-600 to-blue-800 text-white pt-12 pb-24 md:pt-20 md:pb-32 px-4 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
             {/* Abstract Pattern background */}
             <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
        </div>

        <div className="container mx-auto max-w-6xl relative z-10 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
            Find Trusted Local <br className="hidden md:block"/> Professionals Instantly
          </h1>
          <p className="text-blue-100 text-lg md:text-xl mb-8 max-w-2xl mx-auto">
            Connect with skilled electricians, plumbers, and more in your neighborhood. Fast, reliable, and secure.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
            <Button 
              size="lg" 
              variant="secondary" 
              className="w-full sm:w-auto shadow-lg shadow-emerald-900/20"
              onClick={() => navigate('/login')}
            >
              Book a Service
            </Button>
            <Button 
              size="lg" 
              className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 w-full sm:w-auto"
              onClick={() => navigate('/login')}
            >
              Join as a Worker
            </Button>
          </div>

          {/* Quick Search Mockup */}
          <div className="mt-12 bg-white rounded-xl shadow-xl p-2 max-w-3xl mx-auto flex flex-col md:flex-row items-center gap-2">
             <div className="flex-1 w-full relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                    type="text" 
                    placeholder="What service do you need?" 
                    className="w-full pl-10 pr-4 py-3 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none text-gray-800"
                />
             </div>
             <div className="flex-1 w-full relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                    type="text" 
                    placeholder="Enter pincode or area" 
                    className="w-full pl-10 pr-4 py-3 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none text-gray-800"
                />
             </div>
             <Button className="w-full md:w-auto h-12 px-8">Search</Button>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-10">
            <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Popular Services</h2>
                <p className="text-gray-600">Get the best professionals for your needs</p>
            </div>
            <button className="text-blue-600 font-semibold hover:text-blue-700 hidden md:flex items-center">
                View All <ArrowRight size={16} className="ml-1"/>
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat, idx) => (
              <Card key={idx} hover className="text-center group">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{cat.icon}</div>
                <h3 className="font-semibold text-gray-900">{cat.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{cat.count}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features / Why Choose Us */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why SkillConnect?</h2>
            <p className="text-gray-600 text-lg">We bridge the gap between skilled workers and customers through technology.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-blue-50 border border-blue-100">
              <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                <Zap className="text-blue-600" size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Fast Connections</h3>
              <p className="text-gray-600">Post a job and get responses from nearby workers in minutes, not days.</p>
            </div>

            <div className="p-8 rounded-2xl bg-emerald-50 border border-emerald-100">
              <div className="bg-emerald-100 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                <Shield className="text-emerald-600" size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Verified Profiles</h3>
              <p className="text-gray-600">Workers are vetted with ratings and reviews from real community members.</p>
            </div>

            <div className="p-8 rounded-2xl bg-orange-50 border border-orange-100">
              <div className="bg-orange-100 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                <Users className="text-orange-600" size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Community First</h3>
              <p className="text-gray-600">Empowering local informal workers with digital tools and fair opportunities.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
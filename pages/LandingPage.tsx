
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Zap, Shield, Users, ArrowRight, Wrench, Hammer, Droplet, Palette, Car } from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';
import { api } from '../services/api';
import { ServiceCategory } from '../types';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const data = await api.categories.list();
        setCategories(data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchCats();
  }, []);

  const handleSearch = () => {
    if (searchQuery) {
        navigate(`/dashboard?q=${encodeURIComponent(searchQuery)}${locationQuery ? `&loc=${encodeURIComponent(locationQuery)}` : ''}`);
    } else {
        navigate('/login');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleSearch();
  };

  const getIcon = (iconName: string) => {
    switch (iconName?.toLowerCase()) {
      case 'zap': return <Zap className="text-yellow-500" size={32} />;
      case 'wrench': return <Wrench className="text-gray-600" size={32} />;
      case 'hammer': return <Hammer className="text-orange-600" size={32} />;
      case 'droplet': return <Droplet className="text-blue-400" size={32} />;
      case 'palette': return <Palette className="text-pink-500" size={32} />;
      case 'car': return <Car className="text-green-600" size={32} />;
      default: return <span className="text-3xl">🛠️</span>;
    }
  };

  return (
    <div className="flex flex-col overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center pt-20 pb-12 bg-gray-50">
        
        {/* Animated Blobs Background */}
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-float"></div>
            <div className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] bg-purple-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-float" style={{animationDelay: '2s'}}></div>
            <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-pink-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-float" style={{animationDelay: '4s'}}></div>
        </div>

        <div className="container mx-auto px-4 relative z-10 grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            
            {/* Text Content */}
            <div className="text-center md:text-left animate-slide-up order-1">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100/50 border border-blue-200 text-blue-700 text-sm font-semibold mb-6">
                    <span className="w-2 h-2 rounded-full bg-blue-600 mr-2 animate-pulse"></span>
                    #1 Platform for Local Services
                </div>
                {/* Use hero-title class for robust responsive sizing */}
                <h1 className="hero-title font-black text-gray-900 leading-tight mb-6 tracking-tight">
                    Expert help,<br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">right next door.</span>
                </h1>
                <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed max-w-lg mx-auto md:mx-0">
                    From leaky taps to wiring fixes, find trusted professionals in your neighborhood instantly. Verified, fast, and secure.
                </p>
                
                <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4">
                    <Button size="lg" className="w-full sm:w-auto text-lg shadow-blue-500/20" onClick={() => navigate('/login')}>
                        Get Started
                    </Button>
                    <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg" onClick={() => navigate('/login')}>
                        Register as Worker
                    </Button>
                </div>
            </div>

            {/* Visual / Search Card */}
            <div className="relative animate-slide-up order-2" style={{animationDelay: '0.2s'}}>
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-2xl rotate-3 opacity-10 blur-xl"></div>
                <Card glass className="relative p-6 md:p-10 border-white/50 shadow-2xl">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">Quick Book</h3>
                    
                    <div className="space-y-4">
                        <div className="group relative">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                            <input 
                                type="text" 
                                placeholder="Your Area / Pincode" 
                                value={locationQuery}
                                onChange={(e) => setLocationQuery(e.target.value)}
                                onKeyDown={handleKeyPress}
                                className="input-field w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>
                        <div className="group relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                            <input 
                                type="text" 
                                placeholder="Service (e.g. Electrician)" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={handleKeyPress}
                                className="input-field w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>
                        <Button size="lg" className="w-full h-14 text-lg mt-2" onClick={handleSearch}>
                            Find Professionals
                        </Button>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-100">
                        <p className="text-sm text-gray-500 mb-3 font-medium">Popular near you:</p>
                        <div className="flex flex-wrap gap-2">
                            {['AC Repair', 'Cleaning', 'Plumber'].map(tag => (
                                <span 
                                    key={tag} 
                                    onClick={() => navigate(`/dashboard?q=${encodeURIComponent(tag)}`)}
                                    className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600 hover:bg-blue-50 hover:text-blue-600 cursor-pointer transition-colors"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                </Card>
            </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-24 bg-white relative z-10">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-12">
            <div>
                <span className="text-blue-600 font-bold tracking-wider text-sm uppercase mb-2 block">Our Services</span>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Explore Categories</h2>
            </div>
            <button 
              className="text-gray-500 font-semibold hover:text-blue-600 hidden md:flex items-center transition-colors"
              onClick={() => navigate('/login')}
            >
                View All <ArrowRight size={18} className="ml-2"/>
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
            {loading ? (
              Array(6).fill(0).map((_, i) => (
                 <div key={i} className="h-40 bg-gray-100 rounded-2xl animate-pulse"></div>
              ))
            ) : (
              categories.map((cat, idx) => (
                <Card 
                  key={idx} 
                  hover 
                  onClick={() => navigate(`/dashboard?q=${encodeURIComponent(cat.name)}`)}
                  className="group flex flex-col items-center justify-center text-center p-4 md:p-6 border border-gray-100 bg-gray-50/30 hover:bg-white hover:border-blue-100 cursor-pointer"
                >
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 group-hover:shadow-md transition-all duration-300">
                    {getIcon(cat.icon)}
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm md:text-base">{cat.name}</h3>
                  <p className="text-xs font-medium text-blue-600 mt-2 bg-blue-50 px-2 py-1 rounded-md">
                     From ₹{cat.base_price}
                  </p>
                </Card>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Features with Glass Effect */}
      <section className="py-24 bg-gray-900 text-white relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl"></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Why Choose SkillConnect?</h2>
            <p className="text-gray-400 text-lg">We've built a platform that prioritizes speed, trust, and quality for every job.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-white/5 backdrop-blur-lg border border-white/10 hover:bg-white/10 transition-colors">
              <div className="bg-blue-500/20 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-blue-400">
                <Zap size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3">Lightning Fast</h3>
              <p className="text-gray-400 leading-relaxed">Our real-time algorithm matches you with the nearest available professional in under 60 seconds.</p>
            </div>

            <div className="p-8 rounded-3xl bg-white/5 backdrop-blur-lg border border-white/10 hover:bg-white/10 transition-colors">
              <div className="bg-emerald-500/20 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-emerald-400">
                <Shield size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3">Secure & Verified</h3>
              <p className="text-gray-400 leading-relaxed">Every worker undergoes a strict background check and ID verification before joining.</p>
            </div>

            <div className="p-8 rounded-3xl bg-white/5 backdrop-blur-lg border border-white/10 hover:bg-white/10 transition-colors">
              <div className="bg-orange-500/20 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-orange-400">
                <Users size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3">Community Driven</h3>
              <p className="text-gray-400 leading-relaxed">Fair wages for workers and transparent pricing for customers. A win-win ecosystem.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;

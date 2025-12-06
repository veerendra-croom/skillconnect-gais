
import React from 'react';
import { Users, Globe, Award, Heart } from 'lucide-react';
import Card from '../components/Card';

const AboutPage: React.FC = () => {
  return (
    <div className="pt-10 pb-20">
      {/* Hero Section */}
      <section className="relative bg-gray-900 text-white py-20 overflow-hidden mb-12">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/30 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-600/30 rounded-full blur-3xl -ml-20 -mb-20"></div>
        
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6">
            Empowering Local <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Economies</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            SkillConnect is on a mission to bridge the gap between skilled professionals and the communities that need them.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 -mt-32 relative z-20 mb-20">
          <Card glass className="text-center py-8 border-t-4 border-t-blue-500">
            <Users size={32} className="mx-auto text-blue-500 mb-3" />
            <h3 className="text-3xl font-bold text-gray-900">50k+</h3>
            <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">Users</p>
          </Card>
          <Card glass className="text-center py-8 border-t-4 border-t-emerald-500">
            <Award size={32} className="mx-auto text-emerald-500 mb-3" />
            <h3 className="text-3xl font-bold text-gray-900">12k+</h3>
            <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">Verified Pros</p>
          </Card>
          <Card glass className="text-center py-8 border-t-4 border-t-purple-500">
            <Globe size={32} className="mx-auto text-purple-500 mb-3" />
            <h3 className="text-3xl font-bold text-gray-900">25+</h3>
            <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">Cities</p>
          </Card>
          <Card glass className="text-center py-8 border-t-4 border-t-pink-500">
            <Heart size={32} className="mx-auto text-pink-500 mb-3" />
            <h3 className="text-3xl font-bold text-gray-900">4.8/5</h3>
            <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">Avg Rating</p>
          </Card>
        </div>

        {/* Story Section */}
        <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
          <div>
             <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
             <div className="space-y-4 text-gray-600 text-lg leading-relaxed">
               <p>
                 Founded in 2024, SkillConnect started with a simple observation: finding a reliable plumber or electrician was harder than it should be, while many skilled workers struggled to find consistent work.
               </p>
               <p>
                 We built a platform that removes the friction. By verifying every professional and providing a seamless booking experience, we bring trust back to local services.
               </p>
               <p>
                 Today, we are proud to support thousands of livelihoods while ensuring homes run smoothly across the country.
               </p>
             </div>
          </div>
          <div className="relative">
             <div className="absolute inset-0 bg-blue-600 rounded-3xl rotate-3 opacity-20"></div>
             <img 
               src="https://images.unsplash.com/photo-1581578731117-10d52143b0e8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
               alt="Team working" 
               className="relative rounded-3xl shadow-2xl"
             />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;

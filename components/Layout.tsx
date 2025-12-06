
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Menu, X, LogOut, Wrench, Briefcase, Info, Phone, Bell, Settings, User, Mail, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from './Button';
import NotificationCenter from './NotificationCenter';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  
  const { isAuthenticated, user, logout } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    addToast('Logged out successfully', 'info');
    navigate('/');
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(newsletterEmail) {
       addToast('Subscribed successfully!', 'success');
       setNewsletterEmail('');
    }
  };

  const NavLink = ({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) => (
    <button
      onClick={() => navigate(to)}
      className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors px-3 py-2 rounded-xl hover:bg-blue-50 font-medium w-full text-left"
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col mesh-gradient-light font-sans text-gray-800 selection:bg-blue-200 selection:text-blue-900 overflow-x-hidden">
      {/* Sticky Glass Header */}
      <header 
        className={`fixed top-0 z-40 w-full transition-all duration-300 border-b ${
          isScrolled 
            ? 'bg-white/70 backdrop-blur-xl border-white/50 shadow-sm py-2' 
            : 'bg-transparent border-transparent py-4'
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div 
              className="flex items-center space-x-2 cursor-pointer group" 
              onClick={() => navigate('/')}
            >
              <div className="bg-gradient-to-tr from-blue-600 to-blue-400 text-white p-2.5 rounded-xl shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
                <Wrench size={20} className="fill-current" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700 tracking-tight whitespace-nowrap">SkillConnect</span>
            </div>

            {/* Desktop Navigation - Added 'desktop-nav' class for critical CSS */}
            <nav className="hidden md:flex items-center space-x-1 desktop-nav">
              {!isAuthenticated && (
                <div className="flex bg-white/50 p-1 rounded-full mr-4 backdrop-blur-sm border border-white/50 transition-all hover:bg-white/80">
                  <button onClick={() => navigate('/')} className="px-4 py-1.5 rounded-full text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-white shadow-sm transition-all">Home</button>
                  <button onClick={() => navigate('/about')} className="px-4 py-1.5 rounded-full text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-white shadow-sm transition-all">About</button>
                  <button onClick={() => navigate('/contact')} className="px-4 py-1.5 rounded-full text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-white shadow-sm transition-all">Contact</button>
                </div>
              )}
              
              {isAuthenticated && (
                 <div className="flex items-center mr-2 px-4 py-1.5 bg-white/60 rounded-full border border-white/50 backdrop-blur-sm shadow-sm space-x-3">
                    <span className="text-sm text-gray-600">Hello, <span className="font-bold text-blue-700">{user?.name}</span></span>
                    <button 
                       onClick={() => setIsNotifOpen(true)}
                       className="p-1.5 hover:bg-gray-100 rounded-full text-gray-600 relative transition-colors"
                    >
                        <Bell size={18} />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
                    </button>
                    <button 
                       onClick={() => navigate('/settings')}
                       className="p-1.5 hover:bg-gray-100 rounded-full text-gray-600 transition-colors"
                    >
                        <Settings size={18} />
                    </button>
                 </div>
              )}

              <div className="flex items-center space-x-3 ml-2">
                {isAuthenticated ? (
                  <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-500 hover:bg-red-50 hover:text-red-600">
                    <LogOut size={16} className="mr-2" />
                    Logout
                  </Button>
                ) : (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>Log In</Button>
                    <Button variant="primary" size="sm" onClick={() => navigate('/login')}>Get Started</Button>
                  </>
                )}
              </div>
            </nav>

            {/* Mobile Menu Button - Added 'mobile-nav' class for critical CSS */}
            <div className="flex md:hidden items-center space-x-3 mobile-nav">
               {isAuthenticated && (
                   <button onClick={() => setIsNotifOpen(true)} className="icon-btn p-2 text-gray-600 relative">
                       <Bell size={24} />
                       <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border border-white"></span>
                   </button>
               )}
                <button 
                className="icon-btn p-2.5 text-gray-600 hover:bg-white/50 rounded-xl transition-colors active:scale-95"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-white/95 backdrop-blur-xl border-b border-gray-100 py-6 px-4 flex flex-col space-y-4 animate-slide-up shadow-2xl rounded-b-3xl mobile-nav">
             {!isAuthenticated && (
               <div className="space-y-1">
                <NavLink to="/" icon={<Briefcase size={18} />} label="Home" />
                <NavLink to="/about" icon={<Info size={18} />} label="About" />
                <NavLink to="/contact" icon={<Phone size={18} />} label="Contact" />
               </div>
             )}
             
             {isAuthenticated && (
               <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
                 <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-blue-600 shadow-sm font-bold text-lg">
                    {user?.name?.[0]}
                 </div>
                 <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Signed in as</p>
                    <p className="font-bold text-gray-900">{user?.name}</p>
                 </div>
               </div>
             )}

             {isAuthenticated && (
               <div className="space-y-1">
                   <NavLink to="/dashboard" icon={<Briefcase size={18} />} label="Dashboard" />
                   <NavLink to="/settings" icon={<Settings size={18} />} label="Settings" />
               </div>
             )}

            <div className="pt-2 flex flex-col space-y-3">
              {isAuthenticated ? (
                <Button variant="outline" className="w-full justify-start border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300" onClick={handleLogout}>
                  <LogOut size={18} className="mr-2" /> Sign Out
                </Button>
              ) : (
                <>
                  <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/login')}>Log In</Button>
                  <Button variant="primary" className="w-full shadow-xl shadow-blue-500/20" onClick={() => navigate('/login')}>Sign Up Now</Button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content with Spacer for Fixed Header */}
      <main className="flex-grow pt-24 min-h-screen">
        {children}
      </main>

      {/* Notification Center Overlay */}
      <NotificationCenter isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />

      {/* Modern Productive Footer */}
      <footer className="bg-gray-900 text-gray-300 pt-16 pb-8 border-t border-gray-800 relative overflow-hidden">
        {/* Accent Bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600"></div>
        
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-5 gap-12 mb-12">
          {/* Brand Column */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-6">
              <div className="bg-blue-600 text-white p-1.5 rounded-lg">
                <Wrench size={24} />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">SkillConnect</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-6 max-w-sm">
              We are reimagining how local communities connect. Professional services, delivered with trust, speed, and transparency.
            </p>
            
            {/* Newsletter Signup */}
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10 max-w-sm">
              <p className="text-xs font-bold text-gray-300 uppercase tracking-wide mb-3">Subscribe to our newsletter</p>
              <form onSubmit={handleNewsletterSubmit} className="flex">
                 <input 
                   type="email" 
                   placeholder="Enter your email" 
                   className="flex-1 bg-white/10 border-none rounded-l-lg text-sm text-white placeholder-gray-500 focus:ring-0 px-3 py-2"
                   value={newsletterEmail}
                   onChange={(e) => setNewsletterEmail(e.target.value)}
                 />
                 <button className="bg-blue-600 text-white px-4 py-2 rounded-r-lg hover:bg-blue-700 transition-colors">
                    <Send size={16} />
                 </button>
              </form>
            </div>
          </div>
          
          {/* Link Columns */}
          <div>
            <h3 className="text-white font-bold mb-6 tracking-wide text-sm uppercase">Company</h3>
            <ul className="space-y-3 text-sm">
              <li><Link to="/about" className="hover:text-blue-400 transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-blue-400 transition-colors">Contact</Link></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Blog</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold mb-6 tracking-wide text-sm uppercase">Support</h3>
            <ul className="space-y-3 text-sm">
              <li><Link to="/help" className="hover:text-blue-400 transition-colors">Help Center</Link></li>
              <li><Link to="/safety" className="hover:text-blue-400 transition-colors">Trust & Safety</Link></li>
              <li><Link to="/terms" className="hover:text-blue-400 transition-colors">Worker Guidelines</Link></li>
              <li><Link to="/privacy" className="hover:text-blue-400 transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold mb-6 tracking-wide text-sm uppercase">Download App</h3>
            <p className="text-xs text-gray-500 mb-4">Get the best experience on mobile.</p>
            <div className="space-y-3">
               <button className="w-full bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl p-2 flex items-center transition-all">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center mr-3">
                     <span className="text-black font-bold text-xl"></span>
                  </div>
                  <div className="text-left">
                     <div className="text-[10px] text-gray-400 uppercase">Download on the</div>
                     <div className="text-sm font-bold text-white">App Store</div>
                  </div>
               </button>
               <button className="w-full bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl p-2 flex items-center transition-all">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center mr-3">
                     <span className="text-black font-bold text-lg">▶</span>
                  </div>
                  <div className="text-left">
                     <div className="text-[10px] text-gray-400 uppercase">Get it on</div>
                     <div className="text-sm font-bold text-white">Google Play</div>
                  </div>
               </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="container mx-auto px-4 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500">
          <p>© {new Date().getFullYear()} SkillConnect Inc. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
             <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
             <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
             <a href="#" className="hover:text-white transition-colors">Sitemap</a>
             <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-green-500">Systems Operational</span>
             </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;

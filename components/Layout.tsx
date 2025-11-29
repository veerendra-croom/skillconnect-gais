import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, User as UserIcon, LogOut, Wrench, Briefcase, Info, Phone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from './Button';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
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
    navigate('/');
  };

  const NavLink = ({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) => (
    <button
      onClick={() => navigate(to)}
      className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors px-3 py-2 rounded-md font-medium"
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Sticky Header */}
      <header 
        className={`sticky top-0 z-40 w-full transition-all duration-300 ${
          isScrolled ? 'bg-white/90 backdrop-blur-md shadow-md py-2' : 'bg-white py-4'
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div 
              className="flex items-center space-x-2 cursor-pointer" 
              onClick={() => navigate('/')}
            >
              <div className="bg-blue-600 text-white p-2 rounded-lg">
                <Wrench size={24} />
              </div>
              <span className="text-xl font-bold text-gray-900 tracking-tight">SkillConnect</span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              {!isAuthenticated && (
                <>
                  <button onClick={() => navigate('/')} className="text-gray-600 hover:text-blue-600 font-medium">Home</button>
                  <button className="text-gray-600 hover:text-blue-600 font-medium">How It Works</button>
                  <button className="text-gray-600 hover:text-blue-600 font-medium">About</button>
                </>
              )}
              
              {isAuthenticated && (
                 <span className="text-gray-600">Welcome, <span className="font-semibold text-blue-600">{user?.name}</span></span>
              )}

              <div className="flex items-center space-x-3 ml-4">
                {isAuthenticated ? (
                  <Button variant="outline" size="sm" onClick={handleLogout}>
                    <LogOut size={16} className="mr-2" />
                    Logout
                  </Button>
                ) : (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>Log In</Button>
                    <Button variant="primary" size="sm" onClick={() => navigate('/login')}>Sign Up</Button>
                  </>
                )}
              </div>
            </nav>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-white shadow-lg border-t border-gray-100 py-4 px-4 flex flex-col space-y-3">
             {!isAuthenticated && (
               <>
                <NavLink to="/" icon={<Briefcase size={18} />} label="Home" />
                <NavLink to="#" icon={<Info size={18} />} label="How It Works" />
                <NavLink to="#" icon={<Phone size={18} />} label="Contact" />
               </>
             )}
             
             {isAuthenticated && (
               <div className="flex items-center space-x-3 px-3 py-2 bg-blue-50 rounded-lg">
                 <div className="h-8 w-8 rounded-full bg-blue-200 flex items-center justify-center text-blue-700">
                    <UserIcon size={16} />
                 </div>
                 <span className="font-medium text-gray-900">{user?.name}</span>
               </div>
             )}

            <div className="pt-2 border-t border-gray-100 flex flex-col space-y-2">
              {isAuthenticated ? (
                <Button variant="outline" className="w-full justify-start" onClick={handleLogout}>
                  <LogOut size={18} className="mr-2" /> Logout
                </Button>
              ) : (
                <>
                  <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/login')}>Log In</Button>
                  <Button variant="primary" className="w-full" onClick={() => navigate('/login')}>Sign Up</Button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <Wrench size={24} className="text-blue-500" />
              <span className="text-xl font-bold text-white">SkillConnect</span>
            </div>
            <p className="text-sm text-gray-400">
              Connecting skilled workers with local opportunities. Simple, reliable, and fast.
            </p>
          </div>
          
          <div>
            <h3 className="text-white font-semibold mb-4">Platform</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-blue-400">Browse Jobs</a></li>
              <li><a href="#" className="hover:text-blue-400">Find Workers</a></li>
              <li><a href="#" className="hover:text-blue-400">Pricing</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-blue-400">Help Center</a></li>
              <li><a href="#" className="hover:text-blue-400">Safety Guidelines</a></li>
              <li><a href="#" className="hover:text-blue-400">Terms of Service</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Contact</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center"><Phone size={14} className="mr-2"/> +91 98765 43210</li>
              <li>support@skillconnect.com</li>
            </ul>
          </div>
        </div>
        <div className="container mx-auto px-4 mt-8 pt-8 border-t border-gray-800 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} SkillConnect. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Layout;
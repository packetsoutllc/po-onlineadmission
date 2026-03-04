import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { GraduationCap, LayoutDashboard, Search, Home } from 'lucide-react';

const Navbar: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path ? 'text-primary-600 bg-primary-50' : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50';

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center gap-2">
              <div className="bg-primary-600 p-1.5 rounded-lg">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight text-gray-900">EduGate</span>
            </Link>
            <div className="hidden md:ml-8 md:flex md:space-x-4">
              <Link to="/" className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${isActive('/')}`}>
                <Home className="w-4 h-4" />
                Home
              </Link>
              <Link to="/browse" className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${isActive('/browse')}`}>
                <Search className="w-4 h-4" />
                Browse Schools
              </Link>
              <Link to="/dashboard" className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${isActive('/dashboard')}`}>
                <LayoutDashboard className="w-4 h-4" />
                My Dashboard
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            <button className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors shadow-sm hover:shadow">
              Sign In
            </button>
          </div>
        </div>
      </div>
      {/* Mobile menu */}
      <div className="md:hidden flex justify-around border-t border-gray-100 py-2">
        <Link to="/" className="p-2 text-gray-500 hover:text-primary-600"><Home/></Link>
        <Link to="/browse" className="p-2 text-gray-500 hover:text-primary-600"><Search/></Link>
        <Link to="/dashboard" className="p-2 text-gray-500 hover:text-primary-600"><LayoutDashboard/></Link>
      </div>
    </nav>
  );
};

export default Navbar;
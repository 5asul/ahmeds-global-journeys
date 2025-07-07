
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { getOrCreateSession, clearCookieSession } from '@/utils/cookieSession';
import { clearAllChatHistory } from '@/utils/localChatStorage';
import Logo from './Logo';
import { toast as sonnerToast } from "sonner";

const Navbar = () => {
  const navigate = useNavigate();
  const session = getOrCreateSession();

  const handleClearSession = () => {
    clearCookieSession();
    clearAllChatHistory();
    sonnerToast.success("Session cleared! Starting fresh.");
    // Refresh the page to get a new session
    window.location.reload();
  };

  return (
    <nav className="bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Logo />
          
          <div className="flex items-center space-x-2 sm:space-x-4">
            <span className="text-xs sm:text-sm text-gray-600 hidden sm:inline">
              Session: {session.id.slice(0, 8)}...
            </span>
            <span className="text-xs text-gray-600 sm:hidden">
              {session.id.slice(0, 6)}...
            </span>
            <Button 
              variant="outline" 
              onClick={handleClearSession}
              className="text-gray-700 border-gray-300 hover:bg-gray-50 text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
            >
              <span className="hidden sm:inline">Clear Session</span>
              <span className="sm:hidden">Clear</span>
            </Button>
            <Button 
              onClick={() => navigate('/auth')}
              className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
            >
              <span className="hidden sm:inline">Sign Up (Optional)</span>
              <span className="sm:hidden">Sign Up</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

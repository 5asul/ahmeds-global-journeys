
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import Logo from './Logo';
import ChatHistoryButton from './ChatHistoryButton';

const Navbar = () => {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Logo />
          
          <div className="flex items-center space-x-4">
            {session ? (
              <>
                <ChatHistoryButton />
                <Button 
                  variant="outline" 
                  onClick={signOut}
                  className="text-gray-700 border-gray-300 hover:bg-gray-50"
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <Button 
                onClick={() => navigate('/auth')}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

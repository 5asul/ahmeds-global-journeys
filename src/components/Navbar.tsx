
import { Link, useNavigate } from 'react-router-dom';
import Logo from './Logo';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User as UserIcon, LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; // Assuming you have DropdownMenu

const Navbar = () => {
  const { user, profile, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const getAvatarPublicUrl = (avatarPath: string | null | undefined) => {
    if (!avatarPath) return null;
    // Ensure this is the actual path in storage, not already a full URL
    // If avatar_url in profiles stores the full public URL, this step is not needed.
    // If it stores just the path, then construct the public URL.
    // Based on current setup, avatar_url in profiles will store the path.
    const { data } = supabase.storage.from('avatars').getPublicUrl(avatarPath);
    return data?.publicUrl || null;
  }
  
  const avatarDisplayUrl = profile?.avatar_url ? getAvatarPublicUrl(profile.avatar_url) : null;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Logo />
          <div className="flex items-center space-x-3">
            {authLoading ? (
              <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={avatarDisplayUrl || undefined} alt={user.email || 'User avatar'} />
                      <AvatarFallback>
                        <UserIcon className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.email}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        Authenticated
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {/* <DropdownMenuItem onClick={() => navigate('/profile')}>Profile</DropdownMenuItem> */}
                  <DropdownMenuItem onClick={signOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button
                  variant="outline"
                  className="font-poppins font-semibold border-primary text-primary hover:bg-primary/10 hover:text-primary transition-colors"
                  onClick={() => navigate('/auth?mode=signin')}
                >
                  Sign In
                </Button>
                <Button
                  className="font-poppins font-semibold btn-primary-custom hover:shadow-lg transition-shadow"
                  onClick={() => navigate('/auth?mode=signup')}
                >
                  Sign Up
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

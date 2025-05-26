
import Logo from './Logo';
import { Button } from '@/components/ui/button'; // Using shadcn button

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Logo />
          <div className="flex items-center space-x-3">
            <Button variant="outline" className="font-poppins font-semibold border-primary text-primary hover:bg-primary/10 hover:text-primary transition-colors">
              Sign In
            </Button>
            <Button className="font-poppins font-semibold btn-primary-custom hover:shadow-lg transition-shadow">
              Sign Up
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

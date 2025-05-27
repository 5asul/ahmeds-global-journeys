
import { Compass } from 'lucide-react';

const Logo = () => {
  return (
    <a href="/" className="flex items-center space-x-2 group">
      <Compass className="h-8 w-8 text-primary group-hover:animate-spin transition-transform duration-500" />
      <span className="font-pacifico text-2xl text-slate-800 group-hover:text-primary transition-colors">
        Ahmed Discovers the World
      </span>
    </a>
  );
};

export default Logo;

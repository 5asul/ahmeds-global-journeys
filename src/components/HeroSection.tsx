
import { ArrowRight } from 'lucide-react'; // This import is no longer used directly, but Button might use it if it were still here. Consider removing if not used by other elements in a larger refactor.

const HeroSection = () => {
  const heroImageUrl = "https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=1920&fit=max";

  return (
    <div 
      className="relative min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat pt-20" // pt-20 for navbar height
      style={{ backgroundImage: `url(${heroImageUrl})` }}
    >
      <div className="absolute inset-0 bg-black/50"></div> {/* Overlay for text readability */}
      <div className="relative z-10 text-center p-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <h1 className="text-5xl md:text-7xl font-bold text-white font-poppins mb-6 leading-tight shadow-text">
          Explore the World with Ahmed
        </h1>
        <p className="text-xl md:text-2xl text-gray-200 font-sans mb-10 max-w-3xl mx-auto shadow-text-sm">
          Your personal travel guide to hidden wonders and iconic destinations.
        </p>
        {/* "Start Exploring" Button removed as per user request */}
      </div>
    </div>
  );
};

export default HeroSection;

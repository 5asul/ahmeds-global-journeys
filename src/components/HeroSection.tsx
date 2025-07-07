
import { ArrowRight } from 'lucide-react';

const HeroSection = () => {
  const heroImageUrl = "https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=1920&fit=max";

  return (
    <div 
      className="relative min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat pt-16 sm:pt-20" 
      style={{ backgroundImage: `url(${heroImageUrl})` }}
    >
      <div className="absolute inset-0 bg-black/50"></div>
      <div className="relative z-10 text-center p-4 sm:p-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold text-white font-poppins mb-4 sm:mb-6 leading-tight shadow-text px-2">
          Explore the World with Ahmed
        </h1>
        <p className="text-lg sm:text-xl md:text-2xl text-gray-200 font-sans mb-8 sm:mb-10 max-w-3xl mx-auto shadow-text-sm px-4">
          Your personal travel guide to hidden wonders and iconic destinations.
        </p>
      </div>
    </div>
  );
};

export default HeroSection;

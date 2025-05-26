
import { Button } from '@/components/ui/button'; // Using shadcn button
import { ArrowRight } from 'lucide-react';

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
        <Button size="lg" className="font-poppins font-semibold text-lg px-10 py-6 btn-accent-custom hover:shadow-xl transform hover:scale-105 transition-all duration-300 group">
          Start Exploring
          <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
        </Button>
      </div>
      <style jsx global>{`
        .shadow-text {
          text-shadow: 2px 2px 4px rgba(0,0,0,0.7);
        }
        .shadow-text-sm {
          text-shadow: 1px 1px 3px rgba(0,0,0,0.7);
        }
      `}</style>
    </div>
  );
};

export default HeroSection;

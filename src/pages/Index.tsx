
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import TripPlannerForm from '@/components/TripPlannerForm';

const Index = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Navbar />
      <main className="flex-grow">
        <HeroSection />
        
        <div className="py-8 sm:py-12 md:py-20 bg-gradient-to-b from-slate-50 to-sky-100">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold font-poppins text-slate-800 mb-4 sm:mb-6 px-2">
              Turn Your Road Trip into an <span className="text-primary">Adventure</span>
            </h2>
            <p className="text-base sm:text-lg text-slate-600 mb-6 sm:mb-10 max-w-3xl mx-auto px-4">
              Find all the best stops at your destination and along the way. Let's plan your next journey!
            </p>
            <TripPlannerForm />
          </div>
        </div>

        <div className="py-8 sm:py-12 bg-white">
          <div className="container mx-auto px-4 text-center">
            <h3 className="text-xl sm:text-2xl font-bold font-poppins text-slate-700 mb-3 sm:mb-4">
              Popular Destinations
            </h3>
            <p className="text-sm sm:text-md text-slate-500 mb-6 sm:mb-8 px-2">
              Get inspired by these amazing places. More coming soon!
            </p>
          </div>
        </div>

      </main>
      <footer className="bg-slate-800 text-white py-6 sm:py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="font-sans text-sm sm:text-base">&copy; {new Date().getFullYear()} Ahmed Discovers the World. All rights reserved.</p>
          <p className="text-xs sm:text-sm text-slate-400 mt-2 font-sans">
            Created By Ahmed Mubarak
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;

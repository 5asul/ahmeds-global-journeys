
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import TripPlannerForm from '@/components/TripPlannerForm'; // Import the new component

const Index = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100"> {/* Changed bg-gray-50 to bg-gray-100 for a slightly different off-white background */}
      <Navbar />
      <main className="flex-grow">
        <HeroSection />
        
        <div className="py-12 md:py-20 bg-gradient-to-b from-slate-50 to-sky-100"> {/* Updated background for this section */}
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl md:text-5xl font-bold font-poppins text-slate-800 mb-6">
              Turn Your Road Trip into an <span className="text-primary">Adventure</span>
            </h2>
            <p className="text-lg text-slate-600 mb-10 max-w-3xl mx-auto">
              Find all the best stops at your destination and along the way. Let's plan your next journey!
            </p>
            <TripPlannerForm />
          </div>
        </div>

        {/* You can add more sections here, like "Explore Destinations" or featured trips later */}
        <div className="py-12 bg-white">
          <div className="container mx-auto px-4 text-center">
            <h3 className="text-2xl font-bold font-poppins text-slate-700 mb-4">
              Popular Destinations
            </h3>
            <p className="text-md text-slate-500 mb-8">
              Get inspired by these amazing places. More coming soon!
            </p>
            {/* Placeholder for destination cards */}
          </div>
        </div>

      </main>
      <footer className="bg-slate-800 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="font-sans">&copy; {new Date().getFullYear()} Ahmed Discovers the World. All rights reserved.</p>
          <p className="text-sm text-slate-400 mt-2 font-sans">
            Crafted with ❤️ by Lovable AI
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;

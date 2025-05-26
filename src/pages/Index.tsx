
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';

const Index = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <main className="flex-grow">
        <HeroSection />
        {/* Placeholder for future content sections */}
        <div className="py-12 bg-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold font-poppins text-slate-800 mb-4">
              Discover Amazing Places
            </h2>
            <p className="text-lg text-slate-600 mb-8">
              More content coming soon to help you plan your next adventure!
            </p>
            {/* Example of future content cards could go here */}
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

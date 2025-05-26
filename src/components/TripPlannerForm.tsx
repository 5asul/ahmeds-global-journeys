import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { MapPin } from 'lucide-react';
import { toast as sonnerToast } from "sonner";

const TripPlannerForm = () => {
  const [startingPoint, setStartingPoint] = useState('');
  const [destination, setDestination] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startingPoint.trim() || !destination.trim()) {
      sonnerToast.error("Missing fields", {
        description: "Please enter both starting point and destination.",
      });
      return;
    }
    console.log('Navigating to chat page with:', startingPoint, 'to:', destination);
    // Pass startingPoint and destination via route state
    navigate('/chat', { state: { startingPoint, destination } });
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="starting-point" className="text-sm font-medium text-gray-700 mb-1 block">
              Starting Point
            </Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                id="starting-point"
                type="text"
                placeholder="Where does your trip begin?"
                value={startingPoint}
                onChange={(e) => setStartingPoint(e.target.value)}
                className="pl-10 w-full"
                required
              />
            </div>
          </div>
          <div>
            <Label htmlFor="destination" className="text-sm font-medium text-gray-700 mb-1 block">
              Destination
            </Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                id="destination"
                type="text"
                placeholder="Where would you like to go?"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="pl-10 w-full"
                required
              />
            </div>
          </div>
        </div>
        <Button type="submit" className="w-full btn-primary-custom text-lg py-3">
          Plan My Adventure
        </Button>
      </form>
    </div>
  );
};

export default TripPlannerForm;


import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { toast as sonnerToast } from "sonner"; // Using sonner for notifications

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const ChatPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { startingPoint, destination } = location.state as { startingPoint?: string; destination?: string } || {};

  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoadingPlan, setIsLoadingPlan] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!startingPoint || !destination) {
      sonnerToast.error("Missing trip details. Redirecting...", {
        description: "Please go back and enter a starting point and destination.",
      });
      navigate('/'); // Redirect to home if no state is passed
      return;
    }

    const fetchInitialPlan = async () => {
      setIsLoadingPlan(true);
      setMessages([
        { id: 'initial-bot-greeting', text: `Hello! I'm Ahmed’s Travel Guide Bot. Let me plan your adventure from ${startingPoint} to ${destination}...`, sender: 'bot', timestamp: new Date() }
      ]);
      try {
        const response = await fetch('https://ahmedeno2.app.n8n.cloud/webhook-test/ahmedDiscoversTheWorld', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ startingPoint, destination }),
        });

        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(`Webhook failed: ${response.status} ${errorData || response.statusText}`);
        }

        // Assuming the webhook returns the plan directly as text or a JSON object with a 'plan' or 'message' field
        let planText = "Received an empty plan. Try asking something else!";
        try {
            const planData = await response.json();
            planText = planData.plan || planData.message || JSON.stringify(planData); // Adapt based on actual webhook response
        } catch (e) {
            // If response is not JSON, try to read as text
            const textResponse = await response.text(); // This might re-read if json() failed. Be careful.
            planText = textResponse || planText;
            if (!textResponse && !(e instanceof SyntaxError)) { // if response.text() was already consumed or empty
                // re-fetch might be an option or handle the error more gracefully
                console.warn("Could not parse JSON and text response was empty or already consumed.");
            } else if (!textResponse) {
                 planText = "Received an empty plan. Try asking something else!";
            }
        }


        setMessages(prevMessages => [
          ...prevMessages,
          { id: Date.now().toString(), text: planText, sender: 'bot', timestamp: new Date() },
        ]);
        sonnerToast.success("Travel plan generated!");

      } catch (error) {
        console.error('Failed to fetch travel plan:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        setMessages(prevMessages => [
          ...prevMessages,
          { id: Date.now().toString(), text: `Sorry, I couldn't fetch the travel plan. ${errorMessage}`, sender: 'bot', timestamp: new Date() },
        ]);
        sonnerToast.error("Failed to generate plan", { description: errorMessage });
      } finally {
        setIsLoadingPlan(false);
      }
    };

    fetchInitialPlan();
  }, [startingPoint, destination, navigate]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userInput.trim()) return;

    const newUserMessage: Message = {
      id: Date.now().toString(),
      text: userInput,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages(prevMessages => [...prevMessages, newUserMessage]);
    setUserInput('');
    setIsSendingMessage(true); // For subsequent messages if backend supports it

    // Placeholder for sending user message to backend and getting a response
    // For now, we'll just simulate a bot thinking and then saying it's not fully implemented
    setTimeout(() => {
      setMessages(prevMessages => [
        ...prevMessages,
        { id: (Date.now() + 1).toString(), text: "I've received your message! Further interaction is under development.", sender: 'bot', timestamp: new Date() },
      ]);
      setIsSendingMessage(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900">
      <header className="bg-primary text-primary-foreground p-4 shadow-md">
        <h1 className="text-xl font-semibold text-center font-poppins">Ahmed’s Travel Guide Bot</h1>
      </header>

      <ScrollArea className="flex-grow p-4 sm:p-6" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-lg shadow ${
                  msg.sender === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-none'
                    : 'bg-muted text-muted-foreground rounded-bl-none'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {msg.sender === 'bot' && <Bot className="w-6 h-6 text-primary flex-shrink-0" />}
                   <p className="text-sm font-normal py-1">{msg.text}</p>
                  {msg.sender === 'user' && <User className="w-6 h-6 text-white flex-shrink-0" />}
                </div>
                <p className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-right text-blue-200' : 'text-left text-gray-500'}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          {isLoadingPlan && (
            <div className="flex justify-center items-center py-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2 text-muted-foreground">Generating your adventure...</p>
            </div>
          )}
           {isSendingMessage && messages.length > 0 && messages[messages.length-1].sender === 'user' && (
            <div className="flex justify-start items-center py-2">
                <Bot className="w-6 h-6 text-primary flex-shrink-0 mr-2" />
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <p className="ml-2 text-sm text-muted-foreground">Ahmed is thinking...</p>
            </div>
          )}
        </div>
      </ScrollArea>

      <footer className="bg-background border-t border-border p-3 sm:p-4">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <Input
            type="text"
            placeholder="Ask Ahmed for more details..."
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            className="flex-grow text-sm"
            disabled={isLoadingPlan || isSendingMessage}
          />
          <Button type="submit" size="icon" className="bg-primary hover:bg-primary/90" disabled={isLoadingPlan || isSendingMessage || !userInput.trim()}>
            <Send className="h-5 w-5 text-primary-foreground" />
            <span className="sr-only">Send message</span>
          </Button>
        </form>
      </footer>
    </div>
  );
};

export default ChatPage;


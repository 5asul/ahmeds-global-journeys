import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, Loader2, ArrowLeft } from 'lucide-react'; // Added ArrowLeft
import { toast as sonnerToast } from "sonner";

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
  const [isLoadingPlan, setIsLoadingPlan] = useState(false); // For initial plan
  const [isSendingMessage, setIsSendingMessage] = useState(false); // For subsequent messages

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const parseWebhookResponse = async (response: Response): Promise<string> => {
    let responseText = "Sorry, I couldn't understand the response from the travel guide.";
    try {
      // Clone the response before attempting to read its body
      const clonedResponse = response.clone();
      const responseData = await clonedResponse.json();
      if (Array.isArray(responseData) && responseData.length > 0 && responseData[0].output) {
        responseText = responseData[0].output;
      } else if (responseData.message) {
        responseText = responseData.message;
      } else if (responseData.plan) {
        responseText = responseData.plan;
      } else if (Object.keys(responseData).length > 0) {
        responseText = JSON.stringify(responseData);
      } else {
        // If JSON is empty or not matching known structures, try text
        const textData = await response.text();
        responseText = textData || "Received an empty response from the travel guide.";
      }
    } catch (e) {
      console.warn("Failed to parse JSON, trying text. Error:", e);
      try {
        // If JSON parsing fails, try to read the original response as text
        const textData = await response.text();
        responseText = textData || "Received an unreadable response from the travel guide.";
      } catch (textError) {
        console.error("Failed to read response as text:", textError);
        responseText = "Failed to process the response from the travel guide.";
      }
    }
    return responseText;
  };

  useEffect(() => {
    if (!startingPoint || !destination) {
      sonnerToast.error("Missing trip details. Redirecting...", {
        description: "Please go back and enter a starting point and destination.",
      });
      navigate('/');
      return;
    }

    const fetchInitialPlan = async () => {
      setIsLoadingPlan(true);
      setMessages([
        { id: 'initial-bot-greeting', text: `Hello! I'm Ahmed's Travel Guide Bot. Let me plan your adventure from ${startingPoint} to ${destination}...`, sender: 'bot', timestamp: new Date() }
      ]);
      try {
        const response = await fetch('https://ahmedeno2.app.n8n.cloud/webhook/ahmedDiscoversTheWorld', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ startingPoint, destination }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Webhook failed: ${response.status} ${errorText || response.statusText}`);
        }
        
        const planText = await parseWebhookResponse(response);

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
    if (!userInput.trim() || !startingPoint || !destination) return;

    const newUserMessage: Message = {
      id: Date.now().toString(),
      text: userInput,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages(prevMessages => [...prevMessages, newUserMessage]);
    const currentMessage = userInput;
    setUserInput('');
    setIsSendingMessage(true);

    try {
      console.log('Sending message to n8n:', { message: currentMessage, startingPoint, destination });
      const response = await fetch('https://ahmedeno2.app.n8n.cloud/webhook/ahmedDiscoversTheWorld', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Send user input along with original start/dest for context
        body: JSON.stringify({ message: currentMessage, startingPoint, destination }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Webhook failed: ${response.status} ${errorText || response.statusText}`);
      }

      const botResponseText = await parseWebhookResponse(response);

      setMessages(prevMessages => [
        ...prevMessages,
        { id: (Date.now() + 1).toString(), text: botResponseText, sender: 'bot', timestamp: new Date() },
      ]);
      sonnerToast.info("Ahmed responded!");

    } catch (error) {
      console.error('Failed to send message or get response:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred while sending message.';
      setMessages(prevMessages => [
        ...prevMessages,
        { id: (Date.now() + 1).toString(), text: `Sorry, I couldn't get a response. ${errorMessage}`, sender: 'bot', timestamp: new Date() },
      ]);
      sonnerToast.error("Message failed", { description: errorMessage });
    } finally {
      setIsSendingMessage(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900">
      <header className="bg-primary text-primary-foreground p-4 shadow-md flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="text-primary-foreground hover:bg-primary/80">
          <ArrowLeft className="h-6 w-6" />
          <span className="sr-only">Back to Home</span>
        </Button>
        <h1 className="text-xl font-semibold text-center font-poppins flex-grow">Ahmed's Travel Guide Bot</h1>
        <div className="w-10"></div> {/* Spacer to balance the back button */}
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
          {isLoadingPlan && messages.length <= 1 && ( // Show initial loading only if it's truly the first plan
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

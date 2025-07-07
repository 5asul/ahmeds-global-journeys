
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, Loader2, ArrowLeft } from 'lucide-react';
import { toast as sonnerToast } from "sonner";
import { getOrCreateSession } from '@/utils/cookieSession';
import { saveChatHistory, findChatHistory } from '@/utils/localChatStorage';
import { Message } from '@/types/chat';

const ChatPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { startingPoint, destination } = location.state as { startingPoint?: string; destination?: string } || {};

  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoadingPlan, setIsLoadingPlan] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [chatHistoryId, setChatHistoryId] = useState<string | null>(null);
  const [isArabic, setIsArabic] = useState(false);
  const [currentSession, setCurrentSession] = useState(getOrCreateSession());

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Function to detect if text contains Arabic characters
  const isArabicText = (text: string): boolean => {
    const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
    return arabicRegex.test(text);
  };

  // Function to save chat history to local storage
  const saveLocalChatHistory = async (messagesData: Message[]) => {
    if (!startingPoint || !destination) return;

    try {
      const chatId = saveChatHistory(currentSession.id, startingPoint, destination, messagesData);
      if (!chatHistoryId) {
        setChatHistoryId(chatId);
      }
    } catch (error) {
      console.error('Error saving chat history to localStorage:', error);
    }
  };

  // Function to load existing chat history
  const loadLocalChatHistory = () => {
    if (!startingPoint || !destination) return false;

    try {
      const existingChat = findChatHistory(currentSession.id, startingPoint, destination);
      if (existingChat && existingChat.messages.length > 0) {
        setMessages(existingChat.messages);
        setChatHistoryId(existingChat.id);
        return true;
      }
    } catch (error) {
      console.error('Error loading chat history from localStorage:', error);
    }
    return false;
  };

  // Function to parse webhook response
  const parseWebhookResponse = async (response: Response): Promise<string> => {
    try {
      // First try to get the response as text
      const responseText = await response.text();
      console.log('Raw response:', responseText);
      
      // Try to parse as JSON
      try {
        const responseData = JSON.parse(responseText);
        if (Array.isArray(responseData) && responseData.length > 0 && responseData[0].output) {
          return responseData[0].output;
        } else if (responseData.message) {
          return responseData.message;
        } else if (responseData.plan) {
          return responseData.plan;
        } else if (responseData.output) {
          return responseData.output;
        } else {
          return responseText;
        }
      } catch (jsonError) {
        console.log('Response is not JSON, treating as plain text:', jsonError);
        return responseText;
      }
    } catch (error) {
      console.error("Failed to process response:", error);
      return isArabic ? "فشل في معالجة الرد من مرشد السفر." : "Failed to process the response from the travel guide.";
    }
  };

  useEffect(() => {
    if (!startingPoint || !destination) {
      sonnerToast.error("Missing trip details. Redirecting...", {
        description: "Please go back and enter a starting point and destination.",
      });
      navigate('/');
      return;
    }

    // Detect if Arabic should be used
    const shouldUseArabic = isArabicText(startingPoint) || isArabicText(destination);
    setIsArabic(shouldUseArabic);

    const initializeChat = async () => {
      // Try to load existing chat history first
      const hasExistingHistory = loadLocalChatHistory();
      
      if (!hasExistingHistory) {
        // No existing history, fetch initial plan
        const fetchInitialPlan = async () => {
          setIsLoadingPlan(true);
          const greetingMessage = shouldUseArabic 
            ? `مرحباً! أنا بوت مرشد السفر الخاص بأحمد. دعني أخطط لمغامرتك من ${startingPoint} إلى ${destination}...`
            : `Hello! I'm Ahmed's Travel Guide Bot. Let me plan your adventure from ${startingPoint} to ${destination}...`;
          
          const initialMessages = [
            { id: 'initial-bot-greeting', text: greetingMessage, sender: 'bot' as const, timestamp: new Date() }
          ];
          setMessages(initialMessages);
          
          try {
            const response = await fetch('https://n8n-latest-ptoh.onrender.com/webhook/1c71e7b7-5c04-42f6-93d8-67acda4d6d2e', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ startingPoint, destination }),
            });

            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`Webhook failed: ${response.status} ${errorText || response.statusText}`);
            }
            
            const planText = await parseWebhookResponse(response);

            const updatedMessages = [
              ...initialMessages,
              { id: Date.now().toString(), text: planText, sender: 'bot' as const, timestamp: new Date() },
            ];
            setMessages(updatedMessages);
            await saveLocalChatHistory(updatedMessages);
            
            sonnerToast.success(shouldUseArabic ? "تم إنشاء خطة السفر!" : "Travel plan generated!");

          } catch (error) {
            console.error('Failed to fetch travel plan:', error);
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
            const errorText = shouldUseArabic 
              ? `عذراً، لم أتمكن من جلب خطة السفر. ${errorMessage}`
              : `Sorry, I couldn't fetch the travel plan. ${errorMessage}`;
            
            const errorMessages = [
              ...initialMessages,
              { id: Date.now().toString(), text: errorText, sender: 'bot' as const, timestamp: new Date() },
            ];
            setMessages(errorMessages);
            await saveLocalChatHistory(errorMessages);
            
            sonnerToast.error(shouldUseArabic ? "فشل في إنشاء الخطة" : "Failed to generate plan", { description: errorMessage });
          } finally {
            setIsLoadingPlan(false);
          }
        };

        fetchInitialPlan();
      }
    };

    initializeChat();
  }, [startingPoint, destination, navigate]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  // Save messages whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      saveLocalChatHistory(messages);
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
      const response = await fetch('https://n8n-latest-ptoh.onrender.com/webhook/1c71e7b7-5c04-42f6-93d8-67acda4d6d2e', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: currentMessage, startingPoint, destination }),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
      }

      const botResponseText = await parseWebhookResponse(response);

      setMessages(prevMessages => [
        ...prevMessages,
        { id: (Date.now() + 1).toString(), text: botResponseText, sender: 'bot', timestamp: new Date() },
      ]);
      
      sonnerToast.info(isArabic ? "أحمد رد عليك!" : "Ahmed responded!");

    } catch (error) {
      console.error('Failed to send message or get response:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred while sending message.';
      const errorText = isArabic 
        ? `عذراً، لم أتمكن من الحصول على رد. ${errorMessage}`
        : `Sorry, I couldn't get a response. ${errorMessage}`;
      
      setMessages(prevMessages => [
        ...prevMessages,
        { id: (Date.now() + 1).toString(), text: errorText, sender: 'bot', timestamp: new Date() },
      ]);
      
      sonnerToast.error(isArabic ? "فشل في الرسالة" : "Message failed", { description: errorMessage });
    } finally {
      setIsSendingMessage(false);
    }
  };

  const headerTitle = isArabic ? "بوت مرشد السفر الخاص بأحمد" : "Ahmed's Travel Guide Bot";
  const inputPlaceholder = isArabic ? "اسأل أحمد عن المزيد من التفاصيل..." : "Ask Ahmed for more details...";
  const thinkingText = isArabic ? "أحمد يفكر..." : "Ahmed is thinking...";
  const generatingText = isArabic ? "إنشاء مغامرتك..." : "Generating your adventure...";

  return (
    <div className={`flex flex-col h-screen bg-gray-100 dark:bg-gray-900 ${isArabic ? 'rtl' : 'ltr'}`}>
      <header className="bg-primary text-primary-foreground p-4 shadow-md flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="text-primary-foreground hover:bg-primary/80">
          <ArrowLeft className="h-6 w-6" />
          <span className="sr-only">Back to Home</span>
        </Button>
        <h1 className="text-xl font-semibold text-center font-poppins flex-grow">{headerTitle}</h1>
        <div className="w-10"> {/* Placeholder for balance */}</div>
      </header>

      <ScrollArea className="flex-grow p-4 sm:p-6" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'user' ? (isArabic ? 'justify-start' : 'justify-end') : (isArabic ? 'justify-end' : 'justify-start')}`}
            >
              <div
                className={`max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-lg shadow ${
                  msg.sender === 'user'
                    ? `bg-primary text-primary-foreground ${isArabic ? 'rounded-bl-none' : 'rounded-br-none'}`
                    : `bg-muted text-muted-foreground ${isArabic ? 'rounded-br-none' : 'rounded-bl-none'}`
                }`}
              >
                <div className={`flex items-start gap-2.5 ${isArabic ? 'flex-row-reverse' : ''}`}>
                  {msg.sender === 'bot' && <Bot className="w-6 h-6 text-primary flex-shrink-0" />}
                   <p className="text-sm font-normal py-1">{msg.text}</p>
                  {msg.sender === 'user' && <User className="w-6 h-6 text-white flex-shrink-0" />}
                </div>
                <p className={`text-xs mt-1 ${msg.sender === 'user' ? (isArabic ? 'text-left text-blue-200' : 'text-right text-blue-200') : (isArabic ? 'text-right text-gray-500' : 'text-left text-gray-500')}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          {isLoadingPlan && messages.length <= 1 && (
            <div className="flex justify-center items-center py-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2 text-muted-foreground">{generatingText}</p>
            </div>
          )}
           {isSendingMessage && messages.length > 0 && messages[messages.length-1].sender === 'user' && (
            <div className={`flex items-center py-2 ${isArabic ? 'justify-end flex-row-reverse' : 'justify-start'}`}>
                <Bot className="w-6 h-6 text-primary flex-shrink-0 mr-2" />
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <p className="ml-2 text-sm text-muted-foreground">{thinkingText}</p>
            </div>
          )}
        </div>
      </ScrollArea>

      <footer className="bg-background border-t border-border p-3 sm:p-4">
        <form onSubmit={handleSendMessage} className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
          <Input
            type="text"
            placeholder={inputPlaceholder}
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            className="flex-grow text-sm"
            disabled={isLoadingPlan || isSendingMessage}
            dir={isArabic ? 'rtl' : 'ltr'}
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

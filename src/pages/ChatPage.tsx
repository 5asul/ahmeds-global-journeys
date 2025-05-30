
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, Loader2, ArrowLeft } from 'lucide-react';
import { toast as sonnerToast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface ChatHistory {
  id?: string;
  user_id: string;
  starting_point: string;
  destination: string;
  messages: Message[];
  created_at?: string;
  updated_at?: string;
}

const ChatPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { session } = useAuth();
  const { startingPoint, destination } = location.state as { startingPoint?: string; destination?: string } || {};

  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoadingPlan, setIsLoadingPlan] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [chatHistoryId, setChatHistoryId] = useState<string | null>(null);
  const [isArabic, setIsArabic] = useState(false);

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Function to detect if text contains Arabic characters
  const isArabicText = (text: string): boolean => {
    const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
    return arabicRegex.test(text);
  };

  // Function to save chat history to Supabase
  const saveChatHistory = async (messagesData: Message[]) => {
    if (!session?.user?.id || !startingPoint || !destination) return;

    try {
      const chatData = {
        user_id: session.user.id,
        starting_point: startingPoint,
        destination: destination,
        messages: messagesData,
      };

      if (chatHistoryId) {
        // Update existing chat
        const { error } = await supabase
          .from('chat_history')
          .update({ messages: messagesData, updated_at: new Date().toISOString() })
          .eq('id', chatHistoryId);
        
        if (error) console.error('Error updating chat history:', error);
      } else {
        // Create new chat
        const { data, error } = await supabase
          .from('chat_history')
          .insert([chatData])
          .select()
          .single();
        
        if (error) {
          console.error('Error saving chat history:', error);
        } else if (data) {
          setChatHistoryId(data.id);
        }
      }
    } catch (error) {
      console.error('Error with chat history:', error);
    }
  };

  // Function to load existing chat history
  const loadChatHistory = async () => {
    if (!session?.user?.id || !startingPoint || !destination) return;

    try {
      const { data, error } = await supabase
        .from('chat_history')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('starting_point', startingPoint)
        .eq('destination', destination)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data && !error) {
        setMessages(data.messages as Message[] || []);
        setChatHistoryId(data.id);
        return true; // Found existing history
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
    return false; // No existing history found
  };

  const parseWebhookResponse = async (response: Response): Promise<string> => {
    let responseText = isArabic ? "عذراً، لم أتمكن من فهم الرد من مرشد السفر." : "Sorry, I couldn't understand the response from the travel guide.";
    try {
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
        const textData = await response.text();
        responseText = textData || (isArabic ? "تم استلام رد فارغ من مرشد السفر." : "Received an empty response from the travel guide.");
      }
    } catch (e) {
      console.warn("Failed to parse JSON, trying text. Error:", e);
      try {
        const textData = await response.text();
        responseText = textData || (isArabic ? "تم استلام رد غير قابل للقراءة من مرشد السفر." : "Received an unreadable response from the travel guide.");
      } catch (textError) {
        console.error("Failed to read response as text:", textError);
        responseText = isArabic ? "فشل في معالجة الرد من مرشد السفر." : "Failed to process the response from the travel guide.";
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

    // Detect if Arabic should be used
    const shouldUseArabic = isArabicText(startingPoint) || isArabicText(destination);
    setIsArabic(shouldUseArabic);

    const initializeChat = async () => {
      // Try to load existing chat history first
      const hasExistingHistory = await loadChatHistory();
      
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

            const updatedMessages = [
              ...initialMessages,
              { id: Date.now().toString(), text: planText, sender: 'bot' as const, timestamp: new Date() },
            ];
            setMessages(updatedMessages);
            await saveChatHistory(updatedMessages);
            
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
            await saveChatHistory(errorMessages);
            
            sonnerToast.error(shouldUseArabic ? "فشل في إنشاء الخطة" : "Failed to generate plan", { description: errorMessage });
          } finally {
            setIsLoadingPlan(false);
          }
        };

        fetchInitialPlan();
      }
    };

    initializeChat();
  }, [startingPoint, destination, navigate, session]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  // Save messages whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      saveChatHistory(messages);
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
        <div className="w-10"></div>
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

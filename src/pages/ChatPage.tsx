
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, MapPin } from 'lucide-react';
import { Message } from '@/types/chat';
import { v4 as uuidv4 } from 'uuid';
import { saveChatHistory, loadChatHistory } from '@/utils/localChatStorage';
import { getOrCreateSession } from '@/utils/cookieSession';
import { toast as sonnerToast } from "sonner";

const ChatPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { from, to } = location.state || {};
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const session = getOrCreateSession();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (from && to) {
      console.log('Navigating to chat page with:', from, 'to:', to);
      
      // Load existing chat history for this route
      const existingHistory = loadChatHistory(session.id, from, to);
      if (existingHistory.length > 0) {
        setMessages(existingHistory);
      } else {
        // Send initial message to start the conversation
        const initialMessage = `أريد التخطيط لرحلة من ${from} إلى ${to}`;
        handleSendMessage(initialMessage, true);
      }
    }
  }, [from, to, session.id]);

  const handleSendMessage = async (messageText?: string, isInitial: boolean = false) => {
    const textToSend = messageText || currentMessage.trim();
    if (!textToSend || isLoading) return;

    if (!isInitial) {
      setCurrentMessage('');
    }

    const userMessage: Message = {
      id: uuidv4(),
      text: textToSend,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const requestBody = {
        message: textToSend,
        startingPoint: from,
        destination: to
      };

      console.log('Sending message to n8n:', requestBody);

      const response = await fetch('https://n8n-latest-ptoh.onrender.com/webhook/1c71e7b7-5c04-42f6-93d8-67acda4d6d2e', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Raw response:', data);
      
      let botResponseText = 'Sorry, I could not process your request.';
      
      if (Array.isArray(data) && data.length > 0 && data[0].output) {
        botResponseText = data[0].output;
      } else if (data.output) {
        botResponseText = data.output;
      } else if (typeof data === 'string') {
        botResponseText = data;
      }

      const botMessage: Message = {
        id: uuidv4(),
        text: botResponseText,
        sender: 'bot',
        timestamp: new Date()
      };

      const updatedMessages = [...messages, userMessage, botMessage];
      setMessages(updatedMessages);
      
      // Save to local storage
      saveChatHistory(session.id, from, to, updatedMessages);

    } catch (error) {
      console.error('Error sending message:', error);
      sonnerToast.error("Failed to send message. Please try again.");
      
      const errorMessage: Message = {
        id: uuidv4(),
        text: 'Sorry, there was an error processing your request. Please try again.',
        sender: 'bot',
        timestamp: new Date()
      };

      const updatedMessages = [...messages, userMessage, errorMessage];
      setMessages(updatedMessages);
      saveChatHistory(session.id, from, to, updatedMessages);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!from || !to) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">Invalid Route</h1>
          <p className="text-gray-600 mb-6 text-sm sm:text-base">Please select a starting point and destination.</p>
          <Button onClick={() => navigate('/')} className="btn-primary-custom">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
              className="text-gray-700 hover:bg-gray-100 p-2 sm:px-4"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
              <span className="text-sm sm:text-base">Back</span>
            </Button>
            
            <div className="flex items-center space-x-2 text-center">
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              <div className="text-xs sm:text-sm">
                <span className="font-medium text-gray-800">{from}</span>
                <span className="text-gray-500 mx-1 sm:mx-2">→</span>
                <span className="font-medium text-gray-800">{to}</span>
              </div>
            </div>

            <div className="w-16 sm:w-20"></div> {/* Spacer for balance */}
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 max-w-4xl mx-auto w-full">
        <div className="space-y-3 sm:space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[70%] p-3 sm:p-4 rounded-lg shadow-sm ${
                  message.sender === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-white text-gray-800 border border-gray-200'
                }`}
              >
                <p className="text-sm sm:text-base whitespace-pre-wrap break-words">{message.text}</p>
                <p className={`text-xs mt-1 sm:mt-2 ${
                  message.sender === 'user' ? 'text-primary-foreground/70' : 'text-gray-500'
                }`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white text-gray-800 border border-gray-200 p-3 sm:p-4 rounded-lg shadow-sm">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-gray-600">Ahmed is typing...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 p-3 sm:p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <Input
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about your trip..."
              disabled={isLoading}
              className="flex-1 text-sm sm:text-base"
              dir="auto"
            />
            <Button
              onClick={() => handleSendMessage()}
              disabled={!currentMessage.trim() || isLoading}
              className="btn-primary-custom p-2 sm:px-4 sm:py-2"
            >
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="sr-only">Send message</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;

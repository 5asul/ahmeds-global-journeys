
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, ArrowRight, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';

interface ChatHistoryItem {
  id: string;
  starting_point: string;
  destination: string;
  created_at: string;
  updated_at: string;
}

const ChatHistoryButton = () => {
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { session } = useAuth();
  const navigate = useNavigate();

  const fetchChatHistory = async () => {
    if (!session?.user?.id) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('chat_history')
        .select('id, starting_point, destination, created_at, updated_at')
        .eq('user_id', session.user.id)
        .order('updated_at', { ascending: false });

      if (data && !error) {
        setChatHistory(data);
      } else {
        console.error('Error fetching chat history:', error);
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchChatHistory();
    }
  }, [isOpen, session?.user?.id]);

  const handleChatSelect = (chat: ChatHistoryItem) => {
    navigate('/chat', {
      state: {
        startingPoint: chat.starting_point,
        destination: chat.destination
      }
    });
    setIsOpen(false);
  };

  const formatChatTitle = (startingPoint: string, destination: string) => {
    const maxLength = 30;
    const title = `${startingPoint} → ${destination}`;
    return title.length > maxLength ? `${title.substring(0, maxLength)}...` : title;
  };

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline" size="icon" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
          <History className="h-5 w-5" />
          <span className="sr-only">Chat History</span>
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[80vh]">
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Chat History
          </DrawerTitle>
        </DrawerHeader>
        <ScrollArea className="px-4 pb-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : chatHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No chat history yet</p>
              <p className="text-sm">Start a conversation to see your chats here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {chatHistory.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => handleChatSelect(chat)}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent cursor-pointer transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate">
                      {formatChatTitle(chat.starting_point, chat.destination)}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(chat.updated_at), 'MMM d, yyyy • h:mm a')}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
};

export default ChatHistoryButton;

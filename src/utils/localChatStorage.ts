
import { Message } from '@/types/chat';

export interface LocalChatHistory {
  id: string;
  session_id: string;
  starting_point: string;
  destination: string;
  messages: Message[];
  created_at: string;
  updated_at: string;
}

const CHAT_HISTORY_KEY = 'ahmed_travel_chat_history';

export const getChatHistoryFromStorage = (): LocalChatHistory[] => {
  try {
    const data = localStorage.getItem(CHAT_HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading chat history from localStorage:', error);
    return [];
  }
};

export const saveChatHistoryToStorage = (chatHistory: LocalChatHistory[]): void => {
  try {
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(chatHistory));
  } catch (error) {
    console.error('Error saving chat history to localStorage:', error);
  }
};

export const findChatHistory = (sessionId: string, startingPoint: string, destination: string): LocalChatHistory | null => {
  const allHistory = getChatHistoryFromStorage();
  return allHistory.find(
    (chat) => 
      chat.session_id === sessionId && 
      chat.starting_point === startingPoint && 
      chat.destination === destination
  ) || null;
};

export const saveChatHistory = (sessionId: string, startingPoint: string, destination: string, messages: Message[]): string => {
  const allHistory = getChatHistoryFromStorage();
  
  // Try to find existing chat
  const existingIndex = allHistory.findIndex(
    (chat) => 
      chat.session_id === sessionId && 
      chat.starting_point === startingPoint && 
      chat.destination === destination
  );

  const now = new Date().toISOString();

  if (existingIndex !== -1) {
    // Update existing chat
    allHistory[existingIndex].messages = messages;
    allHistory[existingIndex].updated_at = now;
    saveChatHistoryToStorage(allHistory);
    return allHistory[existingIndex].id;
  } else {
    // Create new chat
    const newChat: LocalChatHistory = {
      id: `chat_${Date.now()}`,
      session_id: sessionId,
      starting_point: startingPoint,
      destination: destination,
      messages: messages,
      created_at: now,
      updated_at: now,
    };
    
    allHistory.push(newChat);
    saveChatHistoryToStorage(allHistory);
    return newChat.id;
  }
};

export const getAllChatHistory = (sessionId: string): LocalChatHistory[] => {
  const allHistory = getChatHistoryFromStorage();
  return allHistory.filter((chat) => chat.session_id === sessionId);
};

export const deleteChatHistory = (chatId: string): void => {
  const allHistory = getChatHistoryFromStorage();
  const filteredHistory = allHistory.filter((chat) => chat.id !== chatId);
  saveChatHistoryToStorage(filteredHistory);
};

export const clearAllChatHistory = (): void => {
  try {
    localStorage.removeItem(CHAT_HISTORY_KEY);
  } catch (error) {
    console.error('Error clearing chat history from localStorage:', error);
  }
};

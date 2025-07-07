
import { v4 as uuidv4 } from 'uuid';

export interface CookieSession {
  id: string;
  created_at: string;
}

export const COOKIE_SESSION_KEY = 'ahmed_travel_session';

export const getCookieSession = (): CookieSession | null => {
  try {
    const sessionData = localStorage.getItem(COOKIE_SESSION_KEY);
    if (sessionData) {
      return JSON.parse(sessionData);
    }
  } catch (error) {
    console.error('Error reading session from localStorage:', error);
  }
  return null;
};

export const createCookieSession = (): CookieSession => {
  const session: CookieSession = {
    id: uuidv4(),
    created_at: new Date().toISOString(),
  };
  
  try {
    localStorage.setItem(COOKIE_SESSION_KEY, JSON.stringify(session));
  } catch (error) {
    console.error('Error saving session to localStorage:', error);
  }
  
  return session;
};

export const getOrCreateSession = (): CookieSession => {
  let session = getCookieSession();
  if (!session) {
    session = createCookieSession();
  }
  return session;
};

export const clearCookieSession = (): void => {
  try {
    localStorage.removeItem(COOKIE_SESSION_KEY);
  } catch (error) {
    console.error('Error clearing session from localStorage:', error);
  }
};

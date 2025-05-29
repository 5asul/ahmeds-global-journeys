
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast as sonnerToast } from "sonner";
import Logo from '@/components/Logo';
import SignInForm from '@/components/auth/SignInForm';
import SignUpForm from '@/components/auth/SignUpForm';

const AuthPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [authActionLoading, setAuthActionLoading] = useState(false);
  
  const { session, loading: authHookLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const initialMode = queryParams.get('mode') === 'signup' ? 'signup' : 'signin';
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);

  useEffect(() => {
    if (!authHookLoading && session) {
      navigate('/'); 
    }
  }, [session, authHookLoading, navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthActionLoading(true);

    try {
      if (mode === 'signup') {
        if (!username.trim()) {
          sonnerToast.error("Username is required.");
          setAuthActionLoading(false);
          return;
        }
        if (username.trim().length < 3) {
          sonnerToast.error("Username must be at least 3 characters long.");
          setAuthActionLoading(false);
          return;
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username.trim(),
            }
          }
        });

        if (error) throw error;
        
        sonnerToast.success("Account created successfully!", { description: "You can now sign in with your credentials." });
        
        // Switch to sign in mode after successful signup
        setMode('signin');
        setPassword(''); // Clear password for security
        setUsername(''); // Clear username

      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        sonnerToast.success("Sign in successful!");
      }
    } catch (error: any) {
      console.error(`${mode} error:`, error);
      sonnerToast.error(`${mode === 'signup' ? 'Sign-up' : 'Sign-in'} failed`, {
        description: error.message || "An unexpected error occurred.",
      });
    } finally {
      setAuthActionLoading(false);
    }
  };

  if (authHookLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-50">
        <div className="animate-pulse text-lg font-semibold text-primary">Loading Adventure...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 via-sky-50 to-blue-100 p-4 selection:bg-primary/20 selection:text-primary">
      <div className="absolute top-8">
        <Logo />
      </div>
      
      <Tabs 
        value={mode} 
        onValueChange={(value) => {
          setMode(value as 'signin' | 'signup');
          setEmail('');
          setPassword('');
          setUsername('');
        }} 
        className="w-full max-w-md mt-24 sm:mt-28 md:mt-32"
      >
        <TabsList className="grid w-full grid-cols-2 bg-slate-200/80">
          <TabsTrigger value="signin" className="data-[state=active]:bg-white data-[state=active]:shadow-md">Sign In</TabsTrigger>
          <TabsTrigger value="signup" className="data-[state=active]:bg-white data-[state=active]:shadow-md">Sign Up</TabsTrigger>
        </TabsList>
        <TabsContent value="signin">
          <SignInForm 
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            handleAuth={handleAuth}
            loading={authActionLoading && mode === 'signin'}
          />
        </TabsContent>
        <TabsContent value="signup">
          <SignUpForm
            username={username}
            setUsername={setUsername}
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            handleAuth={handleAuth}
            loading={authActionLoading && mode === 'signup'}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AuthPage;

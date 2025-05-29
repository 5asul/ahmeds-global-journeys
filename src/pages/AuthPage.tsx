
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
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  
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
    let avatarPathForSignup: string | null = null;

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

        if (selectedAvatarFile) {
          sonnerToast.info("Uploading avatar...");
          const fileExt = selectedAvatarFile.name.split('.').pop();
          const safeEmailPart = email.replace(/[^a-zA-Z0-9]/g, '_');
          const fileName = `${safeEmailPart}-${Date.now()}.${fileExt}`;
          const filePath = `public/${fileName}`; 

          const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, selectedAvatarFile, {
              cacheControl: '3600',
              upsert: false, 
            });

          if (uploadError) {
            console.error("Supabase storage upload error (pre-signup):", uploadError);
            if (uploadError.message.includes("row-level security") || uploadError.message.includes("policy")) {
                sonnerToast.error("Avatar upload failed due to permission issues.", {
                    description: "Please ensure RLS policies on the 'avatars' bucket allow uploads or contact support. For now, signup will proceed without an avatar.",
                });
                avatarPathForSignup = null; 
            } else {
                throw new Error(`Avatar upload failed: ${uploadError.message}`);
            }
          } else {
            avatarPathForSignup = filePath; 
            sonnerToast.success("Avatar pre-uploaded!");
          }
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username.trim(),
              avatar_url: avatarPathForSignup, 
            }
          }
        });

        if (error) throw error;
        
        sonnerToast.success("Sign up successful!", { description: "Please check your email to verify your account." });

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
  
  const handleAvatarFileSelected = (file: File | null) => {
    setSelectedAvatarFile(file);
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
          setSelectedAvatarFile(null);
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
            onAvatarFileSelected={handleAvatarFileSelected}
          />
        </TabsContent>
      </Tabs>
       <p className="mt-8 text-xs text-slate-500 text-center max-w-md">
        Note: For smoother testing during development, you might consider disabling "Confirm email" in your Supabase project's Auth settings.
      </p>
    </div>
  );
};

export default AuthPage;

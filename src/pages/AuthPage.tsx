
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import AvatarUpload from '@/components/AvatarUpload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast as sonnerToast } from "sonner";
import Logo from '@/components/Logo';

const AuthPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [authActionLoading, setAuthActionLoading] = useState(false);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  
  const { session, user, loading: authHookLoading } = useAuth();
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

        // 1. Upload avatar if selected, BEFORE signUp
        if (selectedAvatarFile) {
          sonnerToast.info("Uploading avatar...");
          const fileExt = selectedAvatarFile.name.split('.').pop();
          // Using a temp user ID or random string for pre-signup upload.
          // The actual user ID isn't available yet.
          // The RLS policies on the 'avatars' bucket must allow authenticated users to upload.
          // Or, if using a server-side function for upload, it would handle auth.
          // For client-side, ensure bucket policies are appropriate.
          // A common pattern is to upload to a path like `public/temp_avatars/${random_string}.${fileExt}`
          // and then move/associate it after user creation, or ensure the `handle_new_user` trigger
          // can use this path.
          // For simplicity here, we'll assume 'avatars' bucket RLS allows inserts by authenticated role (even if user is "new")
          // Or the bucket is public for uploads (less secure for user-specific avatars unless paths are unguessable).
          // Let's construct a unique path using user's email (url-safe) and timestamp.
          const safeEmailPart = email.replace(/[^a-zA-Z0-9]/g, '_');
          const fileName = `${safeEmailPart}-${Date.now()}.${fileExt}`;
          const filePath = `public/${fileName}`; // Ensure this matches bucket structure if 'public' is a folder

          const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, selectedAvatarFile, {
              cacheControl: '3600',
              upsert: false, // Use false to avoid overwriting if somehow a name collides pre-signup
            });

          if (uploadError) {
            console.error("Supabase storage upload error (pre-signup):", uploadError);
            throw new Error(`Avatar upload failed: ${uploadError.message}`);
          }
          avatarPathForSignup = filePath; // Store the path to pass to signUp
          sonnerToast.success("Avatar pre-uploaded!");
        }

        // 2. Call signUp with username and avatar_url (if available) in options.data
        const { data: { user: newUser }, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username.trim(),
              avatar_url: avatarPathForSignup, // Pass the uploaded avatar path here
            }
          }
        });

        if (error) throw error;
        
        // The handle_new_user trigger in Supabase will now use avatar_url from options.data
        // to populate the profiles table. No need for a separate profile update call here.

        sonnerToast.success("Sign up successful!", { description: "Please check your email to verify your account." });

      } else { // signin
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
      <div className="absolute top-8"> {/* Logo positioned at the top */}
        <Logo />
      </div>
      
      <Tabs value={mode} onValueChange={(value) => setMode(value as 'signin' | 'signup')} className="w-full max-w-md mt-24 sm:mt-28 md:mt-32"> {/* Added margin-top to account for fixed Logo */}
        <TabsList className="grid w-full grid-cols-2 bg-slate-200/80">
          <TabsTrigger value="signin" className="data-[state=active]:bg-white data-[state=active]:shadow-md">Sign In</TabsTrigger>
          <TabsTrigger value="signup" className="data-[state=active]:bg-white data-[state=active]:shadow-md">Sign Up</TabsTrigger>
        </TabsList>
        <TabsContent value="signin">
          <Card className="shadow-xl border-slate-200/80">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-poppins text-slate-700">Welcome Back!</CardTitle>
              <CardDescription className="text-slate-500">Access your account to plan your adventures.</CardDescription>
            </CardHeader>
            <form onSubmit={handleAuth}>
              <CardContent className="space-y-6 pt-2 pb-6 px-6">
                <div className="space-y-2">
                  <Label htmlFor="email-signin" className="text-slate-600 font-medium">Email</Label>
                  <Input id="email-signin" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required 
                         className="text-base focus:border-primary focus:ring-primary/50"/>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-signin" className="text-slate-600 font-medium">Password</Label>
                  <Input id="password-signin" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required 
                         className="text-base focus:border-primary focus:ring-primary/50"/>
                </div>
              </CardContent>
              <CardFooter className="px-6 pb-6">
                <Button type="submit" className="w-full btn-primary-custom py-3 text-base font-semibold" disabled={authActionLoading}>
                  {authActionLoading && mode === 'signin' ? 'Signing In...' : 'Sign In'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
        <TabsContent value="signup">
          <Card className="shadow-xl border-slate-200/80">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-poppins text-slate-700">Create Your Account</CardTitle>
              <CardDescription className="text-slate-500">Join us to start discovering new horizons.</CardDescription>
            </CardHeader>
            <form onSubmit={handleAuth}>
              <CardContent className="space-y-6 pt-2 pb-6 px-6">
                <div className="flex justify-center">
                  <AvatarUpload 
                    initialAvatarUrl={null} 
                    onFileSelected={handleAvatarFileSelected} 
                    size={100}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username-signup" className="text-slate-600 font-medium">Username</Label>
                  <Input id="username-signup" type="text" placeholder="Choose a unique username" value={username} onChange={(e) => setUsername(e.target.value)} required 
                         className="text-base focus:border-primary focus:ring-primary/50"/>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-signup" className="text-slate-600 font-medium">Email</Label>
                  <Input id="email-signup" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required 
                         className="text-base focus:border-primary focus:ring-primary/50"/>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-signup" className="text-slate-600 font-medium">Password</Label>
                  <Input id="password-signup" type="password" placeholder="Choose a strong password" value={password} onChange={(e) => setPassword(e.target.value)} required 
                         className="text-base focus:border-primary focus:ring-primary/50"/>
                </div>
              </CardContent>
              <CardFooter className="px-6 pb-6">
                <Button type="submit" className="w-full btn-primary-custom py-3 text-base font-semibold" disabled={authActionLoading}>
                  {authActionLoading && mode === 'signup' ? 'Creating Account...' : 'Sign Up'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
       <p className="mt-8 text-xs text-slate-500 text-center max-w-md">
        Note: For smoother testing during development, you might consider disabling "Confirm email" in your Supabase project's Auth settings.
      </p>
    </div>
  );
};

export default AuthPage;

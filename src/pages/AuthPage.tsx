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
  const [username, setUsername] = useState(''); // Added username state
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

    try {
      if (mode === 'signup') {
        // Input validation for username (basic example)
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

        const { data: { user: newUser }, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username.trim(),
              // avatar_url will be set by the handle_new_user trigger if passed,
              // or updated below if an avatar is selected.
            }
          }
        });

        if (error) throw error;
        
        // Avatar upload logic (remains largely the same, RLS policies should allow update now)
        if (newUser && selectedAvatarFile) {
          sonnerToast.info("Uploading avatar...");
          const fileExt = selectedAvatarFile.name.split('.').pop();
          // Use a more robust way to generate a unique file name if needed,
          // but newUser.id should be sufficiently unique.
          const fileName = `${newUser.id}.${fileExt}`; 
          const filePath = `public/${fileName}`; // Ensure this matches bucket structure if 'public' is a folder

          const { error: uploadError } = await supabase.storage
            .from('avatars') // Ensure this is the correct bucket name
            .upload(filePath, selectedAvatarFile, {
              cacheControl: '3600',
              upsert: true, // Overwrite if file with same name exists for this user
            });

          if (uploadError) {
            // Log specific Supabase storage error
            console.error("Supabase storage upload error:", uploadError);
            throw new Error(`Avatar upload failed: ${uploadError.message}`);
          }
          sonnerToast.success("Avatar uploaded!");

          // Update profile with avatar_url (path)
          // The handle_new_user trigger might have already created the profile.
          // This update ensures avatar_url is set if an avatar was uploaded.
          const { error: profileError } = await supabase
            .from('profiles')
            .update({ avatar_url: filePath }) // Store the path
            .eq('id', newUser.id);

          if (profileError) {
             console.error("Supabase profile update error:", profileError);
             throw new Error(`Profile update for avatar failed: ${profileError.message}`);
          }
        }
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
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-sky-100 p-4 pt-16 sm:pt-8 space-y-6 sm:space-y-8"> {/* Added pt and space-y */}
      <Logo /> {/* Logo moved here, will be centered by parent's items-center */}
      <Tabs value={mode} onValueChange={(value) => setMode(value as 'signin' | 'signup')} className="w-full max-w-md">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="signin">Sign In</TabsTrigger>
          <TabsTrigger value="signup">Sign Up</TabsTrigger>
        </TabsList>
        <TabsContent value="signin">
          <Card>
            <CardHeader>
              <CardTitle>Sign In</CardTitle>
              <CardDescription>Access your account to plan your adventures.</CardDescription>
            </CardHeader>
            <form onSubmit={handleAuth}>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="email-signin">Email</Label>
                  <Input id="email-signin" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="password-signin">Password</Label>
                  <Input id="password-signin" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full btn-primary-custom" disabled={authActionLoading}>
                  {authActionLoading && mode === 'signin' ? 'Signing In...' : 'Sign In'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
        <TabsContent value="signup">
          <Card>
            <CardHeader>
              <CardTitle>Sign Up</CardTitle>
              <CardDescription>Create an account to start discovering.</CardDescription>
            </CardHeader>
            <form onSubmit={handleAuth}>
              <CardContent className="space-y-4">
                <AvatarUpload 
                  initialAvatarUrl={null} 
                  onFileSelected={handleAvatarFileSelected} 
                  size={100} // Slightly smaller for better fit
                />
                <div className="space-y-1">
                  <Label htmlFor="username-signup">Username</Label> {/* Added Username Input */}
                  <Input id="username-signup" type="text" placeholder="Choose a username" value={username} onChange={(e) => setUsername(e.target.value)} required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="email-signup">Email</Label>
                  <Input id="email-signup" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="password-signup">Password</Label>
                  <Input id="password-signup" type="password" placeholder="Choose a strong password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full btn-primary-custom" disabled={authActionLoading}>
                  {authActionLoading && mode === 'signup' ? 'Signing Up...' : 'Sign Up'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
       <p className="mt-4 text-xs text-slate-500 text-center"> {/* Added text-center */}
        Note: For development, you might want to disable "Confirm email" in your Supabase project's Auth settings to speed up testing.
      </p>
    </div>
  );
};

export default AuthPage;

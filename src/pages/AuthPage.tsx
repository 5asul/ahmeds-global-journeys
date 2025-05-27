
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
  const [authActionLoading, setAuthActionLoading] = useState(false); // Renamed from 'loading' to avoid conflict
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  
  const { session, user, loading: authHookLoading } = useAuth(); // Renamed from 'authLoading'
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
        const { data: { user: newUser }, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        
        let uploadedAvatarPath: string | null = null;
        if (newUser && selectedAvatarFile) {
          // Upload avatar if one was selected
          const fileExt = selectedAvatarFile.name.split('.').pop();
          const fileName = `${newUser.id}-${Math.random()}.${fileExt}`;
          const filePath = `${fileName}`;

          sonnerToast.info("Uploading avatar...");
          const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, selectedAvatarFile);

          if (uploadError) {
            throw new Error(`Avatar upload failed: ${uploadError.message}`);
          }
          uploadedAvatarPath = filePath;
          sonnerToast.success("Avatar uploaded!");

          // Update profile with avatar_url (path)
          const { error: profileError } = await supabase
            .from('profiles')
            .update({ avatar_url: uploadedAvatarPath })
            .eq('id', newUser.id);
          if (profileError) {
             throw new Error(`Profile update failed: ${profileError.message}`);
          }
        }
        sonnerToast.success("Sign up successful!", { description: "Please check your email to verify your account." });
        // onAuthStateChange in useAuth will handle navigation or state update
      } else { // signin
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        sonnerToast.success("Sign in successful!");
        // onAuthStateChange in useAuth will handle navigation or state update
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-sky-100 p-4">
      <div className="absolute top-8 left-8">
        <Logo />
      </div>
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
                  {authActionLoading ? 'Signing In...' : 'Sign In'}
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
                  size={120}
                  // userId is intentionally not passed for signup mode before user creation
                />
                <div className="space-y-1">
                  <Label htmlFor="email-signup">Email</Label>
                  <Input id="email-signup" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="password-signup">Password</Label>
                  <Input id="password-signup" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full btn-primary-custom" disabled={authActionLoading}>
                  {authActionLoading ? 'Signing Up...' : 'Sign Up'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
       <p className="mt-4 text-xs text-slate-500">
        Note: For development, you might want to disable "Confirm email" in your Supabase project's Auth settings to speed up testing.
      </p>
    </div>
  );
};

export default AuthPage;

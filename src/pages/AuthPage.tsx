
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import AvatarUpload from '@/components/AvatarUpload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'; // Assuming you have Tabs component
import { toast as sonnerToast } from "sonner";
import Logo from '@/components/Logo';

const AuthPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  
  const { session, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const initialMode = queryParams.get('mode') === 'signup' ? 'signup' : 'signin';
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);

  useEffect(() => {
    if (!authLoading && session) {
      navigate('/'); // Redirect if already logged in
    }
  }, [session, authLoading, navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { data: { user: newUser, session: newSession }, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        if (newUser && avatarPath) {
          // Update profile with avatar_url (path, not public URL)
          const { error: profileError } = await supabase
            .from('profiles')
            .update({ avatar_url: avatarPath })
            .eq('id', newUser.id);
          if (profileError) throw profileError;
        }
        sonnerToast.success("Sign up successful!", { description: "Please check your email to verify your account." });
        // Supabase onAuthStateChange will handle redirect via useAuth hook or navigate('/');
      } else { // signin
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        sonnerToast.success("Sign in successful!");
        // Supabase onAuthStateChange will handle redirect via useAuth hook or navigate('/');
      }
    } catch (error: any) {
      console.error(`${mode} error:`, error);
      sonnerToast.error(`${mode === 'signup' ? 'Sign-up' : 'Sign-in'} failed`, {
        description: error.message || "An unexpected error occurred.",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleAvatarUploaded = (filePath: string) => {
    setAvatarPath(filePath); // Store the file path from Supabase storage
  };

  if (authLoading) {
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
                <Button type="submit" className="w-full btn-primary-custom" disabled={loading}>
                  {loading ? 'Signing In...' : 'Sign In'}
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
                {/* For new sign-ups, user ID isn't known until after sign-up. 
                    Avatar can be uploaded after sign-up or use a placeholder and update later.
                    For simplicity, we'll allow upload and associate it post-signup if user is created.
                    This means the AvatarUpload component's userId prop will be undefined initially.
                    A more robust flow might involve a multi-step signup.
                */}
                <AvatarUpload 
                  userId={user?.id} /* This will be undefined for new signups until after auth.signUp. Better to handle post-signup. */
                  initialAvatarUrl={null} 
                  onUpload={handleAvatarUploaded} 
                  size={120}
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
                <Button type="submit" className="w-full btn-primary-custom" disabled={loading}>
                  {loading ? 'Signing Up...' : 'Sign Up'}
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

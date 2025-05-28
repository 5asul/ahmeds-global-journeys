
import React from 'react';
import AvatarUpload from '@/components/AvatarUpload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface SignUpFormProps {
  username: string;
  setUsername: (username: string) => void;
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  handleAuth: (e: React.FormEvent) => Promise<void>;
  loading: boolean;
  onAvatarFileSelected: (file: File | null) => void;
}

const SignUpForm: React.FC<SignUpFormProps> = ({
  username,
  setUsername,
  email,
  setEmail,
  password,
  setPassword,
  handleAuth,
  loading,
  onAvatarFileSelected,
}) => {
  return (
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
              onFileSelected={onAvatarFileSelected} 
              size={100}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username-signup" className="text-slate-600 font-medium">Username</Label>
            <Input 
              id="username-signup" 
              type="text" 
              placeholder="Choose a unique username" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              required 
              className="text-base focus:border-primary focus:ring-primary/50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email-signup" className="text-slate-600 font-medium">Email</Label>
            <Input 
              id="email-signup" 
              type="email" 
              placeholder="you@example.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              className="text-base focus:border-primary focus:ring-primary/50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password-signup" className="text-slate-600 font-medium">Password</Label>
            <Input 
              id="password-signup" 
              type="password" 
              placeholder="Choose a strong password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              className="text-base focus:border-primary focus:ring-primary/50"
            />
          </div>
        </CardContent>
        <CardFooter className="px-6 pb-6">
          <Button type="submit" className="w-full btn-primary-custom py-3 text-base font-semibold" disabled={loading}>
            {loading ? 'Creating Account...' : 'Sign Up'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default SignUpForm;


import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface SignInFormProps {
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  handleAuth: (e: React.FormEvent) => Promise<void>;
  loading: boolean;
}

const SignInForm: React.FC<SignInFormProps> = ({ email, setEmail, password, setPassword, handleAuth, loading }) => {
  return (
    <Card className="shadow-xl border-slate-200/80">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-poppins text-slate-700">Welcome Back!</CardTitle>
        <CardDescription className="text-slate-500">Access your account to plan your adventures.</CardDescription>
      </CardHeader>
      <form onSubmit={handleAuth}>
        <CardContent className="space-y-6 pt-2 pb-6 px-6">
          <div className="space-y-2">
            <Label htmlFor="email-signin" className="text-slate-600 font-medium">Email</Label>
            <Input 
              id="email-signin" 
              type="email" 
              placeholder="you@example.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              className="text-base focus:border-primary focus:ring-primary/50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password-signin" className="text-slate-600 font-medium">Password</Label>
            <Input 
              id="password-signin" 
              type="password" 
              placeholder="••••••••" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              className="text-base focus:border-primary focus:ring-primary/50"
            />
          </div>
        </CardContent>
        <CardFooter className="px-6 pb-6">
          <Button type="submit" className="w-full btn-primary-custom py-3 text-base font-semibold" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default SignInForm;

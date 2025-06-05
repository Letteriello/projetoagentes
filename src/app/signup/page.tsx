'use client';

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext'; // Adjust path as needed
import { useRouter } from 'next/navigation';
import { Checkbox } from "@/components/ui/checkbox"; // Import Checkbox
import { Button } from "@/components/ui/button"; // Import Button for styling
import { useToast } from "@/hooks/use-toast"; // Import useToast

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const { signup } = useAuth();
  const router = useRouter();
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
  const [isVerifyingCaptcha, setIsVerifyingCaptcha] = useState(false);
  const { toast } = useToast();

  const handleCaptchaChange = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      setIsVerifyingCaptcha(true);
      setTimeout(() => {
        setIsCaptchaVerified(true);
        setIsVerifyingCaptcha(false);
        toast({ title: "Verificado", description: "Você não é um robô!", duration: 2000 });
      }, 800); // Simulate 0.8 second delay
    } else {
      setIsCaptchaVerified(false);
      setIsVerifyingCaptcha(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!isCaptchaVerified) {
      toast({
        title: "Verificação Necessária",
        description: "Por favor, confirme que você não é um robô.",
        variant: "destructive",
      });
      // Optionally set an error state specific to captcha if not using toast for everything
      // setError("Por favor, confirme que você não é um robô.");
      return;
    }

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    try {
      await signup(email, password);
      setMessage('Signup successful! Redirecting to login...');
      toast({ title: "Signup Successful!", description: "Redirecting to login..." });
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to sign up. Please try again.');
      console.error('Signup failed:', err);
      setIsCaptchaVerified(false); // Reset CAPTCHA on signup failure
      setIsVerifyingCaptcha(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: 'auto', padding: '20px' }}>
      <h1>Sign Up</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>

        <div className="flex items-center space-x-2 my-2"> {/* Adjusted margin */}
          <Checkbox
            id="captcha"
            checked={isCaptchaVerified || isVerifyingCaptcha}
            onCheckedChange={handleCaptchaChange}
            disabled={isVerifyingCaptcha}
          />
          <label
            htmlFor="captcha"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {isVerifyingCaptcha ? "Verificando..." : "Eu não sou um robô"}
          </label>
        </div>

        {error && <p style={{ color: 'red', fontSize: '0.9em' }}>{error}</p>}
        {message && <p style={{ color: 'green', fontSize: '0.9em' }}>{message}</p>}

        <Button type="submit" disabled={isVerifyingCaptcha || (!email || !password)}>
          Sign Up
        </Button>
      </form>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Checkbox } from "@/components/ui/checkbox"; // Import Checkbox
import { Button } from "@/components/ui/button"; // Import Button for styling
import { useToast } from "@/hooks/use-toast"; // Import useToast

type LoginFormInputs = {
  email: string;
  password: string;
};

const LoginPage: React.FC = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormInputs>();
  const { login, user } = useAuth();
  const router = useRouter();
  const [loginError, setLoginError] = useState<string | null>(null);
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

  const onSubmit: SubmitHandler<LoginFormInputs> = async (data) => {
    setLoginError(null);
    if (!isCaptchaVerified) {
      toast({
        title: "Verificação Necessária",
        description: "Por favor, confirme que você não é um robô.",
        variant: "destructive",
      });
      return;
    }

    try {
      await login(data.email, data.password);
      router.push('/');
    } catch (err: any) {
      console.error("Login failed:", err);
      setLoginError(err.message || 'Failed to login. Please check your credentials.');
      setIsCaptchaVerified(false); // Reset CAPTCHA on login failure
      setIsVerifyingCaptcha(false); // Reset verifying state
    }
  };

  // Optional: Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);


  return (
    <div>
      <h1>Login</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email" // Changed type to email for better semantics
            {...register('email', { required: 'Email is required' })}
          />
          {errors.email && <p>{errors.email.message}</p>}
        </div>

        <div>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            {...register('password', { required: 'Password is required' })}
          />
          {errors.password && <p className="text-red-500 text-xs">{errors.password.message}</p>}
        </div>

        <div className="flex items-center space-x-2 my-4">
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

        {loginError && <p className="text-red-500 text-sm my-2">{loginError}</p>}

        <Button type="submit" disabled={isVerifyingCaptcha || Object.keys(errors).length > 0}>
          Login
        </Button>
      </form>
    </div>
  );
};

export default LoginPage;

"use client";

import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';

type LoginFormInputs = {
  usernameOrEmail: string;
  password_value: string; // Renamed to avoid conflict with global PasswordCredential
};

const LoginPage: React.FC = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormInputs>();
  const { login } = useAuth();
  const router = useRouter();
  const [loginError, setLoginError] = useState<string | null>(null);

  const onSubmit: SubmitHandler<LoginFormInputs> = (data) => {
    // Simulate login
    if (data.usernameOrEmail === 'test' && data.password_value === 'test') {
      const mockUserData = { username: 'Test User', email: 'test@example.com' };
      login(mockUserData);
      router.push('/'); // Redirect to a protected page (e.g., homepage)
    } else {
      setLoginError('Invalid username or password');
    }
  };

  return (
    <div>
      <h1>Login</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label htmlFor="usernameOrEmail">Username or Email</label>
          <input
            id="usernameOrEmail"
            type="text"
            {...register('usernameOrEmail', { required: 'Username or Email is required' })}
          />
          {errors.usernameOrEmail && <p>{errors.usernameOrEmail.message}</p>}
        </div>

        <div>
          <label htmlFor="password_value">Password</label>
          <input
            id="password_value"
            type="password"
            {...register('password_value', { required: 'Password is required' })}
          />
          {errors.password_value && <p>{errors.password_value.message}</p>}
        </div>

        {loginError && <p style={{ color: 'red' }}>{loginError}</p>}

        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default LoginPage;

import React, { useEffect } from 'react';
import { Outlet, useSearchParams, useNavigate } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { Toaster } from '@/components/ui/sonner';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { config } from '@/lib/config';

export function Layout() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuthStore();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      toast.error(`Authentication failed: ${error}`);
      // Clear params
      setSearchParams({});
      return;
    }

    // Helper to safely parse JWT
    const parseJwt = (token: string) => {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
      } catch (e) {
        throw new Error('Failed to parse JWT');
      }
    };

    if (token) {
      try {
        const payload = parseJwt(token);
        const username = payload.user.username;

        // Fetch user profile
        fetch(`${config.apiBaseUrl}/users/${username}`)
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              login(data.data, token);
              toast.success(`Welcome back, ${data.data.displayName || username}!`);
              navigate('/dashboard');
            } else {
              toast.error('Failed to load user profile');
              navigate('/auth');
            }
          })
          .catch(err => {
            console.error(err);
            toast.error('Failed to login');
            navigate('/auth');
          });
      } catch (e) {
        console.error('Invalid token', e);
        toast.error('Invalid authentication token');
        navigate('/auth');
      } finally {
        // Clear token from URL after processing
        setSearchParams({});
      }
    }
  }, [searchParams, login, navigate, setSearchParams]);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
      <Footer />
      <Toaster richColors position="top-right" />
    </div>
  );
}
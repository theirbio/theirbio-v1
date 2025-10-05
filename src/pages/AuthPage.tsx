import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from 'lucide-react';
import { api } from '@/lib/api-client';
import { useAuthStore } from '@/stores/authStore';
import { useProfileStore } from '@/stores/profileStore';
import { toast } from 'sonner';
import type { User } from '@shared/types';
const signupSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(20),
  password: z.string().min(8, "Password must be at least 8 characters"),
  accountType: z.enum(['person', 'company']),
});
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});
type SignupFormValues = z.infer<typeof signupSchema>;
type LoginFormValues = z.infer<typeof loginSchema>;
export function AuthPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { invalidateProfiles } = useProfileStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const signupForm = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { username: '', password: '', accountType: 'person' },
  });
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  });
  const onSignupSubmit = async (values: SignupFormValues) => {
    setIsSubmitting(true);
    try {
      const { user, token } = await api<{ user: User; token: string }>('/api/signup', {
        method: 'POST',
        body: JSON.stringify(values),
      });
      login(user, token);
      invalidateProfiles(); // Invalidate cache to include new user on homepage
      toast.success(`Welcome, ${user.displayName}!`, {
        description: "You're all set up. Let's customize your profile!",
        action: {
          label: 'Go to Dashboard',
          onClick: () => navigate('/dashboard'),
        },
      });
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Signup failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  const onLoginSubmit = async (values: LoginFormValues) => {
    setIsSubmitting(true);
    try {
      const { user, token } = await api<{ user: User; token: string }>('/api/login', {
        method: 'POST',
        body: JSON.stringify(values),
      });
      login(user, token);
      toast.success(`Welcome back, ${user.displayName}!`);
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <Tabs defaultValue="signup" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
            <TabsTrigger value="login">Login</TabsTrigger>
          </TabsList>
          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle>Create your Profile</CardTitle>
                <CardDescription>Join theirBio to create your personal page.</CardDescription>
              </CardHeader>
              <CardContent>
                <Alert className="mb-6">
                  <Info className="h-4 w-4" />
                  <AlertTitle>Demo Platform</AlertTitle>
                  <AlertDescription>
                    This is a public demo. Please use a mock username and password. Do not use real credentials.
                  </AlertDescription>
                </Alert>
                <Form {...signupForm}>
                  <form onSubmit={signupForm.handleSubmit(onSignupSubmit)} className="space-y-4">
                    <FormField
                      control={signupForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="your_username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signupForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signupForm.control}
                      name="accountType"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>Account Type</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex space-x-4"
                            >
                              <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="person" />
                                </FormControl>
                                <FormLabel className="font-normal">Person</FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="company" />
                                </FormControl>
                                <FormLabel className="font-normal">Company</FormLabel>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? 'Creating Account...' : 'Create Account'}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Welcome Back</CardTitle>
                <CardDescription>Log in to manage your profile.</CardDescription>
              </CardHeader>
              <CardContent>
                <Alert className="mb-6">
                  <Info className="h-4 w-4" />
                  <AlertTitle>Demo Platform</AlertTitle>
                  <AlertDescription>
                    This is a public demo. Please use the mock credentials you created.
                  </AlertDescription>
                </Alert>
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="your_username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? 'Logging In...' : 'Login'}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
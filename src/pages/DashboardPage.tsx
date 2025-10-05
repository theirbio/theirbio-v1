import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, Variants } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import { useProfileStore } from '@/stores/profileStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { Navigate, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api-client';
import type { User } from '@shared/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronsUpDown, Copy } from 'lucide-react';
import { AvatarEditor } from '@/components/AvatarEditor';
const profileSchema = z.object({
  displayName: z.string().min(1, "Display name is required").max(50),
  bio: z.string().max(160, "Bio must be 160 characters or less").optional(),
  avatarUrl: z.string().url("Must be a valid URL").optional().or(z.literal('')),
  links: z.object({
    twitter: z.string().url({ message: "Invalid URL" }).optional().or(z.literal('')),
    github: z.string().url({ message: "Invalid URL" }).optional().or(z.literal('')),
    website: z.string().url({ message: "Invalid URL" }).optional().or(z.literal('')),
    linkedin: z.string().url({ message: "Invalid URL" }).optional().or(z.literal('')),
  }).optional(),
});
type ProfileFormValues = z.infer<typeof profileSchema>;
export function DashboardPage() {
  const { user, token, isAuthenticated, setUser, logout } = useAuthStore();
  const { invalidateProfiles } = useProfileStore();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLinksOpen, setIsLinksOpen] = useState(false);
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: user?.displayName || '',
      bio: user?.bio || '',
      avatarUrl: user?.avatarUrl || '',
      links: {
        twitter: user?.links?.twitter || '',
        github: user?.links?.github || '',
        website: user?.links?.website || '',
        linkedin: user?.links?.linkedin || '',
      },
    },
  });
  if (!isAuthenticated || !user) {
    return <Navigate to="/auth" replace />;
  }
  const onSubmit = async (values: ProfileFormValues) => {
    setIsSubmitting(true);
    try {
      const updatedUser = await api<User>('/api/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });
      setUser(updatedUser);
      invalidateProfiles(); // Invalidate cache after update
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile.");
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await api('/api/profile', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      toast.success("Your account has been deleted.");
      invalidateProfiles(); // Invalidate cache after deletion
      logout();
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || "Failed to delete account.");
    } finally {
      setIsDeleting(false);
    }
  };
  const handleCopyLink = () => {
    const profileUrl = `${window.location.origin}/${user.username}`;
    navigator.clipboard.writeText(profileUrl);
    toast.success("Profile link copied to clipboard!");
  };
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.1 },
    },
  };
  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } },
  };
  return (
    <motion.div
      className="max-w-2xl mx-auto space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle>Edit Your Profile</CardTitle>
            <CardDescription>Update your public information here. Click save when you're done.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="flex items-center space-x-6">
                  <AvatarEditor
                    currentAvatarUrl={form.watch('avatarUrl') || ''}
                    displayName={form.watch('displayName') || user.displayName || ''}
                    onAvatarChange={(newUrl) => form.setValue('avatarUrl', newUrl, { shouldValidate: true, shouldDirty: true })}
                  />
                  <div className="flex-grow">
                    <FormField
                      control={form.control}
                      name="displayName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Display Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Your Name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Tell us a little about yourself" className="resize-none" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Collapsible open={isLinksOpen} onOpenChange={setIsLinksOpen}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="flex w-full justify-between px-0 hover:bg-transparent">
                      <h3 className="text-lg font-medium">Social Links (Optional)</h3>
                      <ChevronsUpDown className="h-4 w-4" />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 pt-4">
                    <FormField control={form.control} name="links.website" render={({ field }) => (
                      <FormItem><FormLabel>Website</FormLabel><FormControl><Input placeholder="https://your-site.com" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="links.github" render={({ field }) => (
                      <FormItem><FormLabel>GitHub</FormLabel><FormControl><Input placeholder="https://github.com/username" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="links.twitter" render={({ field }) => (
                      <FormItem><FormLabel>Twitter / X</FormLabel><FormControl><Input placeholder="https://x.com/username" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="links.linkedin" render={({ field }) => (
                      <FormItem><FormLabel>LinkedIn</FormLabel><FormControl><Input placeholder="https://linkedin.com/in/username" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </CollapsibleContent>
                </Collapsible>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="bg-muted/50 p-4 border-t flex items-center justify-between">
            <p className="text-sm text-muted-foreground truncate">
              Your public link: <span className="font-medium text-foreground">{`${window.location.origin}/${user.username}`}</span>
            </p>
            <Button variant="outline" size="sm" onClick={handleCopyLink}>
              <Copy className="h-3.5 w-3.5 mr-2" />
              Copy Link
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
      <motion.div variants={itemVariants}>
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>These actions are permanent and cannot be undone.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Delete your account</p>
                <p className="text-sm text-muted-foreground">This will permanently delete your account and all of your data.</p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={isDeleting}>
                    {isDeleting ? 'Deleting...' : 'Delete Account'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your account and remove your data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive hover:bg-destructive/90">
                      Yes, delete my account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
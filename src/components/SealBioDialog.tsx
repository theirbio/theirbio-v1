import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import type { Experience } from '@shared/types';
const sealBioSchema = z.object({
  role: z.string().min(1, "Role is required").max(100),
  period: z.string().min(1, "Period is required").max(50),
  description: z.string().max(280).optional(),
});
type SealBioFormValues = z.infer<typeof sealBioSchema>;
interface SealBioDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  personHandle: string;
  onSealSuccess: (newExperience: Experience) => void;
}
export function SealBioDialog({ isOpen, onOpenChange, personHandle, onSealSuccess }: SealBioDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<SealBioFormValues>({
    resolver: zodResolver(sealBioSchema),
    defaultValues: { role: '', period: '', description: '' },
  });
  const onSubmit = async (values: SealBioFormValues) => {
    setIsSubmitting(true);
    try {
      const newExperience = await api<Experience>('/api/seals', {
        method: 'POST',
        body: JSON.stringify({ ...values, personHandle }),
      });
      toast.success(`Successfully sealed bio for @${personHandle}`);
      onSealSuccess(newExperience);
      form.reset();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to seal bio. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Seal Bio for @{personHandle}</DialogTitle>
          <DialogDescription>
            Add a validated work experience entry to this user's profile. This will be publicly visible.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role / Title</FormLabel>
                  <FormControl><Input placeholder="e.g., Software Engineer" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="period"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Period</FormLabel>
                  <FormControl><Input placeholder="e.g., 2022 - Present" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl><Textarea placeholder="A brief description of the role and responsibilities." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Sealing...' : 'Seal Experience'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '@/lib/api-client';
import type { Profile, Experience } from '@shared/types';
import { useAuthStore } from '@/stores/authStore';
import { useProfileStore } from '@/stores/profileStore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Globe, Github, Linkedin, Twitter, Building, Briefcase, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SealBioDialog } from '@/components/SealBioDialog';
import { ExperienceCard } from '@/components/ExperienceCard';
export function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser } = useAuthStore();
  const { invalidateProfiles } = useProfileStore();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSealDialogOpen, setIsSealDialogOpen] = useState(false);
  useEffect(() => {
    if (!username) return;
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api<Profile>(`/api/users/${username}`);
        setProfile(data);
      } catch (err: any) {
        setError(err.message || 'Profile not found.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [username]);
  const canSealBio = useMemo(() => {
    // Allow sealing if the profile is a person and not the current user's profile.
    // This works for both guests and other logged-in users.
    if (profile?.accountType !== 'person') {
      return false;
    }
    if (currentUser && currentUser.username === profile.username) {
      return false;
    }
    return true;
  }, [currentUser, profile]);
  const handleSealSuccess = (newExperience: Experience) => {
    setProfile(prevProfile => {
      if (!prevProfile) return null;
      return {
        ...prevProfile,
        experiences: [...(prevProfile.experiences || []), newExperience],
      };
    });
    invalidateProfiles();
  };
  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };
  if (loading) {
    return (
      <div className="max-w-2xl mx-auto flex flex-col items-center space-y-6">
        <Skeleton className="h-32 w-32 rounded-full" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-5 w-32" />
        <div className="w-full space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-10 w-10 rounded-md" />
          <Skeleton className="h-10 w-10 rounded-md" />
          <Skeleton className="h-10 w-10 rounded-md" />
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-destructive">Profile Not Found</h2>
        <p className="text-muted-foreground mt-2">{error}</p>
      </div>
    );
  }
  if (!profile) return null;
  return (
    <>
      <motion.div
        className="max-w-2xl mx-auto flex flex-col items-center text-center space-y-6"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div variants={itemVariants}>
          <Avatar className="w-32 h-32 border-4 border-background shadow-lg">
            <AvatarImage src={profile.avatarUrl} alt={profile.displayName} />
            <AvatarFallback className="text-5xl">{getInitials(profile.displayName)}</AvatarFallback>
          </Avatar>
        </motion.div>
        <motion.div variants={itemVariants} className="space-y-2">
          <div className="flex items-center justify-center gap-3">
            <h1 className="text-4xl font-bold font-display">{profile.displayName}</h1>
            {profile.accountType === 'company' && (
              <Badge variant="secondary" className="gap-1.5">
                <Building className="h-3 w-3" />
                Company
              </Badge>
            )}
          </div>
          <p className="text-lg text-muted-foreground">@{profile.username}</p>
        </motion.div>
        <motion.p variants={itemVariants} className="text-base text-foreground max-w-prose">{profile.bio}</motion.p>
        <motion.div variants={itemVariants} className="flex items-center justify-center gap-4 pt-2">
          {profile.links && Object.values(profile.links).some(link => link) && (
            <TooltipProvider>
              {profile.links.website && (
                <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" asChild className="transition-transform hover:scale-110 active:scale-95"><a href={profile.links.website} target="_blank" rel="noopener noreferrer"><Globe className="h-5 w-5" /></a></Button></TooltipTrigger><TooltipContent><p>Website</p></TooltipContent></Tooltip>
              )}
              {profile.links.github && (
                <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" asChild className="transition-transform hover:scale-110 active:scale-95"><a href={profile.links.github} target="_blank" rel="noopener noreferrer"><Github className="h-5 w-5" /></a></Button></TooltipTrigger><TooltipContent><p>GitHub</p></TooltipContent></Tooltip>
              )}
              {profile.links.twitter && (
                <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" asChild className="transition-transform hover:scale-110 active:scale-95"><a href={profile.links.twitter} target="_blank" rel="noopener noreferrer"><Twitter className="h-5 w-5" /></a></Button></TooltipTrigger><TooltipContent><p>Twitter / X</p></TooltipContent></Tooltip>
              )}
              {profile.links.linkedin && (
                <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" asChild className="transition-transform hover:scale-110 active:scale-95"><a href={profile.links.linkedin} target="_blank" rel="noopener noreferrer"><Linkedin className="h-5 w-5" /></a></Button></TooltipTrigger><TooltipContent><p>LinkedIn</p></TooltipContent></Tooltip>
              )}
            </TooltipProvider>
          )}
          {canSealBio && (
            <Button onClick={() => setIsSealDialogOpen(true)}>
              <Award className="mr-2 h-4 w-4" />
              Seal Bio
            </Button>
          )}
        </motion.div>
        {profile.experiences && profile.experiences.length > 0 && (
          <motion.div variants={itemVariants} className="w-full text-left pt-8">
            <Separator />
            <Accordion type="single" collapsible defaultValue="item-1" className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>
                  <div className="flex items-center gap-2 text-2xl font-bold font-display">
                    <Briefcase className="h-6 w-6" />
                    Work Experience
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-4">
                    {profile.experiences.map((exp, index) => (
                      <ExperienceCard key={index} experience={exp} />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </motion.div>
        )}
      </motion.div>
      {canSealBio && (
        <SealBioDialog
          isOpen={isSealDialogOpen}
          onOpenChange={setIsSealDialogOpen}
          personHandle={profile.username}
          onSealSuccess={handleSealSuccess}
        />
      )}
    </>
  );
}
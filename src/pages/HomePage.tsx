import React from 'react';
import { Link } from 'react-router-dom';
import { motion, Variants } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ProfileCard } from '@/components/ProfileCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Search, Users } from 'lucide-react';
import { useProfileStore } from '@/stores/profileStore';
import { FeaturedProfileCard } from '@/components/FeaturedProfileCard';
export function HomePage() {
  const { profiles, loading, fetchProfiles } = useProfileStore();
  const [searchTerm, setSearchTerm] = React.useState('');
  React.useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);
  const featuredProfiles = React.useMemo(() => profiles.slice(0, 3), [profiles]);
  const filteredProfiles = React.useMemo(() => {
    if (!searchTerm) {
      return profiles;
    }
    return profiles.filter(profile =>
      profile.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.username.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [profiles, searchTerm]);
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };
  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 },
    },
  };
  return (
    <div className="space-y-20 md:space-y-28">
      <motion.section
        className="text-center"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.h1
          variants={itemVariants}
          className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl font-display"
        >
          Craft Your <span className="text-primary">Digital Identity</span>
        </motion.h1>
        <motion.p
          variants={itemVariants}
          className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground sm:text-xl"
        >
          Create and share a beautiful, modern bio profile in minutes. Clean, simple, and fast. Your personal corner of the internet awaits.
        </motion.p>
        <motion.div
          variants={itemVariants}
          className="mt-8 flex justify-center gap-4"
        >
          <Button size="lg" asChild className="transition-transform active:scale-95 hover:scale-105">
            <Link to="/auth">Create Your Profile</Link>
          </Button>
        </motion.div>
      </motion.section>
      {loading || featuredProfiles.length > 0 ? (
        <motion.section
          id="featured"
          className="space-y-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={containerVariants}
        >
          <motion.div variants={itemVariants} className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-display">Featured Creators</h2>
            <p className="mt-4 max-w-xl mx-auto text-muted-foreground">
              Get inspired by some of the amazing profiles on theirBio.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex flex-col sm:flex-row items-center gap-6 p-6 border rounded-lg">
                  <Skeleton className="h-24 w-24 rounded-full flex-shrink-0" />
                  <div className="space-y-3 w-full">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                </div>
              ))
            ) : (
              featuredProfiles.map(profile => (
                <motion.div key={profile.username} variants={itemVariants}>
                  <FeaturedProfileCard profile={profile} />
                </motion.div>
              ))
            )}
          </div>
        </motion.section>
      ) : null}
      <motion.section
        id="profiles"
        className="space-y-8"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={containerVariants}
      >
        <motion.div variants={itemVariants} className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-display">
            Explore All ({filteredProfiles.length}) Profiles
          </h2>
          <p className="mt-4 max-w-xl mx-auto text-muted-foreground">
            Discover the entire community. Find friends, colleagues, and new connections.
          </p>
        </motion.div>
        <motion.div variants={itemVariants} className="max-w-xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by name or username..."
              className="w-full pl-10 h-12 text-base"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </motion.div>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center space-y-4 p-6 border rounded-lg">
                <Skeleton className="h-24 w-24 rounded-full" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-12 w-full" />
              </div>
            ))}
          </div>
        ) : filteredProfiles.length > 0 ? (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8"
            variants={containerVariants}
          >
            {filteredProfiles.map((profile) => (
              <motion.div key={profile.username} variants={itemVariants}>
                <ProfileCard profile={profile} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <Users className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-xl font-semibold text-foreground">
              {searchTerm ? `No profiles found for "${searchTerm}"` : "No Profiles Yet"}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {searchTerm ? "Try a different search term." : "Be the first to create a profile on theirBio!"}
            </p>
            {!searchTerm && (
              <Button asChild className="mt-4">
                <Link to="/auth">Create a Profile</Link>
              </Button>
            )}
          </div>
        )}
      </motion.section>
    </div>
  );
}
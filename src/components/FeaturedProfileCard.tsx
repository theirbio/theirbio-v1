import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Globe, Github, Linkedin, Twitter, Building } from 'lucide-react';
import type { Profile } from '@shared/types';
import { Badge } from '@/components/ui/badge';
interface FeaturedProfileCardProps {
  profile: Profile;
}
export function FeaturedProfileCard({ profile }: FeaturedProfileCardProps) {
  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };
  const hasLinks = profile.links && Object.values(profile.links).some(link => link);
  const handleLinkClick = (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    e.preventDefault();
    window.open(url, '_blank', 'noopener,noreferrer');
  };
  return (
    <Link to={`/${profile.username}`} className="block group">
      <Card className="h-full transition-all duration-300 ease-in-out group-hover:shadow-xl group-hover:-translate-y-1.5 border-2 border-transparent group-hover:border-primary/50 overflow-hidden">
        <CardContent className="p-6 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-6">
          <Avatar className="w-24 h-24 border-4 border-background group-hover:border-primary/20 transition-colors duration-300 flex-shrink-0">
            <AvatarImage src={profile.avatarUrl} alt={profile.displayName} />
            <AvatarFallback className="text-3xl">{getInitials(profile.displayName)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col justify-between h-full w-full">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h3 className="text-2xl font-bold font-display text-foreground group-hover:text-primary transition-colors duration-300">{profile.displayName}</h3>
                {profile.accountType === 'company' && (
                  <Badge variant="secondary" className="gap-1.5 self-center sm:self-auto">
                    <Building className="h-3 w-3" />
                    Company
                  </Badge>
                )}
              </div>
              <p className="text-md text-muted-foreground">@{profile.username}</p>
              <p className="mt-3 text-foreground/80 text-sm line-clamp-3 min-h-[60px]">
                {profile.bio}
              </p>
            </div>
            {hasLinks && (
              <div className="flex items-center justify-center sm:justify-start gap-2 pt-4 mt-auto">
                {profile.links?.website && (
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" onClick={(e) => handleLinkClick(e, profile.links!.website!)}>
                    <Globe className="h-4 w-4" />
                  </Button>
                )}
                {profile.links?.github && (
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" onClick={(e) => handleLinkClick(e, profile.links!.github!)}>
                    <Github className="h-4 w-4" />
                  </Button>
                )}
                {profile.links?.twitter && (
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" onClick={(e) => handleLinkClick(e, profile.links!.twitter!)}>
                    <Twitter className="h-4 w-4" />
                  </Button>
                )}
                {profile.links?.linkedin && (
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" onClick={(e) => handleLinkClick(e, profile.links!.linkedin!)}>
                    <Linkedin className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
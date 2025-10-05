import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Link } from 'react-router-dom';
import type { Profile } from '@shared/types';
import { Badge } from '@/components/ui/badge';
import { Building } from 'lucide-react';
interface ProfileCardProps {
  profile: Profile;
}
export function ProfileCard({ profile }: ProfileCardProps) {
  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };
  return (
    <Link to={`/${profile.username}`} className="block group">
      <Card className="h-full transition-all duration-300 ease-in-out group-hover:shadow-xl group-hover:-translate-y-1.5 border-2 border-transparent group-hover:border-primary">
        <CardHeader className="flex flex-col items-center text-center p-6">
          <Avatar className="w-24 h-24 mb-4 border-4 border-background group-hover:border-primary/20 transition-colors duration-300">
            <AvatarImage src={profile.avatarUrl} alt={profile.displayName} />
            <AvatarFallback className="text-3xl">{getInitials(profile.displayName)}</AvatarFallback>
          </Avatar>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors duration-300">{profile.displayName}</h3>
            {profile.accountType === 'company' && (
              <Badge variant="secondary" className="gap-1 text-xs">
                <Building className="h-3 w-3" />
                Company
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">@{profile.username}</p>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <p className="text-center text-muted-foreground text-sm line-clamp-3">
            {profile.bio}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
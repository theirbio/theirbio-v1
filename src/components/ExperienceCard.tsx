import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Calendar } from 'lucide-react';
import type { Experience } from '@shared/types';
import { formatDistanceToNow } from 'date-fns';
interface ExperienceCardProps {
  experience: Experience;
}
export function ExperienceCard({ experience }: ExperienceCardProps) {
  const getInitials = (name?: string) => {
    if (!name) return 'C';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };
  return (
    <Card className="transition-all duration-300 border-2 border-transparent hover:border-primary/50 hover:shadow-lg">
      <CardHeader>
        <div className="flex justify-between items-start gap-4">
          <div>
            <CardTitle className="text-xl font-semibold">{experience.role}</CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <Calendar className="h-4 w-4" />
              <span>{experience.period}</span>
            </div>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link to={`/${experience.sealedByOrgId}`}>
                  <Badge variant="secondary" className="gap-2 py-1 px-3">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={experience.sealedByOrgAvatarUrl} alt={experience.sealedByOrgName} />
                      <AvatarFallback className="text-xs">{getInitials(experience.sealedByOrgName)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">Sealed by {experience.sealedByOrgName}</span>
                  </Badge>
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>Attested {formatDistanceToNow(new Date(experience.sealedAt), { addSuffix: true })}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      {experience.description && (
        <CardContent>
          <p className="text-muted-foreground">{experience.description}</p>
        </CardContent>
      )}
    </Card>
  );
}
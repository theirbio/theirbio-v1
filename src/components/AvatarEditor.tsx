import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Dices } from 'lucide-react';
import { toast } from 'sonner';
interface AvatarEditorProps {
  currentAvatarUrl: string;
  displayName: string;
  onAvatarChange: (newUrl: string) => void;
}
export function AvatarEditor({ currentAvatarUrl, displayName, onAvatarChange }: AvatarEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [urlInput, setUrlInput] = useState(currentAvatarUrl);
  const [randomAvatarUrl, setRandomAvatarUrl] = useState('');
  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };
  const generateRandomAvatar = () => {
    const seed = crypto.randomUUID();
    const newUrl = `https://api.dicebear.com/8.x/lorelei/svg?seed=${seed}`;
    setRandomAvatarUrl(newUrl);
  };
  const handleSaveFromUrl = () => {
    try {
      // Basic URL validation
      new URL(urlInput);
      onAvatarChange(urlInput);
      toast.success('Avatar updated!');
      setIsOpen(false);
    } catch (error) {
      toast.error('Please enter a valid URL.');
    }
  };
  const handleUseRandom = () => {
    if (randomAvatarUrl) {
      onAvatarChange(randomAvatarUrl);
      setUrlInput(randomAvatarUrl);
      toast.success('Avatar updated!');
      setIsOpen(false);
    }
  };
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div className="relative group w-24 h-24 cursor-pointer">
          <Avatar className="w-24 h-24 border-4 border-background shadow-md">
            <AvatarImage src={currentAvatarUrl} alt={displayName} />
            <AvatarFallback className="text-3xl">{getInitials(displayName)}</AvatarFallback>
          </Avatar>
          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Camera className="text-white h-8 w-8" />
          </div>
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Avatar</DialogTitle>
          <DialogDescription>
            Update your profile picture. You can use a URL or generate a random one.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="url" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="url">From URL</TabsTrigger>
            <TabsTrigger value="generate">Generate</TabsTrigger>
          </TabsList>
          <TabsContent value="url">
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="avatar-url">Image URL</Label>
                <Input
                  id="avatar-url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/image.png"
                />
              </div>
              <Button onClick={handleSaveFromUrl} className="w-full">Save Avatar</Button>
            </div>
          </TabsContent>
          <TabsContent value="generate">
            <div className="space-y-4 py-4 flex flex-col items-center">
              <Avatar className="w-32 h-32 border-4 border-background shadow-lg">
                <AvatarImage src={randomAvatarUrl || currentAvatarUrl} />
                <AvatarFallback className="text-5xl">{getInitials(displayName)}</AvatarFallback>
              </Avatar>
              <Button variant="outline" onClick={generateRandomAvatar}>
                <Dices className="mr-2 h-4 w-4" />
                Generate New Avatar
              </Button>
              <Button onClick={handleUseRandom} disabled={!randomAvatarUrl} className="w-full">
                Use This Avatar
              </Button>
            </div>
          </TabsContent>
        </Tabs>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { socialLinks } from '@/lib/stay-connected-data';
import { ArrowUpRight, FileText, Image, MessageSquare } from 'lucide-react';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';

interface StayConnectedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ChannelsTab = () => {
    const featuredLinks = socialLinks.filter(link => link.featured);
    const regularLinks = socialLinks.filter(link => !link.featured);

    return (
        <div className="space-y-6">
             {featuredLinks.length > 0 && (
            <div className="space-y-4">
                <h3 className="font-bold text-xl gradient-text">Featured Content</h3>
                {featuredLinks.map(link => {
                     const Icon = link.icon;
                     return (
                        <a href={link.url} target="_blank" rel="noopener noreferrer" key={link.id} className="block">
                            <Card className="glassmorphic interactive-element flex flex-col md:flex-row overflow-hidden">
                                <div className="md:w-2/5 h-48 md:h-auto bg-cover bg-center flex items-center justify-center p-4" data-ai-hint="youtube video thumbnail">
                                   <div className="bg-background/50 backdrop-blur-sm rounded-lg p-6">
                                       <Icon className="h-16 w-16 text-primary" />
                                   </div>
                                </div>
                                <div className="md:w-3/5 p-6 flex flex-col">
                                    <Badge className={cn("w-fit mb-2", link.color)}>{link.activity}</Badge>
                                    <CardTitle>{link.title}</CardTitle>
                                    <p className="text-sm text-muted-foreground mt-2 flex-grow">{link.description}</p>
                                    <p className="text-xs text-muted-foreground mt-4">Live feed widget coming soon...</p>
                                </div>
                            </Card>
                        </a>
                     )
                })}
            </div>
          )}
          
          <Separator />

          {/* Regular Links Section */}
          <div>
            <h3 className="font-bold text-xl gradient-text mb-4">All Channels</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {regularLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <a href={link.url} target="_blank" rel="noopener noreferrer" key={link.id} className="block h-full">
                    <Card className="glassmorphic interactive-element h-full flex flex-col">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Icon className="h-6 w-6 text-primary" />
                          <div className="flex-1">{link.title}</div>
                           {link.activity && <Badge className={cn("whitespace-nowrap", link.color)}>{link.activity}</Badge>}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex-grow flex flex-col">
                        <p className="text-sm text-muted-foreground flex-grow">{link.description}</p>
                        <Button variant="ghost" size="sm" className="text-xs text-primary p-0 h-auto self-start mt-4">
                          Visit Link <ArrowUpRight className="ml-1 h-3 w-3" />
                        </Button>
                      </CardContent>
                    </Card>
                  </a>
                );
              })}
            </div>
          </div>
        </div>
    )
}

const ContentHubTab = () => (
    <div className="text-center">
        <h3 className="text-lg font-semibold">Community Content Hub</h3>
        <p className="text-muted-foreground">This feature is under development. Soon, this area will aggregate content from all platforms, showing recent blog posts, user-submitted trade setups, and top forum discussions.</p>
    </div>
);

const SubmitContentTab = () => (
    <div className="max-w-2xl mx-auto space-y-4">
        <h3 className="text-lg font-semibold">Submit Your Content</h3>
        <p className="text-muted-foreground text-sm">Want to be featured? Share your best trade of the week, a detailed analysis, or a success story. Submissions may be highlighted on our blog or social channels.</p>
         <div className="space-y-2">
            <Label htmlFor="submission-title">Title / Subject</Label>
            <Input id="submission-title" placeholder="e.g., My Best EURUSD Trade This Week" />
         </div>
         <div className="space-y-2">
            <Label htmlFor="submission-description">Description / Analysis</Label>
            <Textarea id="submission-description" placeholder="Explain your trade, strategy, and what made it successful..." rows={6}/>
         </div>
         <div className="space-y-2">
            <Label htmlFor="submission-file">Attach Image or File</Label>
            <Input id="submission-file" type="file" />
         </div>
         <Button>Submit for Review</Button>
    </div>
)


const StayConnectedDialog = ({ open, onOpenChange }: StayConnectedDialogProps) => {

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glassmorphic sm:max-w-5xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Stay Connected & Community Hub</DialogTitle>
          <DialogDescription>
            Join our community across various platforms to get the latest updates, tips, and support.
          </DialogDescription>
        </DialogHeader>
         <Tabs defaultValue="channels" className="w-full flex-1 min-h-0 flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="channels"><MessageSquare className="mr-2"/> Channels</TabsTrigger>
                <TabsTrigger value="hub"><Image className="mr-2"/> Content Hub</TabsTrigger>
                <TabsTrigger value="submit"><FileText className="mr-2"/> Submit Content</TabsTrigger>
            </TabsList>
            <div className="flex-1 overflow-y-auto pr-4 -mr-6 pl-6 pt-4">
                <TabsContent value="channels">
                    <ChannelsTab />
                </TabsContent>
                <TabsContent value="hub">
                    <ContentHubTab />
                </TabsContent>
                <TabsContent value="submit">
                    <SubmitContentTab />
                </TabsContent>
            </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default StayConnectedDialog;

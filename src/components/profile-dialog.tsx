
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { useUser } from '@/firebase';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Copy, Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DetailItem = ({ label, value }: { label: string, value: string | React.ReactNode }) => (
    <div className="flex justify-between items-center text-sm py-2 border-b border-border/20 last:border-b-0">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold text-right">{value}</span>
    </div>
);

const ProfileDialog = ({ open, onOpenChange }: ProfileDialogProps) => {
    const { user } = useUser();
    const { toast } = useToast();
    const router = useRouter();

    if (!user) return null;

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: 'Copied to clipboard!' });
    };

    const handleEditProfile = () => {
        onOpenChange(false);
        router.push('/profile');
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="glassmorphic sm:max-w-md">
                <DialogHeader className="text-center items-center">
                    <Avatar className="h-24 w-24 mb-4">
                        <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} />
                        <AvatarFallback>{user.displayName?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <DialogTitle className="text-xl">{user.displayName || 'User Profile'}</DialogTitle>
                    <DialogDescription>{user.email}</DialogDescription>
                </DialogHeader>
                <Card className="bg-muted/30">
                    <CardContent className="p-4 space-y-2">
                        <DetailItem label="User ID" value={
                            <div className="flex items-center gap-2">
                                <span className="truncate max-w-[120px] font-mono">{user.uid}</span>
                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleCopy(user.uid)}>
                                    <Copy className="h-3 w-3"/>
                                </Button>
                            </div>
                        }/>
                        <DetailItem label="Subscription" value={<Badge variant="secondary">Pro Plan</Badge>} />
                        <DetailItem label="Expires" value="Never" />
                        <DetailItem label="Joined" value={user.metadata.creationTime ? format(new Date(user.metadata.creationTime), 'dd/MM/yyyy') : 'N/A'} />
                        <DetailItem label="Last Login" value={user.metadata.lastSignInTime ? format(new Date(user.metadata.lastSignInTime), 'dd/MM/yyyy p') : 'N/A'} />
                    </CardContent>
                </Card>
                <DialogFooter>
                    <Button variant="outline" onClick={handleEditProfile}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit Profile
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ProfileDialog;

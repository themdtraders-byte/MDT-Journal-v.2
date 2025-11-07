
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useAuth } from '@/firebase';
import { updateProfile } from 'firebase/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Camera, Calendar as CalendarIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { countries } from '@/lib/countries';
import { compressImage } from '@/lib/image-helpers';
import { LoadingLogo } from '@/components/LoadingLogo';
import { Combobox } from '@/components/ui/combobox';

export default function ProfilePage() {
    const { user, isUserLoading } = useUser();
    const auth = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const [name, setName] = useState('');
    const [dob, setDob] = useState<Date | undefined>();
    const [gender, setGender] = useState('');
    const [country, setCountry] = useState('');
    const [profilePic, setProfilePic] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.replace('/login');
        }
        if (user) {
            setName(user.displayName || '');
            setProfilePic(user.photoURL || null);
        }
    }, [user, isUserLoading, router]);

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            try {
                const compressedSrc = await compressImage(file, 0.8);
                setProfilePic(compressedSrc);
            } catch (error) {
                toast({ title: "Image Upload Failed", description: "Could not process image.", variant: "destructive" });
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !auth || !auth.currentUser) {
            toast({ title: "Authentication Error", description: "You must be signed in.", variant: "destructive" });
            return;
        }
        if (!name || !dob || !gender || !country) {
            toast({ title: "Missing Fields", description: "Please fill out all fields.", variant: "destructive" });
            return;
        }

        setIsLoading(true);

        try {
            // Use the existing photoURL from the user object if no new picture was selected.
            // A new local picture (data URI) won't be saved yet, but this prevents errors.
            const finalPhotoURL = profilePic && profilePic.startsWith('http') 
              ? profilePic 
              : auth.currentUser.photoURL;

            await updateProfile(auth.currentUser, {
                displayName: name,
                photoURL: finalPhotoURL, 
            });
            
            // In a real app, you would save DOB, Gender, Country to a user document in Firestore.
            // For this simulation, we'll assume the profile is complete after this step.

            toast({ title: "Profile Created!", description: "Welcome! Let's get you set up with a journal." });
            router.replace('/selector');

        } catch (error: any) {
            toast({ title: "Profile Update Failed", description: error.message, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };
    
    if (isUserLoading || isLoading) {
        return (
             <div className="flex h-screen w-screen items-center justify-center bg-black">
                <LoadingLogo />
            </div>
        )
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-background p-4">
            <Card className="w-full max-w-lg glassmorphic">
                <CardHeader>
                    <CardTitle>Create Your Trading Profile</CardTitle>
                    <CardDescription>Tell us a bit about yourself. This information will personalize your experience.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="flex flex-col items-center space-y-4">
                            <div className="relative">
                                <Avatar className="h-24 w-24">
                                    <AvatarImage src={profilePic || undefined} alt={name} />
                                    <AvatarFallback>{name ? name.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
                                </Avatar>
                                <Button
                                    type="button"
                                    size="icon"
                                    className="absolute bottom-0 right-0 rounded-full h-8 w-8"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Camera className="h-4 w-4" />
                                </Button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., John Doe" />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Date of Birth</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="w-full justify-start font-normal h-8">
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {dob ? format(dob, 'PPP') : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={dob}
                                            onSelect={setDob}
                                            initialFocus
                                            captionLayout="dropdown-buttons"
                                            fromYear={1950}
                                            toYear={new Date().getFullYear() - 10}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="gender">Gender</Label>
                                <Select onValueChange={setGender} value={gender}>
                                    <SelectTrigger id="gender" className="h-8"><SelectValue placeholder="Select..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Male">Male</SelectItem>
                                        <SelectItem value="Female">Female</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                        <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="country">Country</Label>
                            <Combobox
                                options={countries.map(c => ({ value: c.name, label: c.name }))}
                                value={country}
                                onChange={setCountry}
                                placeholder="Select your country..."
                            />
                        </div>
                        
                        <Button type="submit" className="w-full">
                            Complete Profile
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

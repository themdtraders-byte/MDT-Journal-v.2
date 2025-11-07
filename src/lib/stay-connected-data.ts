
import { Youtube, Twitter, Facebook, Instagram, Linkedin, LucideIcon, Rss, BookUser, Bot, GitBranch, Github, LifeBuoy, Globe, MessageSquare, GraduationCap, Mail } from "lucide-react";

export interface SocialLink {
  id: string;
  title: string;
  description: string;
  url: string;
  icon: LucideIcon;
  featured?: boolean;
  activity?: string;
  color?: string;
}

export const socialLinks: SocialLink[] = [
  {
    id: "youtube-main",
    title: "The MD Traders",
    description: "Subscribe for tutorials, market analysis, and feature updates.",
    url: "https://www.youtube.com/@TheMDTraders",
    icon: Youtube,
    featured: true,
    activity: "New Video: Mastering Risk",
    color: "bg-red-500/20 text-red-500",
  },
   {
    id: "youtube-live",
    title: "Live Trading Channel",
    description: "Watch live trading sessions and see our strategies in action.",
    url: "https://www.youtube.com",
    icon: Youtube,
    activity: "Live Now",
    color: "bg-red-500/20 text-red-500",
  },
   {
    id: "youtube-tutorials",
    title: "Tutorials Channel",
    description: "Short, focused tutorials on specific trading concepts and platform features.",
    url: "https://www.youtube.com",
    icon: Youtube,
     activity: "New Tutorial Added",
    color: "bg-red-500/20 text-red-500",
  },
   {
    id: "website",
    title: "Our Website",
    description: "Visit our official website for more information about our services.",
    url: "https://www.themdtraders.com",
    icon: Globe,
  },
  {
    id: "whatsapp",
    title: "WhatsApp Channel",
    description: "Join our WhatsApp channel for instant updates and trade alerts.",
    url: "https://whatsapp.com/channel/your-channel-id",
    icon: MessageSquare,
     activity: "Announcements",
    color: "bg-green-500/20 text-green-500",
  },
  {
    id: "discord",
    title: "Discord Community",
    description: "Join our active Discord server to chat with other traders and our team.",
    url: "https://discord.gg/your-invite",
    icon: MessageSquare,
     activity: "30+ Active",
    color: "bg-indigo-500/20 text-indigo-500",
  },
  {
    id: "twitter",
    title: "X (Twitter)",
    description: "Follow us for real-time updates, trading tips, and community news.",
    url: "https://www.twitter.com",
    icon: Twitter,
    activity: "Live Now",
    color: "bg-sky-500/20 text-sky-500",
  },
  {
    id: "courses",
    title: "Join our Courses",
    description: "Ready to take your trading to the next level? Enroll in our courses.",
    url: "https://courses.themdtraders.com",
    icon: GraduationCap,
  },
   {
    id: "email",
    title: "Email for Inquiry",
    description: "Have a question or a business inquiry? Send us an email.",
    url: "mailto:support@themdtraders.com",
    icon: Mail,
  },
  {
    id: "instagram",
    title: "Instagram",
    description: "See behind-the-scenes content, success stories, and motivational posts.",
    url: "https://www.instagram.com",
    icon: Instagram,
    activity: "New Post",
     color: "bg-pink-500/20 text-pink-500",
  },
];

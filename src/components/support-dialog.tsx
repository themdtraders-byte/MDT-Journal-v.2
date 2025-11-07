
'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Bot, ChevronRight, FileText, HelpCircle, Search, Send, Ticket, Upload, Users, LifeBuoy, FileQuestion, MessageSquare, Loader } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';
import { getSupportResponse, type SupportAssistantOutput } from '@/ai/flows/support-assistant';
import { COMMUNITY_FORUM_URL } from '@/lib/data';
import { useJournalStore } from '@/hooks/use-journal-store';

interface SupportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Message = {
    from: 'user' | 'bot';
    text: string;
    action?: SupportAssistantOutput['action'];
};


// --- Assistant ---
const AssistantTab = ({ onOpenChange }: { onOpenChange: (open: boolean) => void }) => {
    const router = useRouter();
    const pathname = usePathname();
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { from: 'bot', text: 'Hello! How can I help you today? You can ask me about features, how to perform actions, or for general help.' }
    ]);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage: Message = { from: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        
        try {
            const botResponse = await getSupportResponse({ query: input, currentPath: pathname });
            const botMessage: Message = { 
                from: 'bot', 
                text: botResponse.response,
                action: botResponse.action,
            };
            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error("AI support failed:", error);
            const errorMessage: Message = {
                from: 'bot',
                text: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment."
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    }
    
    useEffect(() => {
        if(scrollAreaRef.current) {
             scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [messages]);
    
    const handleActionClick = (path?: string) => {
        if (path) {
            router.push(path);
            onOpenChange(false); 
        }
    }


    return (
         <div className="flex flex-col h-full">
            <ScrollArea className="flex-1 -mx-6 px-6" ref={scrollAreaRef as any}>
                <div className="space-y-4 pr-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={cn("flex items-start gap-3", msg.from === 'bot' ? '' : 'justify-end')}>
                            {msg.from === 'bot' && <div className="bg-primary/20 p-2 rounded-full"><Bot className="h-5 w-5 text-primary" /></div>}
                            <div className={cn("max-w-xs md:max-w-md rounded-lg px-4 py-2", msg.from === 'bot' ? 'bg-muted' : 'bg-primary text-primary-foreground')}>
                                <p className="text-sm">{msg.text}</p>
                                {msg.action?.label && msg.action.path && (
                                    <Button size="sm" variant="secondary" className="mt-2" onClick={() => handleActionClick(msg.action?.path)}>
                                        {msg.action.label} <ChevronRight className="h-4 w-4 ml-1"/>
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex items-start gap-3">
                            <div className="bg-primary/20 p-2 rounded-full"><Bot className="h-5 w-5 text-primary" /></div>
                            <div className="max-w-xs md:max-w-md rounded-lg px-4 py-2 bg-muted flex items-center">
                                <Loader className="h-5 w-5 animate-spin text-muted-foreground" />
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>
             <div className="mt-4 flex items-center gap-2">
                <Input 
                    placeholder="Ask the assistant..." 
                    value={input} 
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    disabled={isLoading}
                />
                <Button onClick={handleSend} disabled={isLoading}><Send className="h-4 w-4"/></Button>
            </div>
        </div>
    )
}

// --- FAQs ---
const faqData = [
    {
        category: "Getting Started",
        questions: [
            { q: "What is MD Journal?", a: "MD Journal is a comprehensive trading journal designed for disciplined traders. It helps you log, analyze, and improve your trading performance through detailed data tracking, performance analytics, and disciplined execution tools." },
            { q: "How do I create a new journal?", a: "On the initial startup screen, click 'Create New Journal'. You'll be prompted to give it a title, select a type (e.g., Real, Demo, Funded), and set an initial deposit. You can also create new journals from the 'Account Management' dialog." },
            { q: "Can I have multiple journals?", a: "Yes, you can create as many journals as you need. This is useful for separating different trading accounts, strategies, or backtesting sessions." },
            { q: "What do the different journal types mean?", a: "'Real' is for live trading accounts. 'Demo' is for practice. 'Funded' is for prop firm accounts. 'Backtest' is for strategy testing. 'Competition' is for trading competitions. 'Other' is for anything else." },
            { q: "How do I switch between journals?", a: "You can switch between journals from the 'All Journals' section within the Account Management dialog, accessible via the user icon in the header." },
            { q: "Is my data stored online?", a: "MD Journal is designed to work locally first, storing all your data securely on your device. This means it's fast and private. Future updates may include optional cloud synchronization." },
            { q: "What do I do if I forget my password?", a: "Currently, MD Journal does not have user accounts in the traditional sense and stores data locally. There is no password to forget. Access is based on your device." },
        ]
    },
    {
        category: "Trade Logging & Data",
        questions: [
            { q: "How do I log a new trade?", a: "Click the '+ Add Trade' button in the main header. This opens an 8-step dialog where you can input all the details about your trade, from timestamps and pair to analysis and sentiment." },
            { q: "Can I import trades from MT4/MT5?", a: "Yes. Go to the Journal Actions menu (book icon in the header) and select 'Import / Export'. You can paste your terminal's trade history directly or upload a supported file like CSV or JSON." },
            { q: "What formats can I import?", a: "The importer is designed to be flexible. It works best with tab-separated data from MetaTrader terminals but can also parse standard CSV and JSON files if they contain the necessary columns (like pair, price, time, etc.)." },
            { q: "Can I edit a trade after logging it?", a: "Yes. In the 'Data > Table' view, you can find the trade you wish to edit and click the 'View' or 'Edit' action button (feature coming soon) to modify its details." },
            { q: "How do I delete multiple trades?", a: "In the 'Data > Table' view, use the checkboxes to select the trades you want to remove. A context menu will appear at the top of the table with a 'Delete' button." },
            { q: "What does merging trades do?", a: "Merging is useful for combining multiple partial entries or exits into a single trade record. To merge, select at least two trades in the Data Table. The system will average the prices and sum the lot sizes. All selected trades must have the same pair and direction to be merged." },
            { q: "How do I record a deposit or withdrawal?", a: "Go to the Journal Actions menu (book icon) -> 'Deposit / Withdrawal'. You can record the amount, date, and a note. This helps maintain an accurate balance and capital history." },
            { q: "What is the Data Auditor?", a: "The Data Auditor (check square icon in the header) scans all your trades for calculation inconsistencies. If it finds a discrepancy between the stored P/L or R:R and what it should be, it will flag it and allow you to apply a correction." },
        ]
    },
    {
        category: "Performance & Analytics",
        questions: [
            { q: "What is the Equity Curve?", a: "Found in 'Performance > Chart', the Equity Curve is a visual representation of your account balance over time, showing your growth and drawdowns." },
            { q: "How does the AI Analytics feature work?", a: "On the 'Performance > Analytics' page, you can click 'Analyze My Trades'. The AI assistant will process your entire trade history to identify your best and worst performing strategies, pairs, and sessions, and provide actionable recommendations." },
            { q: "What is the Monte Carlo Simulator?", a: "Located in 'Performance > Simulator', the Monte Carlo simulator uses your historical win rate, average win, and average loss to run thousands of possible future scenarios, helping you understand the statistical probabilities of your strategy's future performance." },
            { q: "How do I use the Strategy Backtester?", a: "In 'Performance > Simulator', you can create a set of rules (e.g., 'Pair is EURUSD' and 'Direction is Buy'). The engine then filters your trade history to show you how that specific strategy would have performed, complete with its own equity curve and key metrics." },
            { q: "What is the difference between Capital and Balance on the dashboard?", a: "Capital is your initial deposit plus or minus any deposits and withdrawals. Balance is your current equity, including the P/L from all closed trades. Balance fluctuates with trading; Capital only changes with fund movements." },
            { q: "What is the 'Discipline Score'?", a: "The Discipline Score is a metric that grades each trade based on your adherence to your predefined Trading Plan and Strategy rules. A high score indicates you followed your plan, while a low score suggests you deviated." },
            { q: "What does 'Profit Factor' mean?", a: "Profit Factor is a key performance metric calculated by dividing your total gross profit by your total gross loss. A value greater than 1 indicates a profitable system. For example, a profit factor of 2 means you make $2 for every $1 you lose." },
            { q: "How is 'R Analytics' calculated?", a: "R represents your initial risk on a trade (the distance from your entry to your stop loss). R Analytics calculates your P/L in terms of 'R-multiples'. For example, if you risked $100 (1R) and made $200, your realized R for that trade is 2R." },
        ]
    },
    {
        category: "Plans & Strategies",
        questions: [
            { q: "What is the 'Trading Plan'?", a: "The 'Trading Plan' tab under 'Plans' is where you define your core, high-level rules. This includes your allowed trading hours, tradable instruments, and global risk limits like max daily loss." },
            { q: "What is a 'Strategy'?", a: "A 'Strategy' is a specific, named set of rules for taking a trade. You can create multiple strategies (e.g., 'London Killzone Scalp', '4H Swing Trade'). Each strategy has its own checklist for Bias, Point of Interest (POI), and Confirmation." },
            { q: "What are 'Execution Steps'?", a: "This is the most powerful feature. It's an interactive pre-trade checklist that guides you step-by-step. It validates the time and pair against your Trading Plan, then dynamically loads the rules from your selected Strategy, forcing you to confirm each criterion before you can execute." },
            { q: "How do I create a new Strategy?", a: "Go to 'Plans > Strategy', click 'New Strategy'. Give it a name and description, then use the Rule Builder to add specific conditions for your trade idea, POI, and entry confirmation." },
            { q: "Can the Execution Steps stop me from trading?", a: "While it can't physically stop you, it provides strong visual cues. If you are outside your trading hours or the selected pair is not in your plan, the checklist will not allow you to proceed to the next step, acting as a powerful disciplinary guardrail." },
        ]
    },
    {
        category: "Gamification & Leaderboard",
        questions: [
            { q: "What is the Gamification Center?", a: "Accessed via the trophy icon in the header, this is where you can view your achievements, badges, and quests. It's designed to make the process of disciplined trading more engaging and rewarding." },
            { q: "How does the Leaderboard work?", a: "The Leaderboard places you in a simulated competition against other 'traders' who are at a similar experience level. Your rank is determined by a total score calculated from your trading performance, consistency, and discipline." },
            { q: "Are the other traders on the leaderboard real?", a: "No, the other traders are AI-generated bots designed to provide a competitive and motivating environment. Your data is never shared." },
            { q: "How do I earn Achievements and Badges?", a: "Achievements are unlocked by reaching specific milestones (e.g., 'Log 100 Trades'). Badges are awarded for demonstrating specific skills or consistent behaviors (e.g., 'Risk Manager' badge for 50 trades within your risk limit)." },
            { q: "What are Quests?", a: "Quests are specific challenges designed to help you improve a certain aspect of your trading. For example, a quest might be 'Complete 5 trades with a discipline score over 90%'." },
        ]
    },
    {
        category: "Settings & Customization",
        questions: [
            { q: "How do I change the theme?", a: "Go to Settings (gear icon in the header) -> Theme. You can choose between Light, Dark, Forest, and Midnight modes, and also select an accent color." },
            { q: "What are Input Settings?", a: "In Settings -> App Manager -> Input Settings, you can customize the dropdown options used throughout the app, such as the list of Sentiments, Entry Reasons, Indicators, etc. You can add, remove, or reorder these items." },
            { q: "Can I customize the font?", a: "Yes. In Settings -> Visuals, you can change the font family and font size for the entire application to suit your preference." },
            { q: "How do I backup my data?", a: "In Settings -> App Manager -> Database & Data Management, you will find options to backup your entire journal data to a local file. It is highly recommended to do this regularly." },
            { q: "What if I accidentally delete a journal?", a: "If you have a backup file, you can use the 'Restore Data' function in the Database & Data Management settings to recover it. Otherwise, the data is permanently deleted from your device." },
        ]
    },
];

const popularQuestions = [
    faqData[0].questions[1], // How do I log my first trade?
    faqData[1].questions[1], // Can I import trades from MT4/MT5?
    faqData[3].questions[2], // What are 'Execution Steps'?
];

const FaqTab = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const filteredFaqs = faqData.map(category => ({
        ...category,
        questions: category.questions.filter(
            q => q.q.toLowerCase().includes(searchTerm.toLowerCase()) || q.a.toLowerCase().includes(searchTerm.toLowerCase())
        )
    })).filter(category => category.questions.length > 0);

    return (
        <ScrollArea className="h-full -mx-6 px-6">
            <div className="space-y-6 pr-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search FAQs..." 
                        className="pl-9"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                <div>
                    <h3 className="text-lg font-semibold mb-2">Most Popular Questions</h3>
                    <div className="space-y-2">
                        {popularQuestions.map((item, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm p-2 rounded-md hover:bg-muted/50 cursor-pointer">
                                <FileQuestion className="h-4 w-4 text-primary"/>
                                <span>{item.q}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <Accordion type="multiple" defaultValue={faqData.map(f => f.category)} className="w-full space-y-4">
                    {filteredFaqs.map(category => (
                        <AccordionItem key={category.category} value={category.category}>
                            <AccordionTrigger className="text-lg font-semibold">{category.category}</AccordionTrigger>
                            <AccordionContent className="space-y-2">
                                {category.questions.map((item, index) => (
                                    <Accordion key={index} type="single" collapsible>
                                        <AccordionItem value={item.q}>
                                            <AccordionTrigger className="text-sm">{item.q}</AccordionTrigger>
                                            <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
                                        </AccordionItem>
                                    </Accordion>
                                ))}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
                
                <div className="text-center">
                    <p className="text-muted-foreground">Can't find an answer?</p>
                    <a href={COMMUNITY_FORUM_URL} target="_blank" rel="noopener noreferrer">
                        <Button variant="link">Visit our Community Forum <ChevronRight className="h-4 w-4 ml-1"/></Button>
                    </a>
                </div>
            </div>
        </ScrollArea>
    )
}

// --- Tickets ---
const TicketTab = () => {
    const { activeJournal, addSupportTicket } = useJournalStore();
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');

    const ticketHistory = activeJournal?.supportTickets || [];
    
    const handleSubmit = () => {
        if (!subject.trim() || !message.trim()) {
            alert("Please fill out both subject and message.");
            return;
        }

        addSupportTicket(subject, message);
        
        const supportEmail = 'mdtradershelp1@gmail.com';
        const mailtoLink = `mailto:${supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
        window.location.href = mailtoLink;
        
        // Clear form
        setSubject('');
        setMessage('');
    }

    return (
         <ScrollArea className="h-full -mx-6 px-6">
            <div className="pr-4">
                <Tabs defaultValue="submit" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="submit">Submit a Ticket</TabsTrigger>
                        <TabsTrigger value="history">My Tickets</TabsTrigger>
                    </TabsList>
                    <TabsContent value="submit" className="mt-4 space-y-4">
                        <div>
                            <Label htmlFor="subject">Subject</Label>
                            <Input id="subject" value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g., Issue with Lot Size Calculator" />
                        </div>
                        <div>
                            <Label htmlFor="message">Detailed Message</Label>
                            <Textarea id="message" value={message} onChange={e => setMessage(e.target.value)} placeholder="Please describe your issue in as much detail as possible..." rows={8}/>
                        </div>
                        <div>
                            <Label htmlFor="attachment">Attach File or Screenshot (Optional)</Label>
                            <Input id="attachment" type="file" />
                            <p className="text-xs text-muted-foreground mt-1">
                                System info will be attached automatically if possible.
                            </p>
                        </div>
                        <div className="text-right">
                             <p className="text-xs text-muted-foreground mb-2 text-left">
                                This will open your default email client. You can also send an email manually to <span className="font-semibold text-primary">mdtradershelp1@gmail.com</span>.
                            </p>
                            <Button onClick={handleSubmit}>Submit Ticket via Email</Button>
                        </div>
                    </TabsContent>
                    <TabsContent value="history" className="mt-4">
                        <div className="border rounded-lg">
                        {ticketHistory.length > 0 ? ticketHistory.map(ticket => (
                            <div key={ticket.id} className="flex items-center justify-between p-4 border-b last:border-b-0">
                                <div>
                                    <p className="font-semibold">{ticket.subject} <span className="text-sm text-muted-foreground">#{ticket.id.slice(0,6)}</span></p>
                                    <p className="text-xs text-muted-foreground">Last updated: {new Date(ticket.lastUpdate).toLocaleDateString()}</p>
                                </div>
                                <Badge variant={
                                    ticket.status === 'Open' ? 'default' :
                                    ticket.status === 'Closed' ? 'secondary' :
                                    'outline'
                                }>{ticket.status}</Badge>
                            </div>
                        )) : (
                            <div className="p-8 text-center text-muted-foreground">No tickets submitted yet.</div>
                        )}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </ScrollArea>
    )
}


export default function SupportDialog({ open, onOpenChange }: SupportDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glassmorphic sm:max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl"><LifeBuoy /> Get Help & Support</DialogTitle>
          <DialogDescription>
            Use our intelligent assistant, browse FAQs, or submit a ticket to our support team.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="assistant" className="w-full flex-1 min-h-0 flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="assistant"><Bot className="mr-2"/>Assistant</TabsTrigger>
            <TabsTrigger value="faqs"><FileQuestion className="mr-2"/>FAQs & Forum</TabsTrigger>
            <TabsTrigger value="tickets"><Ticket className="mr-2"/>Support Tickets</TabsTrigger>
          </TabsList>
          <div className="py-4 flex-1 min-h-0">
            <TabsContent value="assistant" className="h-full">
              <AssistantTab onOpenChange={onOpenChange} />
            </TabsContent>
            <TabsContent value="faqs" className="h-full">
              <FaqTab />
            </TabsContent>
            <TabsContent value="tickets" className="h-full">
              <TicketTab />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}


'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from './ui/scroll-area';
import { BarChart2, BrainCircuit, CheckSquare, ClipboardList, Star } from 'lucide-react';

interface AboutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FeatureSection = ({ title, icon: Icon, children }: { title: string, icon: React.ElementType, children: React.ReactNode }) => (
    <div className="mb-6">
        <h3 className="flex items-center text-lg font-semibold mb-3">
            <Icon className="h-5 w-5 mr-3 text-primary" />
            {title}
        </h3>
        <div className="pl-9 text-muted-foreground space-y-3 prose prose-sm dark:prose-invert max-w-none">
            {children}
        </div>
    </div>
);


const AboutDialog = ({ open, onOpenChange }: AboutDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="glassmorphic sm:max-w-3xl h-[90vh] flex flex-col">
            <DialogHeader>
                <DialogTitle className="text-xl font-headline text-center">
                    The MD Traders Creator: Your Trading Co-Pilot
                </DialogTitle>
            </DialogHeader>
            <ScrollArea className="flex-1 -mx-6 px-6">
                 <div className="pr-4 space-y-6 text-foreground/90">
                    <p className="text-center text-muted-foreground">
                        Trading isn't just about spotting patterns and making quick decisions—it’s about building habits rooted in solid evidence. It’s about leaving intuition behind and trading on real insight. The MD Traders Creator, built by M. Danial and his team, goes beyond a simple journal to deliver a complete suite of tools for traders who are serious about their craft. Inspired by industry leaders but packed with its own punch, this platform is designed to turn your raw data into a measurable path to success.
                    </p>
                    <p className="text-center font-semibold">
                        If you want to trade smarter, not harder, this platform was designed with you in mind.
                    </p>

                    <h2 className="text-xl font-bold text-center pt-4 border-t">Core Modules & Features: What Sets Us Apart</h2>
                     <p className="text-center text-muted-foreground -mt-4">
                        What makes The MD Traders Creator a go-to solution? Every feature has been shaped to solve real problems traders face every day, from psychological hurdles to strategic blind spots.
                    </p>
                    
                    <FeatureSection title="Advanced Performance Analytics" icon={BarChart2}>
                       <p>Forget endless spreadsheets and guesswork. Our analytics dashboard is a powerful, predictive tool that puts you in control.</p>
                       <ul>
                            <li><strong>Customizable Dashboard:</strong> Get a clear, visual breakdown of your performance at a glance. Easily rearrange widgets and focus on the metrics that matter most to you.</li>
                            <li><strong>Monte Carlo Simulator:</strong> Run thousands of simulations to project your account's potential performance. Test your strategy's resilience against market volatility and see your probability of profit.</li>
                            <li><strong>Strategy Backtesting Engine:</strong> Don't just hope a strategy works—prove it. Our engine lets you backtest a specific rule-set against your own historical trades to see its true win rate and average R:R.</li>
                            <li><strong>Global Filters:</strong> Instantly filter all data—from your trade log to your performance charts—by any metric, including instrument, strategy, or date range.</li>
                        </ul>
                         <p>This module turns raw data into predictive stories. You don’t just see numbers; you see your future trading life in charts and snapshots.</p>
                    </FeatureSection>

                     <FeatureSection title="Strategic Planning & Execution" icon={BrainCircuit}>
                         <p>No two traders work the same way, which is why flexibility and discipline are crucial. We give you the tools to define your plan and stick to it.</p>
                        <ul>
                            <li><strong>Rule-Based Strategy Builder:</strong> Move beyond vague ideas. Our powerful editor lets you build precise, logic-based strategies with IF/AND/OR conditions for your idea generation, POI, and confirmation steps.</li>
                            <li><strong>Interactive Mechanical Steps Checklist:</strong> This is where your plan comes to life. Our intelligent checklist is a pre-trade co-pilot that guides you through every step of your strategy. The system checks your trading hours, confirms your chosen pair, and provides a final compliance score based on your predefined rules.</li>
                            <li><strong>AI-Driven Feedback:</strong> Get instant, automated feedback on your trades that highlights potential plan violations and reinforces positive behavior, helping you stay mechanical and disciplined.</li>
                            <li><strong>Integrated Calculator Suite:</strong> Effortlessly calculate lot sizes, R:R ratios, and potential P/L before you even place a trade.</li>
                        </ul>
                    </FeatureSection>
                    
                     <FeatureSection title="Unified Knowledge Base & Journaling" icon={ClipboardList}>
                         <p>This module is your central hub for all trading knowledge, thoughts, and plans.</p>
                        <ul>
                            <li><strong>Notion-like Rich Text Editor:</strong> Go beyond simple text. Our powerful editor allows you to create rich, dynamic notes with embedded images, charts, and even code blocks.</li>
                            <li><strong>Interconnected Journaling:</strong> Seamlessly link your notes directly to specific trades, creating a comprehensive wiki of your trading journey. Tag notes, filter your research, and build a web of interconnected ideas.</li>
                            <li><strong>Trade Log Table:</strong> A dynamic, spreadsheet-like table where you can manage, sort, and search your entire trade history. Use powerful bulk actions like merging trades or exporting custom reports.</li>
                        </ul>
                    </FeatureSection>
                    
                     <FeatureSection title="Comprehensive Tool Suite" icon={Star}>
                         <p>Our platform is a complete ecosystem, designed to fit into your existing workflow.</p>
                        <ul>
                            <li><strong>Market Hub:</strong> A central dashboard with embedded widgets and direct links to essential services like TradingView, Fast Bull, Forex Factory, and Bloomberg.</li>
                            <li><strong>Import/Export Functionality:</strong> Easily back up your data or import trades from other platforms. Our system includes a secure, intelligent mapping and review panel to ensure data integrity.</li>
                            <li><strong>Integrated Help & Support:</strong> Our AI-powered assistant provides instant, context-aware answers and can even perform actions for you, like opening a specific tab.</li>
                        </ul>
                    </FeatureSection>

                    <h2 className="text-xl font-bold text-center pt-4 border-t">Empowering Traders: Our Purpose and Impact</h2>
                    <p className="text-center text-muted-foreground">
                        The MD Traders Creator was built for those who want to leave intuition behind and trade on insight, not guesswork.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                        <div>
                            <h4 className="font-semibold">Evidence-Driven Decisions</h4>
                            <p className="text-sm text-muted-foreground">The app's analytics cut through personal bias and show you what actually works.</p>
                        </div>
                         <div>
                            <h4 className="font-semibold">Repeatable Systems</h4>
                            <p className="text-sm text-muted-foreground">Our strategic tools help you find what brings consistent results, not just what feels right.</p>
                        </div>
                         <div>
                            <h4 className="font-semibold">Lower Stress</h4>
                            <p className="text-sm text-muted-foreground">Clarity and structure replace doubt and hunches, putting you in control of your trading and your emotions.</p>
                        </div>
                    </div>
                     <p className="text-center font-semibold">
                        Whether you’re just starting out or have years of experience, The MD Traders Creator helps you build consistent habits and trade with confidence.
                    </p>
                    
                    <h2 className="text-xl font-bold text-center pt-4 border-t">Conclusion</h2>
                     <p className="text-center text-muted-foreground">
                        The MD Traders Creator isn't just another trading journal—it’s a full suite for those who want a smarter, more rewarding approach. By blending advanced analytics, predictive tools, and a focus on discipline, it gives you everything you need to trade with confidence and clarity. No more flying blind or falling into old traps.
                    </p>
                     <p className="text-center font-semibold text-lg text-primary">
                        If you’re tired of guessing and ready for real feedback, The MD Traders Creator can guide you to smarter habits and stronger results—one trade at a time.
                    </p>
                </div>
            </ScrollArea>
        </DialogContent>
    </Dialog>
  );
};

export default AboutDialog;

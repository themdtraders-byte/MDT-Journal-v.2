
'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Strategy } from "@/types";
import { Edit, Trash2, MoreVertical, FileDown, TrendingUp, TrendingDown, GitCommitVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import FormattedNumber from "./ui/formatted-number";
import { cn } from "@/lib/utils";

type StrategyStats = {
    trades: number;
    winRate: number;
    totalPl: number;
    profitFactor: number;
    expectancy: number;
    avgPl: number;
    avgScore: number;
    maxWinStreak: number;
    maxLossStreak: number;
} | undefined;

interface StrategyCardProps {
  strategy: Strategy;
  stats: StrategyStats;
  onEdit: (strategy: Strategy) => void;
  onDelete: (strategyId: string) => void;
  onExport: (strategy: Strategy) => void;
}

const StatItem = ({ label, value, className }: { label: string, value: React.ReactNode, className?: string }) => (
    <div className="flex justify-between items-center text-xs border-b border-border/50 py-1 last:border-b-0">
        <p className="text-muted-foreground">{label}</p>
        <p className={cn("font-semibold text-right", className)}>{value}</p>
    </div>
);


export default function StrategyCard({ strategy, stats, onEdit, onDelete, onExport }: StrategyCardProps) {
  return (
    <Card className="glassmorphic interactive-card flex flex-col h-full hover:shadow-primary/20 transition-shadow">
      <CardHeader className="p-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-base line-clamp-2 pr-2">{strategy.name}</CardTitle>
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0">
                    <MoreVertical className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem onClick={() => onEdit(strategy)}><Edit className="mr-2 h-4 w-4"/> Edit</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onExport(strategy)}><FileDown className="mr-2 h-4 w-4"/> Export</DropdownMenuItem>
                <DropdownMenuSeparator />
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={e => e.preventDefault()} className="text-destructive focus:text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will permanently delete the strategy "{strategy.name}". This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDelete(strategy.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </DropdownMenuContent>
           </DropdownMenu>
        </div>
        <CardDescription className="text-xs line-clamp-2">{strategy.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-2 p-3 pt-0">
        {stats && stats.trades > 0 ? (
            <div className="space-y-1">
                <StatItem label="Total P/L" value={<FormattedNumber value={stats.totalPl} />} className={stats.totalPl >= 0 ? 'text-green-500' : 'text-red-500'} />
                <StatItem label="Avg P/L" value={<FormattedNumber value={stats.avgPl} />} className={stats.avgPl >= 0 ? 'text-green-500' : 'text-red-500'} />
                <StatItem label="Win Rate" value={`${stats.winRate.toFixed(1)}%`} className={stats.winRate >= 50 ? 'text-green-500' : 'text-red-500'} />
                <StatItem label="Profit Factor" value={isFinite(stats.profitFactor) ? stats.profitFactor.toFixed(2) : '∞'} className={stats.profitFactor >= 1 ? 'text-green-500' : 'text-red-500'} />
                <StatItem label="Expectancy" value={<FormattedNumber value={stats.expectancy}/>} className={stats.expectancy >= 0 ? 'text-green-500' : 'text-red-500'} />
                <StatItem label="Avg Score" value={stats.avgScore.toFixed(1)} />
                <StatItem label="Streaks (W/L)" value={
                    <div className="flex items-center gap-2">
                        <span className="flex items-center gap-0.5 text-green-500"><TrendingUp className="h-3 w-3"/>{stats.maxWinStreak}</span>
                        <span className="flex items-center gap-0.5 text-red-500"><TrendingDown className="h-3 w-3"/>{stats.maxLossStreak}</span>
                    </div>
                } />
            </div>
        ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
                No trades logged with this strategy yet.
            </div>
        )}
      </CardContent>
      <CardFooter className="p-3 border-t">
        <p className="text-xs text-muted-foreground">{strategy.setups?.length || 0} Setups • {stats?.trades || 0} Trades</p>
      </CardFooter>
    </Card>
  );
}

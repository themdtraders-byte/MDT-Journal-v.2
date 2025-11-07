
'use client';

import type { BacktestResult } from "@/components/performance/simulator/page";
import type { Currency, NewsImpact } from "@/lib/data";

export interface Alert {
  id: string;
  type: "Warning" | "Success" | "Informational" | "Rule Breached" | "Target Reached" | "Actionable Insight" | "Level Up" | "Achievement Unlocked" | "Badge Unlocked";
  category: "Largest Loss" | "Win Streak" | "Losing Streak" | "Closed Before TP" | "Best Setup Underused" | "Unprofitable Pattern" | "Discipline vs. Performance" | "General" | "Gamification" | "Trading against Bias" | "Risk Management" | "Profit Taking" | "Break-Even Rut" | "Low Risk-to-Reward" | "Rule Breached" | "Potential Overconfidence";
  message: string;
  timestamp: string; // ISO string
  seen: boolean;
  tradeId?: string; // Optional ID of the trade that triggered the alert
  meta?: Record<string, any>; // For extra data like new level, achievement name, etc.
}

export interface TradeDraft {
  id: string;
  name: string;
  formData: any; // Holds the state of the AddTradeDialog form
}

export interface ExecutionChecklist {
  id: string;
  name: string;
  currentChecklistStep: number;
  selectedDate: string;
  currentTime: string;
  selectedPair: string;
  selectedStrategyId: string | null;
  selectedRuleIds: string[];
  optionalPrefills: Partial<Omit<Trade, 'id' | 'auto'>>;
  analysisSelections: Record<string, any>; // To store analysis choices
}


export interface Transaction {
  id: string;
  type: 'Deposit' | 'Withdrawal';
  amount: number;
  date: string;
  note?: string;
}

export interface Rule {
  value: number;
  type: 'amount' | 'percentage';
  enabled: boolean;
}

export interface MinDaysRule {
      value: number;
      enabled: boolean;
}

export interface JournalRules {
    // Evaluation Rules
    profitTarget: Rule;
    profitTargetPhase2: Rule;
    minTradingDays: MinDaysRule;
    profitableDays: {
        enabled: boolean;
        count: number;
        minProfitPercent: number;
    };
    
    // General Breach Rules
    maxDrawdown: Rule;
    dailyDrawdown: Rule;
    trailingDrawdown: Rule;
    trailingDailyDrawdown: Rule;
    
    // Behavioral Rules
    inactivityLimit: {
        enabled: boolean;
        days: number;
    };
    weekendHolding: {
        enabled: boolean;
    };
    stackingTrades: {
        enabled: boolean;
        limit: number;
    };
    stopLossRequirement: {
        enabled: boolean;
        minutes: number;
    };
    minHoldingTime: {
        enabled: boolean;
        seconds: number;
    };

    // Funded Account Payout Rules
    profitSplit: Rule;
    withdrawalTimingDays: {
        enabled: boolean;
        days: number;
    };
    minWithdrawal: Rule;
    maxFirstPayout: Rule;
    bestDayRule: {
        enabled: boolean;
        percentage: number;
    };
}


export interface TradingPlanData {
      timezone: string;
      instruments: string[];
      riskPerTrade: number;
      riskUnit: '%' | '$';
      dailyLossLimit: number;
      weeklyLossLimit: number;
      maxTradesPerDay: number;
      maxOpenPositions: number;
      dailyTarget: number;
      dailyTargetUnit: '%' | '$';
      weeklyProfitLimit: number;
      weeklyProfitLimitUnit: '%' | '$';
      monthlyLossLimit: number;
      monthlyLossLimitUnit: '%' | '$';
      monthlyProfitLimit: number;
      monthlyProfitLimitUnit: '%' | '$';
      minRiskToReward: number;
      activeHours: { start: string, end: string }[];
      noTradeZones: { start: string, end: string }[];
      killZones: { name: string, start: string, end: string, enabled: boolean }[];
      sessionTimings: {
          [key in 'Asian' | 'London' | 'New York' | 'Sydney']: { start: string, end: string };
      };
}

export type TrashedItemType = 'note' | 'strategy' | 'marketLink' | 'quote' | 'tip' | 'advice' | 'pairConfig' | 'customField' | 'trade' | 'journal';

export interface TrashedItem {
  id: string;
  type: TrashedItemType;
  journalId: string; // ID of the journal the item belonged to
  deletedAt: string;
  data: any; // The original item data
}

export interface NoteFolder {
  id: string;
  name: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  status: 'Idea' | 'Researching' | 'Executing' | 'Completed';
  createdAt: string;
  updatedAt: string;
  linkedTradeIds?: string[];
  folderId?: string; // New field for folder
}

export type StrategyRuleType =
  | "pair"
  | "direction"
  | "volatility"
  | "bias"
  | "zone"
  | "liquidity"
  | "entryReason"
  | "tradeManagement"
  | "limit"
  | "structure"
  | "custom";
    
export interface StrategyRule {
  id: string;
  type: StrategyRuleType;
  values: any; 
}

export interface StrategyRuleSection {
      id: string;
      title: string;
      icon: string; // Lucide icon name
      ruleType: StrategyRuleType;
      rules: Omit<StrategyRule, 'type'>[];
}

// --- New Rule Combination Types ---
export interface POIRule {
    value: string;
    modifier: 'Swept' | 'Break' | 'Pick' | null;
}
export interface ZoneRule {
    value: string;
    modifier: 'Extreme' | 'Decisive' | 'Start' | null;
}
export interface IndicatorRule {
    value: string;
    condition: '>' | '<' | '=';
    numValue: string;
}

export interface RuleCombination {
    timeframe: string;
    selectedRules: Record<string, (string | POIRule | ZoneRule | IndicatorRule)[]>;
}

// --- End New Rule Combination Types ---


export interface Setup {
      id: string;
      name: string;
      rules: RuleCombination[];
}

export interface Strategy {
  id: string;
  name: string;
  description: string;
  rules: RuleCombination[];
  analysisConfigurations?: AnalysisCategory[];
  setups?: Setup[];
  pairSelectionMode: 'any' | 'specific';
  allowedPairs: string[];
  timeBasedRules?: {
    enabled: boolean;
    session: string;
    timeRange: { start: string, end: string; };
  };
  coverImage?: string;
}

export interface NewsEventSelection {
  id: string; // Unique ID for this selection instance
  time: string;
  currency: Currency;
  name: string;
  impact?: NewsImpact;
  details: {
    previous?: number;
    forecast?: number;
    actual?: number;
  }
}

export type TradeNote = {
  id: string;
  title: string;
  content: string;
  isDefault?: boolean; // To distinguish predefined prompts from user-added ones
};

// --- Custom Field Types ---
export type ControlType = 'List' | 'Button' | 'Plain Text' | 'Numeric' | 'Date' | 'Time';
export type ScoreImpact = 'Most Positive' | 'Positive' | 'Negative' | 'Most Negative';

export interface BaseCustomField {
  id: string;
  title: string;
  type: ControlType;
}

export interface ListCustomField extends BaseCustomField {
  type: 'List';
  allowMultiple: boolean;
  options: { value: string, impact: ScoreImpact }[];
}

export interface ButtonCustomField extends BaseCustomField {
  type: 'Button';
  allowMultiple: boolean;
  options: { value: string, impact: ScoreImpact }[];
}

export interface PlainTextCustomField extends BaseCustomField {
  type: 'Plain Text';
}

export interface NumericCustomField extends BaseCustomField {
  type: 'Numeric';
  range: 'Any' | 'Positive' | 'Negative' | { min: number; max: number };
}

export interface DateCustomField extends BaseCustomField {
  type: 'Date';
}

export interface TimeCustomField extends BaseCustomField {
  type: 'Time';
}

export type CustomField = ListCustomField | ButtonCustomField | PlainTextCustomField | NumericCustomField | DateCustomField | TimeCustomField;
// --- End Custom Field Types ---

export interface ValidationListItem {
  id: string;
  text: string;
}

export interface ValidationList {
  id: string;
  title: string;
  items: ValidationListItem[];
}

export interface Modifier {
    key: string;
    label: string;
    options: {
        value: string;
        label: string;
    }[];
    type?: 'select' | 'text'; // Added for flexibility
}

export interface AnalysisOption {
    id: string;
    value: string;
    modifiers?: Modifier[];
}

export interface AnalysisSubCategory {
    id: string;
    title: string;
    options: AnalysisOption[];
    modifiers?: Modifier[];
}
export interface AnalysisCategory {
    id: string;
    title: string;
    icon: string; // Lucide Icon Name
    isSingleChoice: boolean;
    subCategories: AnalysisSubCategory[];
}

export interface PartialTrade {
  openDate: string;
  openTime: string;
  closeDate?: string;
  closeTime?: string;
  pair: string;
  direction: 'Buy' | 'Sell';
  lotSize: number;
  entryPrice: number;
  closingPrice?: number;
  stopLoss: number;
  takeProfit?: number;
  hasPartial?: boolean;
  partials?: { lotSize: number; price: number }[];
  breakeven?: {
    type: 'No Break Even' | 'Break Even' | 'Trail SL';
    trigger?: string;
    trailPrice?: number;
  };
  sentiment?: { Before?: string[]; During?: string[]; After?: string[] };
  images?: string[];
  imagesByTimeframe?: Record<string, string[]>;
  note?: TradeNote[];
  strategy?: string;
  tag?: string;
  commission?: number;
  swap?: number;
  extraSpread?: number;
  bias?: { 
    structure: string; 
    timeframe: string;
    types: ('External' | 'Internal')[];
    external: 'Main' | 'Minor' | null;
    internal: 'Main' | 'Minor' | null;
  }[];
  discountPremiumZones?: { timeframe: string; area: string; point: boolean }[];
  liquidity?: { type: string; swept: boolean; timeframe: string }[];
  entryReasons?: string[];
  indicators?: string[];
  newsEvents?: NewsEventSelection[];
  mae?: number; // Stored as a price value
  mfe?: number; // Stored as a price value
  selectedRuleIds?: string[];
  newPairConfig?: { pipSize: string; pipValue: string; spread: string; };
  customStats?: Record<string, any>;
  isMissing?: boolean;
  missedTradeReasons?: string[];
  wasTpHit?: boolean;
  lessonsLearned?: string;
  whatWentRight?: string;
  whatWentWrong?: string;
  status: 'Open' | 'Closed' | 'Incomplete';
  isLayered?: boolean;
  layers?: {
    lotSize: number;
    entryPrice: number;
    closingPrice: number;
    stopLoss: number;
    takeProfit: number;
  }[];
  analysisSelections: Record<string, any>;
  avgScoreAtTime?: number; // New field for historical average score
  avgPlAtTime?: number; // New field for historical average P/L
}


export interface Trade extends PartialTrade {
  id:string;
  closingPrice: number;
  closeDate: string;
  closeTime: string;
  auto: AutoCalculated;
  selectedRuleIds: string[];
}

export interface TiltmeterScore {
    finalTilt: number;
    scoreComponent: number;
    sentimentComponent: number;
    customFieldComponent: number;
    rComponent: number;
    resultComponent: number;
    plComponent: number;
}

export interface AutoCalculated {
  session: string;
  ipdaZone?: string;
  result: 'TP' | 'SL' | 'BE' | 'Stop' | 'Running';
  status: 'Open' | 'Closed';
  outcome: 'Win' | 'Loss' | 'Neutral';
  pips: number;
  pl: number;
  rr: number; // Planned R:R
  riskPercent: number;
  gainPercent: number;
  holdingTime: string;
  durationMinutes: number;
  xp: number;
  phase?: string;
  newsImpact?: NewsImpact | 'N/A';
  actualMove?: string;
  marks?: number;
  score: {
    value: number;
    remark: string;
    color: string;
  };
  mfe: number; // Calculated MFE in pips
  mae: number; // Calculated MAE in pips
  spreadCost?: number;
  commissionCost?: number;
  swapCost?: number;
  matchedSetups?: string[];
  tiltmeter: TiltmeterScore;
}

export interface SupportTicket {
  id: string;
  subject: string;
  status: 'Open' | 'In Progress' | 'Closed';
  createdAt: string;
  lastUpdate: string;
}

export interface MarketLink {
      id: string;
      name: string;
      url: string;
      description: string;
}

export interface ProfitSplit {
  id: string;
  name: string;
  percentage: number;
}

export interface SoundSettings {
      enabled: boolean;
      volume: number;
      effects: {
          click: boolean;
          notification: boolean;
          error: boolean;
          success: boolean;
          undo: boolean;
          redo: boolean;
          delete: boolean;
      };
}

export interface VisualSettings {
      fontFamily: string;
      fontSize: number;
      lineHeight: number;
      letterSpacing: number;
      dashboardLayout: 'desktop' | 'mobile' | 'mac';
      uiScale: number;
      accessibilityMode: boolean;
      useCustomCursor: boolean;
      showChartZoomSlider: boolean;
}

export interface Shortcut {
      action: string;
      keys: string[];
}

export type KeywordScoreEffectType = 'Positive' | 'Negative';
export interface KeywordScoreEffect {
      keyword: string;
      impact: KeywordScoreEffectType;
      type: 'Sentiment' | 'Keyword';
}


export interface AppSettings {
      displayCurrency: string;
      currencyRates: { [key: string]: number };
      inputOptions: {
          timeframes: string[];
          trends: string[];
          sentiments: string[];
          volatility: string[];
          tradeManagementTypes: string[];
          tradeManagementTriggers: string[];
          structureTypes: string[];
          mainMinor: string[];
          zones: string[];
          points: string[];
          liquidityTypes: string[];
          liquidityStatus: string[];
          institutionalPois: string[];
          structuralPois: string[];
          entryReasonCategories: string[];
          structureEntryReasons: string[];
          patternEntryReasons: string[];
          indicatorEntryReasons: Record<string, string[]>;
      };
      socialLinks: typeof import('@/lib/stay-connected-data').socialLinks;
      communityForumUrl: string;
      quotes: { quote: string; author: string }[];
      tips: {text: string}[];
      notes: {title: string; content: string}[];
      advice: {text: string}[];
      pairsConfig: typeof import('@/lib/data').pairsConfig;
      shortcuts: Shortcut[];
      customFields?: CustomField[];
      validationLists?: ValidationList[];
      keywordScores: KeywordScoreEffect[];
      missedTradeReasonsConfig: Record<string, string[]>;
      visualSettings: VisualSettings;
      trash: TrashedItem[];
      defaultInputs?: {
        [key: string]: string;
      };
      analysisConfigurations: AnalysisCategory[];
      userDefinedAnalysisDefaults?: AnalysisCategory[] | null;
}

export type Filters = {
      keywords: string[];
      dateRange: { from: Date | undefined; to: Date | undefined };
      dayOfWeek: string[];
      dayOfMonth: string[];
      month: string[];
      timeRanges: { from: string; to: string }[];
      pair: string[];
      direction: string[];
      status: ('Open' | 'Closed')[];
      outcome: ('Win' | 'Loss' | 'Neutral')[];
      result: string[];
      strategy: string[];
      session?: string[]; // Made optional to avoid breaking old state
      ipdaZone?: string[];
      plRange: { min: string; max: string };
      rrRange: { min: string; max: string };
      scoreRange: { min: string; max: string };
      lotSizeRange: { min: string; max: string };
      riskPercentRange: { min: string; max: string };
      gainPercentRange: { min: string; max: string };
      holdingTimeRange: { min: string; max: string };
      tag: string[];
      news: string[];
      sentiment: string[];
      matchedSetups?: string[];
      custom?: Record<string, string[]>;
      planAdherence?: 'Compliant' | 'Non-Compliant';
      invert: boolean;
      analysis?: Record<string, any>;
};

export interface RuleHistoryEntry {
      date: string;
      status: 'Active' | 'Passed' | 'Failed';
      startingCapital?: number;
      breachedRule?: string | null;
}

export interface Journal {
  id: string;
  title: string;
  type: JournalType;
  initialDeposit: number;
  capital: number;
  balance: number;
  trades: Trade[];
  transactions: Transaction[];
  alerts?: Alert[];
  createdAt: string;
  xp: number;
  // New fields for rules and status tracking
  rules: JournalRules;
  plan: TradingPlanData;
  status: 'Active' | 'Passed' | 'Failed';
  breachedRule?: string | null;
  peakBalance: number;
  trailingHighWaterMark: number; // Added for true trailing drawdown
  currentMaxDrawdown: number;
  currentDailyDrawdown: number;
  currentProfit: number;
  uniqueTradingDays: number;
  softBreaches: number; // Added for stacking rule
  backtests?: BacktestResult[];
  noteFolders?: NoteFolder[];
  notes?: Note[];
  strategies?: Strategy[];
  supportTickets?: SupportTicket[];
  marketLinks?: MarketLink[];
  profitSplits?: ProfitSplit[];
  fundedSplit?: {
    enabled: boolean;
    percentage: number;
  };
  ruleHistory?: RuleHistoryEntry[];
  // Execution state
  tradeDrafts: TradeDraft[]; // New for multi-trade dialog
  activeTradeDraftId: string | null; // New for multi-trade dialog
  executionChecklists: ExecutionChecklist[];
  activeChecklistId: string | null;
  profitableDaysCount?: number;
  soundSettings?: SoundSettings;
  visualSettings?: VisualSettings;
}


// This defines the structure of a trade that has been parsed from raw data,
// but not yet converted into the full `Trade` object.
export type ImportedTrade = {
    openDate: string;
    openTime: string;
    closeDate?: string;
    closeTime?: string;
    pair: string;
    direction: 'Buy' | 'Sell';
    lotSize: number;
    entryPrice: number;
    closingPrice: number;
    stopLoss?: number;
    takeProfit?: number;
    note?: TradeNote[];
    strategy?: string;
    commission?: number;
    swap?: number;
    tag?: string;
    sentiment?: { Before?: string[]; During?: string[]; After?: string[] };
    newsEvents?: NewsEventSelection[];
    analysisSelections?: Record<string, any>;
    customStats?: Record<string, any>;
    mae?: number;
    mfe?: number;
    partials?: { lotSize: number; price: number }[];
    layers?: {
        lotSize: number;
        entryPrice: number;
        closingPrice: number;
        stopLoss: number;
        takeProfit: number;
    }[];
    hasPartial?: boolean;
    isLayered?: boolean;
    breakeven?: {
        type: 'No Break Even' | 'Break Even' | 'Trail SL';
        trigger?: string;
        trailPrice?: number;
    };
    wasTpHit?: boolean;
    lessonsLearned?: string;
    images?: string[];
    imagesByTimeframe?: Record<string, string[]>;
};

export enum TradeDirection {
  Buy = 'Buy',
  Sell = 'Sell',
}

// --- Analytics Page Types ---

export type SuggestionCategory = 
    | 'Day' 
    | 'Hour' 
    | 'Pair' 
    | 'Strategy' 
    | 'Indicator' 
    | 'Liquidity' 
    | 'Entry Reason' 
    | 'Zone'
    | 'Day of Month'
    | 'Week of Month'
    | 'Direction'
    | 'Lot Size'
    | 'News Event'
    | 'Sentiment (Before)'
    | 'Sentiment (During)'
    | 'Sentiment (After)';


export type Suggestion = {
    category: SuggestionCategory;
    best: SuggestionDetailProps | null;
    worst: SuggestionDetailProps | null;
}

export type SuggestionDetailProps = {
    category: SuggestionCategory;
    name: string;
    totalTrades: number;
    winRate: number;
    avgR: number;
    totalPl: number;
    avgScore: number;
    profitFactor: number;
    type: 'best' | 'worst';
};

export type PlByTime = {
    time: string;
    pl: number;
};

export type JournalType = 'Real' | 'Demo' | 'Backtest' | 'Funded' | 'Competition' | 'Other';

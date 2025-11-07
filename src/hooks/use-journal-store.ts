

'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { User } from 'firebase/auth';
import React from 'react';

import type { Journal, Trade, PartialTrade, AutoCalculated, AppSettings, SoundSettings, VisualSettings, TradingPlanData, RuleHistoryEntry, TrashedItem, TrashedItemType, Note, NoteFolder, Strategy, MarketLink, ProfitSplit, TradeDraft, ExecutionChecklist, TradeNote } from '@/types';
import { calculateTradeMetrics, calculateTradeXp, calculateMdScore } from '@/lib/calculations';
import { runAlertEngine } from '@/lib/alerts';
import { allAnalysisCategories } from '@/lib/strategy-options';

import { 
    quotes, tips, advice, defaultShortcuts, pairsConfig as defaultPairsConfig, 
    timeframes, trends, sentiments, volatilityTypes, tradeManagementTypes, 
    tradeManagementTriggers, structureTypes, mainMinor, zones, points, 
    liquidityTypes, liquidityStatus, institutionalPois, structuralPois,
    entryReasonCategories, structureEntryReasons, patternEntryReasons, indicatorEntryReasons,
    notes as defaultNotes
} from '@/lib/data';
import { deleteHandle, getHandle, storeHandle } from '@/lib/file-handle-manager';

export const initialPlan: TradingPlanData = {
    timezone: 'America/New_York',
    instruments: ['XAUUSD', 'EURUSD', 'GBPUSD', 'US30'],
    riskPerTrade: 1,
    riskUnit: '%',
    dailyLossLimit: 5,
    weeklyLossLimit: 10,
    monthlyLossLimit: 20,
    maxTradesPerDay: 5,
    maxOpenPositions: 2,
    dailyTarget: 3,
    dailyTargetUnit: '%',
    weeklyProfitLimit: 6,
    weeklyProfitLimitUnit: '%',
    monthlyLossLimit: 20,
    monthlyProfitLimit: 12,
    monthlyProfitLimitUnit: '%',
    minRiskToReward: 1.5,
    activeHours: [],
    noTradeZones: [],
    killZones: [
        { name: 'London Open', start: '03:00', end: '05:00', enabled: true },
        { name: 'New York Open', start: '08:00', end: '11:00', enabled: true },
        { name: 'London Close', start: '11:00', end: '13:00', enabled: false },
    ],
    sessionTimings: {
        'Asian': { start: '20:00', end: '05:00' },
        'London': { start: '03:00', end: '12:00' },
        'New York': { start: '08:00', end: '17:00' },
        'Sydney': { start: '17:00', end: '02:00' }
    }
};


export const initialJournalRules: Journal['rules'] = {
    profitTarget: { value: 8, type: 'percentage', enabled: true },
    profitTargetPhase2: { value: 5, type: 'percentage', enabled: false },
    minTradingDays: { value: 0, enabled: false },
    profitableDays: { enabled: false, count: 0, minProfitPercent: 0.5 },
    
    maxDrawdown: { value: 10, type: 'percentage', enabled: true },
    dailyDrawdown: { value: 5, type: 'percentage', enabled: true },
    trailingDrawdown: { value: 5, type: 'percentage', enabled: false },
    trailingDailyDrawdown: { value: 5, type: 'percentage', enabled: false },
    
    inactivityLimit: { enabled: false, days: 30 },
    weekendHolding: { enabled: false },
    stackingTrades: { enabled: false, limit: 3 },
    stopLossRequirement: { enabled: false, minutes: 1 },
    minHoldingTime: { enabled: false, seconds: 30 },

    profitSplit: { enabled: false, value: 80, type: 'percentage' },
    withdrawalTimingDays: { enabled: false, days: 7 },
    minWithdrawal: { enabled: false, value: 50, type: 'amount' },
    maxFirstPayout: { enabled: false, value: 4000, type: 'amount' },
    bestDayRule: { enabled: false, percentage: 35 },
};

const initialVisualSettings: VisualSettings = {
  fontFamily: '--font-body',
  fontSize: 16,
  lineHeight: 1.5,
  letterSpacing: 0,
  dashboardLayout: 'desktop',
  uiScale: 100,
  accessibilityMode: false,
  useCustomCursor: false,
  showChartZoomSlider: true,
};

const initialSoundSettings: SoundSettings = {
  enabled: true,
  volume: 50,
  effects: {
    click: true,
    notification: true,
    error: true,
    success: true,
    undo: true,
    redo: true,
    delete: true
  }
};

const initialAppSettings: AppSettings = {
    displayCurrency: 'USD',
    currencyRates: { 'USD': 1 },
    inputOptions: {
        timeframes,
        trends,
        sentiments,
        volatility: volatilityTypes,
        tradeManagementTypes,
        tradeManagementTriggers,
        structureTypes,
        mainMinor,
        zones,
        points,
        liquidityTypes,
        liquidityStatus,
        institutionalPois,
        structuralPois,
        entryReasonCategories,
        structureEntryReasons,
        patternEntryReasons,
        indicatorEntryReasons,
    },
    socialLinks: [],
    communityForumUrl: '',
    quotes,
    tips,
    advice,
    notes: defaultNotes,
    pairsConfig: defaultPairsConfig,
    shortcuts: defaultShortcuts,
    customFields: [],
    validationLists: [],
    keywordScores: [],
    missedTradeReasonsConfig: {
        'Hesitation': ['Felt uncertain', 'Waited too long for confirmation', 'Second-guessed the setup'],
        'Distraction': ['Wasn\'t at my desk', 'Got a phone call', 'Was multitasking'],
        'Technical Issues': ['Platform froze', 'Platform froze', 'Internet disconnected', 'Order entry error'],
        'Plan Violation': ['Outside trading hours', 'Not in my list of tradable pairs', 'Setup did not meet all criteria'],
    },
    visualSettings: initialVisualSettings,
    soundSettings: initialSoundSettings,
    trash: [],
    defaultInputs: {},
    analysisConfigurations: allAnalysisCategories,
    userDefinedAnalysisDefaults: null,
};

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


export const initialFilterState: Filters = {
    keywords: [],
    dateRange: { from: undefined, to: undefined },
    dayOfWeek: [],
    dayOfMonth: [],
    month: [],
    timeRanges: [],
    pair: [],
    direction: [],
    status: [],
    outcome: [],
    result: [],
    strategy: [],
    session: [],
    ipdaZone: [],
    plRange: { min: '', max: '' },
    rrRange: { min: '', max: '' },
    scoreRange: { min: '', max: '' },
    lotSizeRange: { min: '', max: '' },
    riskPercentRange: { min: '', max: '' },
    gainPercentRange: { min: '', max: '' },
    holdingTimeRange: { min: '', max: '' },
    tag: [],
    news: [],
    sentiment: [],
    matchedSetups: [],
    custom: {},
    planAdherence: undefined,
    invert: false,
    analysis: {}
};

export type JournalState = {
  journals: Journal[];
  activeJournalId: string | null;
  appSettings: AppSettings;
  isCalculatorOpen: boolean;
  isChecklistOpen: boolean;
  isFilterOpen: boolean;
  isAuditOpen: boolean;
  isNotificationsOpen: boolean;
  isAccountOpen: boolean;
  isJournalActionsOpen: boolean;
  isAddTradeDialogOpen: boolean;
  addTradePrefillData: Partial<Trade> | null;
  filters: Filters;
  isLoading: boolean;
  _hasHydrated: boolean;
  user: User | null;

  setUser: (user: User) => void;
  loadFromFirestore: () => void;
  
  createJournal: (title: string, type: JournalType, initialDeposit: number, date: string, comment: string) => void;
  importJournal: (journalData: Journal) => void;
  deleteJournal: (journalId: string) => void;
  setActiveJournal: (journalId: string | null) => void;
  updateActiveJournal: (updates: Partial<Journal>) => void;
  
  addTrade: (trade: PartialTrade) => void;
  updateTrade: (trade: Omit<Trade, 'auto'> & {id: string}) => void;
  deleteTrade: (tradeId: string) => void;
  deleteTrades: (tradeIds: string[]) => void;
  mergeTrades: (tradeIds: string[]) => void;
  duplicateTrades: (tradeIds: string[]) => void;
  updateTradesTag: (tradeIds: string[], tag: string) => void;
  openAddTradeDialog: (trade?: Partial<Trade>) => void;
  closeAddTradeDialog: () => void;


  addTradeDraft: (addTradePrefillData: Partial<Trade> | null) => string;
  updateTradeDraft: (draftId: string, updates: Partial<TradeDraft>) => void;
  removeTradeDraft: (draftId: string) => void;
  renameTradeDraft: (draftId: string, newName: string) => void;
  setActiveTradeDraftId: (draftId: string | null) => void;
  
  toggleCalculator: () => void;
  toggleChecklist: () => void;
  setFilterOpen: (open: boolean) => void;
  setIsAuditOpen: (open: boolean) => void;
  setNotificationsOpen: (open: boolean) => void;
  setAccountOpen: (open: boolean) => void;
  setJournalActionsOpen: (open: boolean) => void;

  applyFilters: (newFilters: Filters) => void;
  clearFilters: () => void;

  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateNote: (note: Note) => void;
  deleteNote: (noteId: string) => void;
  deleteNotes: (noteIds: string[]) => void;
  duplicateNotes: (noteIds: string[]) => void;
  moveNotesToFolder: (noteIds: string[], folderId: string) => void;
  addTagsToNotes: (noteIds: string[], tags: string[]) => void;

  addNoteFolder: (name: string) => string;
  updateNoteFolder: (id: string, name: string) => void;
  deleteNoteFolder: (id: string) => void;

  addStrategy: (strategy: Omit<Strategy, 'id'>) => void;
  updateStrategy: (strategy: Strategy) => void;
  deleteStrategy: (strategyId: string) => void;
  
  addMarketLink: (link: Omit<MarketLink, 'id'>) => void;
  updateMarketLink: (link: MarketLink) => void;
  deleteMarketLink: (linkId: string) => void;
  
  updateProfitSplits: (splits: ProfitSplit[]) => void;
  
  recordDeposit: (amount: number, date: string, note?: string) => void;
  recordWithdrawal: (amount: number, date: string, note?: string) => void;

  updateTradingPlan: (newPlan: TradingPlanData) => void;
  updateJournalRules: (newRules: Journal['rules']) => void;
  resetJournalRules: () => void;
  
  addAlert: (alert: Omit<Alert, 'id' | 'timestamp' | 'seen'>) => void;
  dismissAlert: (alertId: string) => void;
  clearAlerts: (alertIds?: string[]) => void;

  updateAppSettings: (settings: Partial<AppSettings>) => void;
  updateSoundSettings: (settings: Partial<SoundSettings>) => void;
  updateVisualSettings: (settings: Partial<VisualSettings>) => void;
  resetSoundSettings: () => void;
  resetVisualSettings: () => void;
  resetDatabaseSettings: () => void;
  resetShortcuts: () => void;
  
  restoreFromTrash: (itemId: string) => void;
  permanentlyDeleteItem: (itemId: string) => void;
  emptyTrash: (journalId: string) => void;
  clearBackupFileHandle: () => void;
};

const defaultNotePrompts: TradeNote[] = [
    { id: 'before', title: "Before Trade Note", content: "", isDefault: true },
    { id: 'during', title: "During Trade Note", content: "", isDefault: true },
    { id: 'after', title: "After Trade Note", content: "", isDefault: true },
];

const getSafeInitialFormData = (defaultInputs: AppSettings['defaultInputs'] = {}): PartialTrade => {
    const now = new Date();
    const openDate = now.toISOString().split('T')[0];
    const openTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    
    return {
        openDate,
        openTime,
        closeDate: '',
        closeTime: '',
        pair: defaultInputs.pair || 'XAUUSD',
        direction: (defaultInputs.direction as 'Buy' | 'Sell') || 'Buy',
        lotSize: 0,
        entryPrice: 0,
        closingPrice: 0,
        stopLoss: 0,
        takeProfit: 0,
        commission: 0,
        swap: 0,
        extraSpread: 0,
        hasPartial: false,
        partials: [],
        breakeven: { type: 'No Break Even' },
        sentiment: { Before: [], During: [], After: [] },
        images: [],
        note: defaultNotePrompts.map(p => ({...p, content: ''})),
        strategy: defaultInputs.strategy || '',
        tag: '',
        bias: [],
        discountPremiumZones: [],
        liquidity: [],
        entryReasons: [],
        indicators: [],
        newsEvents: [],
        mae: 0,
        mfe: 0,
        customStats: {},
        wasTpHit: undefined,
        lessonsLearned: '',
        status: 'Incomplete' as 'Open' | 'Closed' | 'Incomplete',
        isLayered: false,
        layers: [],
        analysisSelections: {},
        imagesByTimeframe: {},
        selectedRuleIds: [],
        avgScoreAtTime: 50,
        avgPlAtTime: 0,
    }
};

export const useJournalStore = create<JournalState>()(
    persist(
        immer((set, get) => ({
            journals: [],
            activeJournalId: null,
            appSettings: initialAppSettings,
            isCalculatorOpen: false,
            isChecklistOpen: false,
            isFilterOpen: false,
            isAuditOpen: false,
            isNotificationsOpen: false,
            isAccountOpen: false,
            isJournalActionsOpen: false,
            isAddTradeDialogOpen: false,
            addTradePrefillData: null,
            filters: initialFilterState,
            isLoading: true,
            _hasHydrated: false,
            user: null,
            
            setUser: (user) => set({ user }),
            loadFromFirestore: () => {
                // This function is a placeholder for potential future cloud sync logic.
                // For now, it simply sets loading to false.
                set({ isLoading: false });
            },

            // --- JOURNAL MANAGEMENT ---
            createJournal: (title, type, initialDeposit, date, comment) => {
                const newJournal: Journal = {
                    id: crypto.randomUUID(),
                    title,
                    type,
                    initialDeposit,
                    capital: initialDeposit,
                    balance: initialDeposit,
                    trades: [],
                    transactions: [{id: crypto.randomUUID(), type: 'Deposit', amount: initialDeposit, date, note: comment}],
                    alerts: [],
                    createdAt: new Date().toISOString(),
                    xp: 0,
                    rules: initialJournalRules,
                    plan: initialPlan,
                    status: 'Active',
                    peakBalance: initialDeposit,
                    trailingHighWaterMark: initialDeposit,
                    currentMaxDrawdown: 0,
                    currentDailyDrawdown: 0,
                    currentProfit: 0,
                    uniqueTradingDays: 0,
                    softBreaches: 0, // Added for stacking rule
                    tradeDrafts: [],
                    activeTradeDraftId: null,
                    executionChecklists: [],
                    activeChecklistId: null,
                    profitableDaysCount: 0,
                };
                set(state => {
                    state.journals.push(newJournal);
                    if (!state.activeJournalId) {
                        state.activeJournalId = newJournal.id;
                    }
                });
            },

            importJournal: (journalData) => {
                set(state => {
                    const existingIndex = state.journals.findIndex(j => j.id === journalData.id);
                    if (existingIndex > -1) {
                        state.journals[existingIndex] = journalData;
                    } else {
                        state.journals.push(journalData);
                    }
                    state.activeJournalId = journalData.id;
                })
            },
            
            deleteJournal: (journalId) => set(state => {
                state.journals = state.journals.filter(j => j.id !== journalId);
                if (state.activeJournalId === journalId) {
                    state.activeJournalId = state.journals.length > 0 ? state.journals[0].id : null;
                }
            }),

            setActiveJournal: (journalId) => set({ activeJournalId: journalId, filters: initialFilterState }),
            
            updateActiveJournal: (updates) => set(state => {
                const journal = state.journals.find(j => j.id === state.activeJournalId);
                if(journal) {
                    Object.assign(journal, updates);
                }
            }),
            
            // --- TRADE MANAGEMENT ---
            addTrade: (tradeData) => {
                set(state => {
                    const journal = state.journals.find(j => j.id === state.activeJournalId);
                    const appSettings = state.appSettings;
                    if (journal && appSettings) {
                        const newId = crypto.randomUUID();
                        
                        const newTradePartial: Partial<Trade> = {
                          ...getSafeInitialFormData(appSettings?.defaultInputs),
                          ...tradeData,
                          id: newId,
                          status: tradeData.closeDate ? 'Closed' : 'Open',
                          avgScoreAtTime: journal.trades.length > 0 ? journal.trades.reduce((acc, t) => acc + t.auto.score.value, 0) / journal.trades.length : 50,
                          avgPlAtTime: journal.trades.length > 0 ? journal.trades.reduce((acc, t) => acc + t.auto.pl, 0) / journal.trades.length : 0,
                        };

                        const autoCalculated = calculateTradeMetrics(newTradePartial as Omit<Trade, 'auto'>, journal, appSettings);
                        const xp = calculateTradeXp({ ...newTradePartial, auto: autoCalculated } as Trade);
                        const newTrade = { ...newTradePartial, auto: { ...autoCalculated, xp } } as Trade;
                        
                        journal.trades.push(newTrade);
                        journal.balance += newTrade.auto.pl;
                        journal.xp += xp;

                        const newAlerts = runAlertEngine(journal, newTrade);
                        if(newAlerts.length > 0) {
                            journal.alerts = [...(journal.alerts || []), ...newAlerts];
                        }
                    }
                });
            },

            updateTrade: (tradeData) => set(state => {
                const journal = state.journals.find(j => j.id === state.activeJournalId);
                const appSettings = state.appSettings;
                if (journal && appSettings) {
                    const tradeIndex = journal.trades.findIndex(t => t.id === tradeData.id);
                    if (tradeIndex !== -1) {
                         const oldPl = journal.trades[tradeIndex].auto.pl;
                         const oldXp = journal.trades[tradeIndex].auto.xp;
                         
                         const autoCalculated = calculateTradeMetrics(tradeData, journal, appSettings);
                         const newXp = calculateTradeXp({ ...tradeData, auto: autoCalculated });
                         const updatedTrade = { ...journal.trades[tradeIndex], ...tradeData, auto: { ...autoCalculated, xp: newXp } };
                         
                         const plDifference = updatedTrade.auto.pl - oldPl;
                         const xpDifference = newXp - oldXp;
                         
                         journal.trades[tradeIndex] = updatedTrade;
                         journal.balance += plDifference;
                         journal.xp += xpDifference;
                    }
                }
            }),

            deleteTrade: (tradeId) => set(state => {
                const journal = state.journals.find(j => j.id === state.activeJournalId);
                if (journal) {
                    const tradeIndex = journal.trades.findIndex(t => t.id === tradeId);
                    if (tradeIndex > -1) {
                        const tradeToDelete = journal.trades[tradeIndex];
                        const trashedItem: TrashedItem = {
                            id: tradeToDelete.id,
                            type: 'trade',
                            journalId: journal.id,
                            deletedAt: new Date().toISOString(),
                            data: tradeToDelete,
                        };
                        
                        journal.balance -= tradeToDelete.auto.pl;
                        journal.xp -= tradeToDelete.auto.xp;
                        journal.trades.splice(tradeIndex, 1);
                        
                        state.appSettings.trash.push(trashedItem);
                    }
                }
            }),

            deleteTrades: (tradeIds) => set(state => {
                const journal = state.journals.find(j => j.id === state.activeJournalId);
                if (journal) {
                    const tradesToDelete = journal.trades.filter(t => tradeIds.includes(t.id));
                    tradesToDelete.forEach(tradeToDelete => {
                        const trashedItem: TrashedItem = {
                            id: tradeToDelete.id,
                            type: 'trade',
                            journalId: journal.id,
                            deletedAt: new Date().toISOString(),
                            data: tradeToDelete,
                        };
                        journal.balance -= tradeToDelete.auto.pl;
                        journal.xp -= tradeToDelete.auto.xp;
                        state.appSettings.trash.push(trashedItem);
                    });
                    journal.trades = journal.trades.filter(t => !tradeIds.includes(t.id));
                }
            }),

            mergeTrades: (tradeIds) => set(state => {
                const journal = state.journals.find(j => j.id === state.activeJournalId);
                if (journal && tradeIds.length > 1) {
                    const tradesToMerge = journal.trades.filter(t => tradeIds.includes(t.id));
                    if (tradesToMerge.length < 2) return;
                    
                    const firstTrade = tradesToMerge[0];
                    const totalLots = tradesToMerge.reduce((sum, t) => sum + t.lotSize, 0);
                    const avgEntry = tradesToMerge.reduce((sum, t) => sum + (t.entryPrice * t.lotSize), 0) / totalLots;
                    const avgClose = tradesToMerge.reduce((sum, t) => sum + ((t.closingPrice || 0) * t.lotSize), 0) / totalLots;
                    const commission = tradesToMerge.reduce((sum, t) => sum + (t.commission || 0), 0);
                    const swap = tradesToMerge.reduce((sum, t) => sum + (t.swap || 0), 0);

                    const mergedTradeData: PartialTrade = {
                        ...firstTrade,
                        lotSize: totalLots,
                        entryPrice: avgEntry,
                        closingPrice: avgClose,
                        commission,
                        swap
                    };
                    
                    const newId = crypto.randomUUID();
                    const auto = calculateTradeMetrics({...mergedTradeData, id: newId }, journal, state.appSettings);
                    const xp = calculateTradeXp({ ...mergedTradeData, auto });
                    const newTrade: Trade = {
                        ...mergedTradeData,
                        id: newId,
                        auto: { ...auto, xp },
                        selectedRuleIds: [],
                    };

                    const tradesToDelete = journal.trades.filter(t => tradeIds.includes(t.id));
                    tradesToDelete.forEach(tradeToDelete => {
                        journal.balance -= tradeToDelete.auto.pl;
                        journal.xp -= tradeToDelete.auto.xp;
                    });
                    journal.trades = journal.trades.filter(t => !tradeIds.includes(t.id));

                    journal.trades.push(newTrade);
                    journal.balance += newTrade.auto.pl;
                    journal.xp += newTrade.auto.xp;
                }
            }),
            
            duplicateTrades: (tradeIds) => set(state => {
                 const journal = state.journals.find(j => j.id === state.activeJournalId);
                 if (journal) {
                    const tradesToDuplicate = journal.trades.filter(t => tradeIds.includes(t.id));
                    tradesToDuplicate.forEach(trade => {
                        const newTrade: Trade = {
                            ...trade,
                            id: crypto.randomUUID(),
                            openDate: new Date().toISOString().split('T')[0],
                        };
                        journal.trades.push(newTrade);
                        journal.balance += newTrade.auto.pl;
                        journal.xp += newTrade.auto.xp;
                    });
                 }
            }),

            updateTradesTag: (tradeIds, tag) => set(state => {
                const journal = state.journals.find(j => j.id === state.activeJournalId);
                if (journal) {
                    journal.trades.forEach(trade => {
                        if(tradeIds.includes(trade.id)) {
                            trade.tag = tag;
                        }
                    })
                }
            }),
            
             openAddTradeDialog: (trade) => set({ isAddTradeDialogOpen: true, addTradePrefillData: trade || null }),
            closeAddTradeDialog: () => set({ isAddTradeDialogOpen: false, addTradePrefillData: null }),

            addTradeDraft: (addTradePrefillData) => {
                let newDraftId = '';
                set(state => {
                    const journal = state.journals.find(j => j.id === state.activeJournalId);
                    if(journal) {
                        const draftCount = (journal.tradeDrafts || []).length;
                        const newDraft: TradeDraft = {
                            id: crypto.randomUUID(),
                            name: `Trade ${draftCount + 1}`,
                            formData: addTradePrefillData ? {
                                ...(addTradePrefillData.id ? addTradePrefillData : getSafeInitialFormData(state.appSettings?.defaultInputs)),
                                ...addTradePrefillData,
                            } : getSafeInitialFormData(state.appSettings?.defaultInputs),
                        };
                        newDraftId = newDraft.id;
                        journal.tradeDrafts = [...(journal.tradeDrafts || []), newDraft];
                        state.activeJournalId = journal.id;
                        journal.activeTradeDraftId = newDraft.id;
                    }
                });
                return newDraftId;
            },

            updateTradeDraft: (draftId, updates) => set(state => {
                 const journal = state.journals.find(j => j.id === state.activeJournalId);
                 if(journal && journal.tradeDrafts) {
                    const index = journal.tradeDrafts.findIndex(d => d.id === draftId);
                    if (index !== -1) {
                        journal.tradeDrafts[index] = { ...journal.tradeDrafts[index], ...updates };
                    }
                 }
            }),
            
            removeTradeDraft: (draftId) => set(state => {
                const journal = state.journals.find(j => j.id === state.activeJournalId);
                if(journal && journal.tradeDrafts) {
                    journal.tradeDrafts = journal.tradeDrafts.filter(d => d.id !== draftId);
                    if(journal.activeTradeDraftId === draftId) {
                        journal.activeTradeDraftId = journal.tradeDrafts.length > 0 ? journal.tradeDrafts[0].id : null;
                    }
                }
            }),

            renameTradeDraft: (draftId, newName) => set(state => {
                const journal = state.journals.find(j => j.id === state.activeJournalId);
                if (journal && journal.tradeDrafts) {
                    const index = journal.tradeDrafts.findIndex(d => d.id === draftId);
                    if (index !== -1) {
                        journal.tradeDrafts[index].name = newName;
                    }
                }
            }),

            setActiveTradeDraftId: (draftId) => set(state => {
                 const journal = state.journals.find(j => j.id === state.activeJournalId);
                 if(journal) {
                    journal.activeTradeDraftId = draftId;
                 }
            }),
            
            toggleCalculator: () => set(state => ({ isCalculatorOpen: !state.isCalculatorOpen })),
            toggleChecklist: () => set(state => ({ isChecklistOpen: !state.isChecklistOpen })),
            setFilterOpen: (open) => set({ isFilterOpen: open }),
            setIsAuditOpen: (open) => set({ isAuditOpen: open }),
            setNotificationsOpen: (open) => set({ isNotificationsOpen: open }),
            setAccountOpen: (open) => set({ isAccountOpen: open }),
            setJournalActionsOpen: (open) => set({ isJournalActionsOpen: open }),

            applyFilters: (newFilters) => set({ filters: newFilters }),
            clearFilters: () => set({ filters: initialFilterState }),
            
            addNote: (noteData) => set(state => {
                const journal = state.journals.find(j => j.id === state.activeJournalId);
                if (journal) {
                    const newNote: Note = {
                        ...noteData,
                        id: crypto.randomUUID(),
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    };
                    if (!journal.notes) journal.notes = [];
                    journal.notes.push(newNote);
                }
            }),
            updateNote: (noteData) => set(state => {
                const journal = state.journals.find(j => j.id === state.activeJournalId);
                if (journal && journal.notes) {
                    const index = journal.notes.findIndex(n => n.id === noteData.id);
                    if (index !== -1) {
                        journal.notes[index] = { ...journal.notes[index], ...noteData, updatedAt: new Date().toISOString() };
                    }
                }
            }),
            deleteNote: (noteId) => set(state => {
                 const journal = state.journals.find(j => j.id === state.activeJournalId);
                if (journal && journal.notes) {
                    const noteIndex = journal.notes.findIndex(n => n.id === noteId);
                    if (noteIndex > -1) {
                        const noteToDelete = journal.notes[noteIndex];
                        const trashedItem: TrashedItem = {
                            id: noteToDelete.id, type: 'note', journalId: journal.id,
                            deletedAt: new Date().toISOString(), data: noteToDelete,
                        };
                        journal.notes.splice(noteIndex, 1);
                        state.appSettings.trash.push(trashedItem);
                    }
                }
            }),
            deleteNotes: (noteIds) => set(state => {
                 const journal = state.journals.find(j => j.id === state.activeJournalId);
                 if (journal && journal.notes) {
                    noteIds.forEach(noteId => {
                        const noteIndex = journal.notes.findIndex(n => n.id === noteId);
                        if (noteIndex > -1) {
                            const noteToDelete = journal.notes[noteIndex];
                            const trashedItem: TrashedItem = { id: noteToDelete.id, type: 'note', journalId: journal.id, deletedAt: new Date().toISOString(), data: noteToDelete };
                            state.appSettings.trash.push(trashedItem);
                            journal.notes?.splice(noteIndex, 1);
                        }
                    });
                }
            }),
            duplicateNotes: (noteIds) => set(state => {
                const journal = state.journals.find(j => j.id === state.activeJournalId);
                if (journal && journal.notes) {
                    const notesToDup = journal.notes.filter(n => noteIds.includes(n.id));
                    notesToDup.forEach(note => {
                        const newNote: Note = { ...note, id: crypto.randomUUID(), title: `${note.title} (Copy)`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
                        journal.notes?.push(newNote);
                    });
                }
            }),
            moveNotesToFolder: (noteIds, folderId) => set(state => {
                 const journal = state.journals.find(j => j.id === state.activeJournalId);
                 if (journal && journal.notes) {
                    journal.notes.forEach(note => {
                        if (noteIds.includes(note.id)) {
                            note.folderId = folderId === 'unfiled' ? undefined : folderId;
                        }
                    });
                 }
            }),
            addTagsToNotes: (noteIds, tags) => set(state => {
                 const journal = state.journals.find(j => j.id === state.activeJournalId);
                 if (journal && journal.notes) {
                    journal.notes.forEach(note => {
                        if (noteIds.includes(note.id)) {
                            const newTags = new Set([...note.tags, ...tags]);
                            note.tags = Array.from(newTags);
                        }
                    });
                 }
            }),

            addNoteFolder: (name) => {
                const newFolder: NoteFolder = { id: crypto.randomUUID(), name };
                set(state => {
                    const journal = state.journals.find(j => j.id === state.activeJournalId);
                    if(journal) {
                        if(!journal.noteFolders) journal.noteFolders = [];
                        journal.noteFolders.push(newFolder);
                    }
                });
                return newFolder.id;
            },
            updateNoteFolder: (id, name) => set(state => {
                 const journal = state.journals.find(j => j.id === state.activeJournalId);
                 if(journal && journal.noteFolders) {
                    const index = journal.noteFolders.findIndex(f => f.id === id);
                    if(index > -1) journal.noteFolders[index].name = name;
                 }
            }),
            deleteNoteFolder: (id) => set(state => {
                 const journal = state.journals.find(j => j.id === state.activeJournalId);
                 if(journal) {
                    if(journal.noteFolders) {
                        journal.noteFolders = journal.noteFolders.filter(f => f.id !== id);
                    }
                    if(journal.notes) {
                        journal.notes.forEach(note => {
                            if(note.folderId === id) {
                                note.folderId = undefined; // Move notes to unfiled
                            }
                        });
                    }
                 }
            }),

            addStrategy: (strategyData) => set(state => {
                const journal = state.journals.find(j => j.id === state.activeJournalId);
                if (journal) {
                    const newStrategy: Strategy = { ...strategyData, id: crypto.randomUUID() };
                    if (!journal.strategies) journal.strategies = [];
                    journal.strategies.push(newStrategy);
                }
            }),
            updateStrategy: (strategyData) => set(state => {
                const journal = state.journals.find(j => j.id === state.activeJournalId);
                if (journal && journal.strategies) {
                    const index = journal.strategies.findIndex(s => s.id === strategyData.id);
                    if (index > -1) journal.strategies[index] = strategyData;
                }
            }),
            deleteStrategy: (strategyId) => set(state => {
                 const journal = state.journals.find(j => j.id === state.activeJournalId);
                 if (journal) {
                    const strategyToDelete = journal.strategies?.find(s => s.id === strategyId);
                    if(strategyToDelete) {
                        const trashedItem: TrashedItem = { id: strategyId, type: 'strategy', journalId: journal.id, deletedAt: new Date().toISOString(), data: strategyToDelete };
                        state.appSettings.trash.push(trashedItem);
                    }
                    if(journal.strategies) journal.strategies = journal.strategies.filter(s => s.id !== strategyId);
                 }
            }),

            addMarketLink: (link) => set(state => {
                const journal = state.journals.find(j => j.id === state.activeJournalId);
                if (journal) {
                    const newLink: MarketLink = { ...link, id: crypto.randomUUID() };
                    if(!journal.marketLinks) journal.marketLinks = [];
                    journal.marketLinks.push(newLink);
                }
            }),
             updateMarketLink: (link) => set(state => {
                const journal = state.journals.find(j => j.id === state.activeJournalId);
                if (journal && journal.marketLinks) {
                    const index = journal.marketLinks.findIndex(l => l.id === link.id);
                    if (index > -1) journal.marketLinks[index] = link;
                }
            }),
             deleteMarketLink: (linkId) => set(state => {
                 const journal = state.journals.find(j => j.id === state.activeJournalId);
                 if (journal) {
                    const linkToDelete = journal.marketLinks?.find(l => l.id === linkId);
                    if(linkToDelete) {
                        const trashedItem: TrashedItem = { id: linkId, type: 'marketLink', journalId: journal.id, deletedAt: new Date().toISOString(), data: linkToDelete };
                        state.appSettings.trash.push(trashedItem);
                    }
                    if(journal.marketLinks) journal.marketLinks = journal.marketLinks.filter(l => l.id !== linkId);
                 }
            }),
            
             updateProfitSplits: (splits) => set(state => {
                const journal = state.journals.find(j => j.id === state.activeJournalId);
                if(journal) journal.profitSplits = splits;
            }),

            recordDeposit: (amount, date, note) => set(state => {
                const journal = state.journals.find(j => j.id === state.activeJournalId);
                if (journal) {
                    journal.capital += amount;
                    journal.balance += amount;
                    if(!journal.transactions) journal.transactions = [];
                    journal.transactions.push({ id: crypto.randomUUID(), type: 'Deposit', amount, date, note });
                }
            }),
            recordWithdrawal: (amount, date, note) => set(state => {
                const journal = state.journals.find(j => j.id === state.activeJournalId);
                if (journal && journal.balance >= amount) {
                    journal.capital -= amount;
                    journal.balance -= amount;
                    if(!journal.transactions) journal.transactions = [];
                    journal.transactions.push({ id: crypto.randomUUID(), type: 'Withdrawal', amount, date, note });
                }
            }),

            updateTradingPlan: (newPlan) => set(state => {
                const journal = state.journals.find(j => j.id === state.activeJournalId);
                if (journal) {
                    journal.plan = newPlan;
                }
            }),
            
            updateJournalRules: (newRules) => set(state => {
                 const journal = state.journals.find(j => j.id === state.activeJournalId);
                 if (journal) {
                    journal.rules = newRules;
                 }
            }),
            resetJournalRules: () => set(state => {
                const journal = state.journals.find(j => j.id === state.activeJournalId);
                if (journal) {
                    journal.rules = initialJournalRules;
                    journal.status = 'Active';
                    journal.currentDailyDrawdown = 0;
                    journal.currentMaxDrawdown = 0;
                    journal.currentProfit = 0;
                    journal.uniqueTradingDays = 0;
                    journal.softBreaches = 0;
                    journal.peakBalance = journal.capital;
                    journal.trailingHighWaterMark = journal.capital;
                }
            }),
            
            addAlert: (alert) => set(state => {
                const journal = state.journals.find(j => j.id === state.activeJournalId);
                if (journal) {
                    const newAlert: Alert = { ...alert, id: crypto.randomUUID(), timestamp: new Date().toISOString(), seen: false };
                    journal.alerts = [...(journal.alerts || []), newAlert];
                }
            }),
            dismissAlert: (alertId) => set(state => {
                 const journal = state.journals.find(j => j.id === state.activeJournalId);
                 if (journal && journal.alerts) {
                    const alert = journal.alerts.find(a => a.id === alertId);
                    if (alert) alert.seen = true;
                 }
            }),
            clearAlerts: (alertIds) => set(state => {
                 const journal = state.journals.find(j => j.id === state.activeJournalId);
                 if (journal && journal.alerts) {
                    journal.alerts = alertIds ? journal.alerts.filter(a => !alertIds.includes(a.id)) : [];
                 }
            }),

            updateAppSettings: (settings) => set(state => {
                state.appSettings = { ...state.appSettings, ...settings };
            }),
            updateSoundSettings: (settings) => set(state => {
                const journal = state.journals.find(j => j.id === state.activeJournalId);
                if(journal) {
                    if(!journal.soundSettings) journal.soundSettings = initialSoundSettings;
                    journal.soundSettings = { ...journal.soundSettings, ...settings };
                }
            }),
            updateVisualSettings: (settings) => set(state => {
                const journal = state.journals.find(j => j.id === state.activeJournalId);
                if(journal) {
                    if(!journal.visualSettings) journal.visualSettings = initialVisualSettings;
                    journal.visualSettings = { ...journal.visualSettings, ...settings };
                }
            }),
            resetSoundSettings: () => set(state => {
                 const journal = state.journals.find(j => j.id === state.activeJournalId);
                 if(journal) journal.soundSettings = initialSoundSettings;
            }),
            resetVisualSettings: () => set(state => {
                const journal = state.journals.find(j => j.id === state.activeJournalId);
                if(journal) journal.visualSettings = initialVisualSettings;
            }),
            resetDatabaseSettings: () => set(state => {
                state.appSettings.pairsConfig = defaultPairsConfig;
                state.appSettings.quotes = quotes;
                state.appSettings.tips = tips;
                state.appSettings.advice = advice;
                state.appSettings.notes = defaultNotes;
            }),
            resetShortcuts: () => set(state => {
                state.appSettings.shortcuts = defaultShortcuts;
            }),
            
            restoreFromTrash: (itemId) => set(state => {
                const itemToRestore = state.appSettings.trash.find(item => item.id === itemId);
                if (itemToRestore) {
                    const journal = state.journals.find(j => j.id === itemToRestore.journalId);
                    if (journal) {
                        switch(itemToRestore.type) {
                            case 'trade':
                                const tradeData = itemToRestore.data as Trade;
                                journal.trades.push(tradeData);
                                journal.balance += tradeData.auto.pl;
                                journal.xp += tradeData.auto.xp;
                                break;
                            case 'note':
                                journal.notes = [...(journal.notes || []), itemToRestore.data];
                                break;
                             case 'strategy':
                                journal.strategies = [...(journal.strategies || []), itemToRestore.data];
                                break;
                            case 'marketLink':
                                journal.marketLinks = [...(journal.marketLinks || []), itemToRestore.data];
                                break;
                        }
                    }
                    state.appSettings.trash = state.appSettings.trash.filter(item => item.id !== itemId);
                }
            }),
            permanentlyDeleteItem: (itemId) => set(state => {
                state.appSettings.trash = state.appSettings.trash.filter(item => item.id !== itemId);
            }),
            emptyTrash: (journalId) => set(state => {
                state.appSettings.trash = state.appSettings.trash.filter(i => i.journalId !== journalId);
            }),
            
            clearBackupFileHandle: () => set(state => {
                if(state.activeJournalId) {
                    deleteHandle(state.activeJournalId);
                }
            }),
            
        })),
        {
            name: 'md-journal-storage',
            storage: createJSONStorage(() => localStorage),
            onRehydrateStorage: (state) => {
                if (state) state._hasHydrated = true;
            },
             migrate: (persistedState, version) => {
                if (version === 0) {
                    // migration logic from version 0 to 1
                }
                return persistedState as JournalState;
            },
            version: 1, 
        }
    )
);

    



    

    

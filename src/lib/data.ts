

import type { Shortcut, NewsEvent, Currency } from '@/types';

export const quotes = [
    { quote: "The stock market is a device for transferring money from the impatient to the patient.", author: "Warren Buffett" },
    { quote: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
    { quote: "The four most dangerous words in investing are: 'This time it's different.'", author: "Sir John Templeton" },
    { quote: "In investing, what is comfortable is rarely profitable.", author: "Robert Arnott" },
    { quote: "The goal of a successful trader is to make the best trades. Money is secondary.", author: "Alexander Elder" },
    { quote: "It's not whether you're right or wrong that's important, but how much money you make when you're right and how much you lose when you're wrong.", author: "George Soros" },
    { quote: "Amateurs think about how much money they can make. Professionals think about how much they could lose.", author: "Jack Schwager" },
    { quote: "The secret to being successful from a trading perspective is to have an indefatigable and an undying and unquenchable thirst for information and knowledge.", author: "Paul Tudor Jones" },
    { quote: "The market can stay irrational longer than you can stay solvent.", author: "John Maynard Keynes" },
    { quote: "I will keep cutting my losses short and letting my profits run.", author: "Ed Seykota" },
    { quote: "The key to trading success is emotional discipline. If intelligence were the key, there would be a lot more people making money.", author: "Victor Sperandeo" },
    { quote: "There is a time to go long, a time to go short, and a time to go fishing.", author: "Jesse Livermore" },
    { quote: "I just wait until there is money lying in the corner, and all I have to do is go over there and pick it up. I do nothing in the meantime.", author: "Jim Rogers" },
    { quote: "The elements of good trading are: (1) cutting losses, (2) cutting losses, and (3) cutting losses.", author: "Ed Seykota" },
    { quote: "If you can't take a small loss, sooner or later you will take the mother of all losses.", author: "Ed Seykota" },
    { quote: "The hard work in trading comes in the preparation. The actual trading should be effortless.", author: "Jack Schwager" },
    { quote: "Letting losses run is the most serious mistake made by most investors.", author: "William O'Neil" },
    { quote: "The game of speculation is the most uniformly fascinating game in the world. But it is not a game for the stupid, the mentally lazy, the person of inferior emotional balance, or the get-rich-quick adventurer.", author: "Jesse Livermore" },
    { quote: "In this business, if you're good, you're right six times out of ten. You're never going to be right nine times out of ten.", author: "Peter Lynch" },
    { quote: "The desire for constant action is a major obstacle to profitability.", author: "M.Danial" }
];

export const tips: { text: string }[] = [
    { text: "Use the Dashboard's Stat Cards for a quick glance at your P/L, Win Rate, and Profit Factor. It's your daily performance snapshot." },
    { text: "In the Data Table, click on any column header with an arrow icon to sort your entire trade history by that metric." },
    { text: "On the Chart Lab page, click directly on a point in the Equity Curve to instantly open the detailed view for that specific trade." },
    { text: "Use the 'Find Edge' (Pivot Table) to group your trades by 'Session' and then by 'Pair' to find which pair you trade best during London." },
    { text: "Follow the 'Execution Steps' checklist before every trade. It validates your plan rules and loads your strategy to keep you disciplined." },
    { text: "On the 'AI Analytics' page, click 'Analyze My Trades' to get an instant breakdown of your best and worst performing strategies and pairs." },
    { text: "In the Calendar view, click on any day to see a pop-up with a detailed table of all trades taken on that date." },
    { text: "Use the 'Monte Carlo Simulator' with your historical stats to see the statistical probabilities of your strategy's future performance." },
    { text: "Before entering a trade, use the 'Lot Size Calculator' to ensure your position size aligns with your 1-2% risk rule." },
    { text: "Create a new note in the 'Notes' section for each trading week to summarize your lessons learned and goals for the next week." },
    { text: "Log trades you hesitated on as 'Missed Trades'. This helps you analyze the profitability of setups you were scared to take." },
    { text: "In the 'Web Tools' section, add a custom link to your favorite economic calendar site for quick access." },
    { text: "Define your rules (max daily loss, risk per trade) in the 'Trading Plan' tab to get real-time feedback on your discipline." },
    { text: "In 'Plans > Strategies', build a new strategy with specific rules for Bias, POI, and Confirmation to quantify your edge." },
    { text: "When logging a trade, use the 'Sentiment' dropdowns. This data is used by the AI to find correlations between emotion and performance." },
    { text: "Use the 'Global Filter' (Alt+F) to filter by a specific strategy, then go to the Chart Lab to see the equity curve for only that strategy." },
    { text: "In 'Journal Actions > Transactions', record every deposit and withdrawal to keep your 'Capital' metric accurate for risk calculations." },
    { text: "Customize dropdowns in 'Settings > App Manager > Inputs' to add your own unique entry reasons or trade tags." },
    { text: "Check your rank on the Leaderboard in the 'Gamification Center' to see how your performance compares to simulated traders at your level." },
    { text: "Run the 'Data Auditor' from the header periodically to find and fix any calculation errors in your journal, ensuring your analytics are accurate." }
];

export const advice: { text: string }[] = [
    { text: "Regularly checking your Dashboard stats keeps you accountable to your performance goals and provides immediate feedback on your recent trading." },
    { text: "Sorting the Data Table by 'P/L' allows you to quickly find and review your biggest winning and losing trades for valuable lessons." },
    { text: "Analyzing your Equity Curve in the Chart Lab helps you visually understand your system's volatility and drawdown periods, promoting better emotional stability." },
    { text: "The 'Find Edge' tool is invaluable for discovering hyper-specific, profitable niches, such as 'shorting US30 during the first hour of New York'." },
    { text: "Using the 'Execution Steps' checklist builds the muscle memory for disciplined trading, which is the true foundation of long-term profitability." },
    { text: "The 'AI Analytics' engine saves you hours of manual review by automatically highlighting the most critical patterns in your trading performance." },
    { text: "The Calendar view provides a macro perspective on your performance, helping you identify if you perform better or worse on certain days of the week." },
    { text: "The Simulator builds statistical confidence. Knowing your strategy has a positive expectancy over 10,000 simulated trades makes it easier to endure a losing streak." },
    { text: "Proper position sizing, managed via the Calculators, is the single most important factor in capital preservation and long-term survival." },
    { text: "A well-maintained Notes section becomes your personal 'second brain,' a searchable database of all your market insights and psychological breakthroughs." },
    { text: "Analyzing Missed Trades reveals the cost of hesitation. Seeing the potential profit you left on the table is a powerful motivator to follow your plan." },
    { text: "The Market Hub centralizes your workflow, reducing the need to switch between browser tabs and keeping you focused on the charts." },
    { text: "A concrete Trading Plan turns trading from a chaotic gamble into a structured business, where decisions are based on logic, not emotion." },
    { text: "Quantifying your Strategies with the rule builder allows you to objectively measure what works, enabling you to double down on your edge." },
    { text: "Logging your Sentiments provides crucial data that links your psychological state to your P/L, helping you conquer emotional trading." },
    { text: "The Global Filter is your gateway to deep analysis. It allows you to isolate any variable and see its impact across all other performance metrics." },
    { text: "Accurate Transaction records ensure your risk calculations are always based on your true available capital, preventing catastrophic losses." },
    { text: "Customizing your app's Inputs makes the journaling process faster and more personal, increasing the likelihood you'll stick with it." },
    { text: "The Gamification Center makes the often-difficult process of disciplined trading more engaging and rewarding, reinforcing good habits." },
    { text: "Using the Data Auditor guarantees that the insights you derive from your journal are based on truth, not on calculation errors." }
];

export const defaultShortcuts: Shortcut[] = [
    { action: 'Add New Trade', keys: ['Alt', 'N'] },
    { action: 'Save Trade', keys: ['Alt', 'S'] },
    { action: 'Open Global Filter', keys: ['Alt', 'F'] },
    { action: 'Open Settings', keys: ['Alt', 'S'] },
    { action: 'Open Support', keys: ['?'] },
    { action: 'Open Account Management', keys: ['Cmd', 'A'] },
    { action: 'Open Gamification Center', keys: ['Alt', 'G'] },
    { action: 'Open Data Auditor', keys: ['Alt', 'Shift', 'A'] },
    { action: 'Open Transactions', keys: ['Alt', 'T'] },
    { action: 'Open Profit Splitter', keys: ['Alt', 'P'] },
    { action: 'Open Funded Rules', keys: ['Alt', 'F'] },
    { action: 'Open Import', keys: ['Alt', 'I'] },
    { action: 'Delete Action', keys: ['Delete'] },
    { action: 'Navigate to Charts', keys: ['Alt', 'C'] },
    { action: 'Navigate to Analytics', keys: ['Shift', 'A'] },
    { action: 'Navigate to Home', keys: ['Shift', 'H'] },
    { action: 'Navigate to Simulator', keys: ['Shift', 'S'] },
    { action: 'Navigate to Table', keys: ['Shift', 'T'] },
    { action: 'Navigate to Calendar', keys: ['Shift', 'D'] },
    { action: 'Navigate to Market', keys: ['Shift', 'M'] },
    { action: 'Navigate to Notes', keys: ['Shift', 'N'] },
    { action: 'Navigate to Plans', keys: ['Shift', 'P'] },
    { action: 'Undo', keys: ['Alt', 'Z'] },
    { action: 'Redo', keys: ['Alt', 'Y'] },
  ];

export const pairsConfig = {
    // Forex Majors
    "EURUSD": { pipSize: 0.0001, pipValue: 10, spread: 0.9, iconName: 'EURUSD' },
    "GBPUSD": { pipSize: 0.0001, pipValue: 10, spread: 1.1, iconName: 'GBPUSD' },
    "USDJPY": { pipSize: 0.01, pipValue: 8.86, spread: 1.0, iconName: 'USDJPY' },
    "AUDUSD": { pipSize: 0.0001, pipValue: 10, spread: 0.9, iconName: 'AUDUSD' },
    "USDCAD": { pipSize: 0.0001, pipValue: 10, spread: 1.5, iconName: 'USDCAD' },
    "USDCHF": { pipSize: 0.0001, pipValue: 10, spread: 1.4, iconName: 'USDCHF' },
    "NZDUSD": { pipSize: 0.0001, pipValue: 10, spread: 1.4, iconName: 'NZDUSD' },

    // Forex Minors
    "EURGBP": { pipSize: 0.0001, pipValue: 13.56, spread: 1.0, iconName: 'EURGBP' },
    "EURJPY": { pipSize: 0.01, pipValue: 6.77, spread: 1.6, iconName: 'EURJPY' },
    "EURAUD": { pipSize: 0.0001, pipValue: 6.458, spread: 2.0, iconName: 'EURAUD' },
    "EURCAD": { pipSize: 0.0001, pipValue: 7.222, spread: 2.5, iconName: 'EURCAD' },
    "EURCHF": { pipSize: 0.0001, pipValue: 12.5522, spread: 2.0, iconName: 'EURCHF' },
    "GBPJPY": { pipSize: 0.01, pipValue: 6.7719, spread: 2.5, iconName: 'GBPJPY' },
    "GBPAUD": { pipSize: 0.0001, pipValue: 6.6481, spread: 2.5, iconName: 'GBPAUD' },
    "GBPCAD": { pipSize: 0.0001, pipValue: 7.222, spread: 3.0, iconName: 'GBPCAD' },
    "GBPCHF": { pipSize: 0.0001, pipValue: 12.552249, spread: 2.5, iconName: 'GBPCHF' },
    "AUDJPY": { pipSize: 0.01, pipValue: 6.771949, spread: 1.6, iconName: 'AUDJPY' },
    "AUDCAD": { pipSize: 0.0001, pipValue: 7.2221, spread: 2.0, iconName: 'AUDCAD' },
    "AUDCHF": { pipSize: 0.0001, pipValue: 12.5523, spread: 2.5, iconName: 'AUDCHF' },
    "CADJPY": { pipSize: 0.01, pipValue: 6.771948, spread: 1.8, iconName: 'CADJPY' },
    "CHFJPY": { pipSize: 0.01, pipValue: 6.771948, spread: 2.0, iconName: 'CHFJPY' },
    "NZDJPY": { pipSize: 0.01, pipValue: 6.771948, spread: 2.2, iconName: 'NZDJPY' },

    // Forex Exotics
    "USDMXN": { pipSize: 0.0001, pipValue: 5.8, spread: 20.0, iconName: 'USDMXN' },
    "USDTRY": { pipSize: 0.0001, pipValue: 3.1, spread: 35.0, iconName: 'USDTRY' },
    "USDZAR": { pipSize: 0.0001, pipValue: 5.5, spread: 17.5, iconName: 'USDZAR' },
    "EURNOK": { pipSize: 0.0001, pipValue: 9.6, spread: 22.5, iconName: 'EURNOK' },
    "EURSEK": { pipSize: 0.0001, pipValue: 9.5, spread: 15.0, iconName: 'EURSEK' },
    "USDHKD": { pipSize: 0.0001, pipValue: 1.2, spread: 10.0, iconName: 'USDHKD' },
    
    // Metals
    "XAUUSD": { pipSize: 0.1, pipValue: 10, spread: 1.12, iconName: 'XAUUSD' },
    "XAGUSD": { pipSize: 0.001, pipValue: 5, spread: 3.6, iconName: 'XAGUSD' },
    "XPTUSD": { pipSize: 0.01, pipValue: 1, spread: 83.2, iconName: 'Component' },
    "XPDUSD": { pipSize: 0.01, pipValue: 1, spread: 190.4, iconName: 'Component' },

    // Indices
    "AUS200": { pipSize: 1, pipValue: 1, spread: 70.7, iconName: 'Component' },
    "DE30": { pipSize: 1, pipValue: 1, spread: 8.5, iconName: 'Component' },
    "FR40": { pipSize: 1, pipValue: 1, spread: 32.1, iconName: 'Component' },
    "HK50": { pipSize: 1, pipValue: 1, spread: 29.5, iconName: 'Component' },
    "JP225": { pipSize: 1, pipValue: 1, spread: 17.8, iconName: 'Component' },
    "STOXX50": { pipSize: 1, pipValue: 1, spread: 51.8, iconName: 'Component' },
    "UK100": { pipSize: 0.1, pipValue: 1, spread: 66.6, iconName: 'Component' },
    "US30": { pipSize: 1, pipValue: 1, spread: 2.6, iconName: 'Component' },
    "US500": { pipSize: 0.1, pipValue: 1, spread: 5.9, iconName: 'Component' },
    "USTEC": { pipSize: 0.1, pipValue: 1, spread: 20.1, iconName: 'Component' },

    // Crypto
    "BTCUSD": { pipSize: 0.01, pipValue: 0.01, spread: 25.0, iconName: 'BTCUSD' },
    "ETHUSD": { pipSize: 0.01, pipValue: 1, spread: 1.5, iconName: 'ETHUSD' },
    
    // Oil
    "USOIL": { pipSize: 0.01, pipValue: 10, spread: 0.8, iconName: 'Droplets' },

    // Default
    "Other": { pipSize: 0.0001, pipValue: 10, spread: 2.0 },
};

export const tradingViewSymbolMap: Record<string, { proName: string, title: string }> = {
    "EURUSD": { "proName": "OANDA:EURUSD", "title": "EURUSD" },
    "GBPUSD": { "proName": "OANDA:GBPUSD", "title": "GBPUSD" },
    "USDJPY": { "proName": "OANDA:USDJPY", "title": "USDJPY" },
    "AUDUSD": { "proName": "OANDA:AUDUSD", "title": "AUDUSD" },
    "USDCAD": { "proName": "OANDA:USDCAD", "title": "USDCAD" },
    "USDCHF": { "proName": "OANDA:USDCHF", "title": "USDCHF" },
    "NZDUSD": { "proName": "OANDA:NZDUSD", "title": "NZDUSD" },
    "XAUUSD": { "proName": "OANDA:XAUUSD", "title": "XAUUSD (gold)" },
    "USOIL": { "proName": "OANDA:WTICOUSD", "title": "US Oil" },
    "US30": { "proName": "FOREXCOM:DJI", "title": "Dow Jones" },
    "US500": { "proName": "FOREXCOM:SPXUSD", "title": "S&P 500" },
    "USTEC": { "proName": "FOREXCOM:NSXUSD", "title": "Nasdaq 100" },
    "DE30": { "proName": "OANDA:DE30EUR", "title": "DAX 30" },
    "BTCUSD": { "proName": "BITSTAMP:BTCUSD", "title": "Bitcoin" },
    "ETHUSD": { "proName": "BITSTAMP:ETHUSD", "title": "Ethereum" },
};

export type NewsImpact = 'High' | 'Medium' | 'Low' | 'Holiday';

export type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD' | 'NZD' | 'CHF' | 'CNY' | 'Other';

export const newsDatabase: Record<Currency, NewsEvent[]> = {
    "USD": [
        { name: "Interest Rate Decision / FOMC", impact: 'High' },
        { name: "Non-Farm Payrolls (NFP)", impact: 'High' },
        { name: "Consumer Price Index (CPI)", impact: 'High' },
        { name: "Core CPI", impact: 'High' },
        { name: "Core PCE Price Index", impact: 'High' },
        { name: "GDP", impact: 'High' },
        { name: "ISM Manufacturing/Services PMI", impact: 'High' },
        { name: "Retail Sales", impact: 'Medium' },
        { name: "Unemployment Rate", impact: 'Medium'},
        { name: "Jobless Claims", impact: 'Medium' },
        { name: "Durable Goods Orders", impact: 'Medium' },
        { name: "Producer Price Index (PPI)", impact: 'Medium' },
        { name: "JOLTS Job Openings", impact: 'Medium' },
        { name: "Average Hourly Earnings", impact: 'Medium' },
        { name: "Consumer Confidence/Sentiment", impact: 'Medium' },
        { name: "EIA Crude Oil Stocks", impact: 'Medium' },
        { name: "Trade Balance", impact: 'Low' },
        { name: "Housing Starts", impact: 'Low' },
        { name: "Factory Orders", impact: 'Low' },
    ],
    "EUR": [
        { name: "ECB Interest Rate Decision", impact: 'High' },
        { name: "Eurozone GDP / German GDP", impact: 'High' },
        { name: "CPI", impact: 'High' },
        { name: "PMI", impact: 'Medium' },
        { name: "Economic Sentiment", impact: 'Medium' },
    ],
    "GBP": [
        { name: "BoE Interest Rate Decision", impact: 'High' },
        { name: "GDP", impact: 'High' },
        { name: "CPI", impact: 'High' },
        { name: "Retail Sales", impact: 'High' },
        { name: "Claimant Count Change", impact: 'Medium' },
        { name: "PMI", impact: 'Medium' },
    ],
    "JPY": [
        { name: "BoJ Interest Rate Decision", impact: 'High' },
        { name: "GDP", impact: 'High' },
        { name: "CPI", impact: 'High' },
        { name: "Trade Balance", impact: 'Low' },
        { name: "Household Spending", impact: 'Low' },
    ],
    "CAD": [
        { name: "BoC Interest Rate Decision", impact: 'High' },
        { name: "Employment Change", impact: 'High' },
        { name: "CPI", impact: 'High' },
        { name: "Trade Balance", impact: 'Medium' },
        { name: "GDP", impact: 'Medium' },
    ],
    "AUD": [
        { name: "RBA Interest Rate Decision", impact: 'High' },
        { name: "Employment Change", impact: 'High' },
        { name: "CPI", impact: 'High' },
        { name: "Trade Balance", impact: 'Medium' },
        { name: "Retail Sales", impact: 'Medium' },
    ],
    "NZD": [
        { name: "RBNZ Interest Rate Decision", impact: 'High' },
        { name: "CPI", impact: 'High' },
        { name: "Global Dairy Trade (GDT) Price Index", impact: 'Medium' },
        { name: "GDP", impact: 'Medium' },
    ],
    "CHF": [
        { name: "SNB Interest Rate Decision", impact: 'High' },
        { name: "Trade Balance", impact: 'Medium' },
        { name: "CPI", impact: 'Medium' },
    ],
    "CNY": [
        { name: "GDP", impact: 'High'},
        { name: "PMI", impact: 'High'},
        { name: "Trade Balance", impact: 'Medium'},
        { name: "CPI", impact: 'Medium'}
    ],
     "Other": [
        { name: "Bank Holiday", impact: 'Holiday' },
    ]
};

export const pairs = Object.keys(pairsConfig);

export const timeframes = ["1min", "2min", "3min", "5min", "15min", "30min", "45min", "1hr", "2hr", "3hr", "4hr", "8hr", "1D", "1W", "1M"];
export const trends = ["Bullish", "Bearish", "Range", "Trending", "Bullish/Bearish", "Other"];
export const zones = ["Discount", "Premium", "Equilibrium", "Fibonacci"];
export const points = ["Decisive", "Extreme"];
export const fibonacciLevels = ['0%', '23.6%', '38.2%', '50%', '61.8%', '78.6%', '100%'];
export const liquidityTypes = [
    "Imbalance (Fvg)", "Order Block (OB)", "Supply", "Demand", "Inducement", 
    "Failed OB", "Failed Fvg", "Previous Day High", "Previous Day Low", 
    "Swing High", "Swing Low", "Equal Highs", "Equal Lows", "Asian Session High", 
    "Asian Session Low", "Trend Line Liquidity", "Support", "Resistance", 
    "NewYork High", "NewYork Low", "London High", "London Low", 
    "Fib Retracment Level", "Fractal High", "Fractal Low", "Mitigation Block", 
    "Daily High", "Daily Low", "other"
];
export const liquidityStatus = ["Swept", "Not Swept", "Cross", "Picked", "Not Picked"];
export const entryReasonCategories = ["Structure", "Pattern", "News", "Indicator"];
export const structureEntryReasons = ["Continuation", "Market Shift (MS)", "Retracement after MS", "BOS", "Break", "Inverse Closing", "Trap Candle", "Liquidity Grab", "Engulfing Candle"];
export const patternEntryReasons = ["Bull Flag", "Bear Flag", "Raising Wedge", "Falling Wedge", "Ascending Triangle", "Descending Triangle", "Head & Shoulder", "Double Top", "Double Bottom", "Cup & Handle", "Triple Top", "Triple Bottom"];
export const indicatorEntryReasons = {
    "RSI": ["Bullish Divergence", "Bearish Divergence", "Return From 80", "Return From 70", "Return From 20", "Return from 30"],
    "Moving Average (MA)": ["Price Crossover", "Golden Cross (Short MA Cross Above Long MA)", "Death Cross (Short MA Cross Below Long MA)"],
    "Volume": ["Increasing", "Decreasing", "Low Volume", "Normal Volume", "High Volume", "Ultra High Volume"]
};

export const tradeManagementTypes = ["Breakeven", "Partial Close", "SL Trailing"];
export const tradeManagementTriggers = ["After 1:2 RR", "After MS", "After 1st BOS", "After 1st Candle Close Against", "Immediately"];
export const sessions = ["Asian", "London", "NewYork"];
export const directions = ["Buy", "Sell"];

export const sentiments = [
    // Good Sentiments     // Bad Sentiments
    "Satisfaction",
    "Clarity",
    "Patience",
    "Confidence",
    "Calmness",
    "Anxiety",
    "Frustration",
    "Panic",
    "Impatience",
    "Greed",
    "Overconfidence",
    "Hope (in a losing trade)",
    "Regret",
    "Revenge",
    "Sadness",
    "Composure",
    "Decisiveness",
    "Resilience",
    "Self-awareness",
    "Grit",
    "Objectivity",
    "Adaptability",
    "Contentment",
    "Calculated Fear",
    "Gratitude",
    "Discipline",
    "Detachment",
    "Humility",
    "Impulsivity",
    "Desperation",
    "Cognitive Dissonance",
    "Attachment",
    "Denial",
];

export const limitTypes = ["Daily Trades", "Risk Per Trade", "Max Drawdown", "Daily Profit", "Monthly Target", "Weekly Target", "Weekly Drawdown"];
export const volatilityTypes = ["High", "Low", "Normal"];

export const structureTypes = ["External", "Internal"];
export const mainMinor = ["Main", "Minor"];

export const ruleTypeOptions: { value: string; label: string }[] = [
    { value: 'pair', label: 'Pair' },
    { value: 'direction', label: 'Direction' },
    { value: 'session', label: 'Session' },
    { value: 'volatility', label: 'Volatility' },
    { value: 'bias', label: 'Bias' },
    { value: 'zone', label: 'Zone' },
    { value: 'liquidity', label: 'Liquidity' },
    { value: 'entryReason', label: 'Entry Reason' },
    { value: 'tradeManagement', label: 'Trade Management' },
    { value: 'limit', label: 'Limit' },
    { value: 'structure', label: 'Structure' },
    { value: 'custom', label: 'Custom' },
];

export const ruleBuilderOptions = {
    idea: [
        { value: 'bias.structure', label: 'Bias Structure' },
        { value: 'discountPremiumZones.area', label: 'Price Zone' },
    ],
    poi: [
        { value: 'liquidity.type', label: 'Liquidity Type' },
        { value: 'liquidity.status', label: 'Liquidity Status' },
    ],
    confirmation: [
         { value: 'pair', label: 'Pair' },
         { value: 'direction', label: 'Direction' },
         { value: 'auto.session', label: 'Session' },
    ]
};

export const notes = [
    { title: 'My First Note', content: 'This is a default note to get you started.' }
];

export const defaultNotes = [
    { title: 'My First Note', content: 'This is a default note to get you started.' }
];

export const institutionalPois = [
    "Imbalance (Fvg)", "Order Block (OB)", "Supply", "Demand", "Inducement", 
    "Failed OB", "Failed Fvg"
];

export const structuralPois = [
    "Previous Day High", "Previous Day Low", "Swing High", "Swing Low", "Equal Highs", "Equal Lows",
    "Asian Session High", "Asian Session Low", "Trend Line Liquidity", "Support", "Resistance", 
    "NewYork High", "NewYork Low", "London High", "London Low", "Fib Retracment Level", 
    "Fractal High", "Fractal Low", "Mitigation Block", "Daily High", "Daily Low", "other"
];


export const COMMUNITY_FORUM_URL = "https://community.example.com";

    

    



    
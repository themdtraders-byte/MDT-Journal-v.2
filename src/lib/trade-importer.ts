
import type { Journal, ImportedTrade } from "./types";

// --- Advanced Local Parsing Engine ---

const levenshtein = (a: string, b: string): number => {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    const matrix = [];
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1,     // insertion
                    matrix[i - 1][j] + 1      // deletion
                );
            }
        }
    }
    return matrix[b.length][a.length];
};

const headerSynonyms: { [key in keyof Omit<ImportedTrade, 'openDate' | 'openTime' | 'closeDate' | 'closeTime'>]: string[] } & { openDateTime: string[], closeDateTime: string[] } = {
    openDateTime: ['open time', 'time'],
    closeDateTime: ['close time', 'time'],
    pair: ['symbol', 'pair', 'instrument', 'market'],
    direction: ['type', 'direction', 'action', 'side'],
    lotSize: ['volume', 'lots', 'lot size', 'size', 'quantity'],
    entryPrice: ['price', 'open price'],
    closingPrice: ['price', 'close price'],
    stopLoss: ['s / l', 's/l', 'stop loss', 'sl'],
    takeProfit: ['t / p', 't/p', 'take profit', 'tp'],
    note: ['comment', 'notes', 'note', 'description'],
    strategy: ['strategy', 'magic', 'magic number', 'expert id'],
    commission: ['commission', 'commissions'],
    swap: ['swap'],
};


const detectDelimiter = (line: string): RegExp => {
    const delimiters = ['\t', ',', ';', '|'];
    let bestDelimiter: RegExp | null = null;
    let maxCount = 0;

    delimiters.forEach(d => {
        const regex = new RegExp(d === '\t' ? '\\t' : `\\${d}`, 'g');
        const count = (line.match(regex) || []).length;
        if (count > maxCount) {
            maxCount = count;
            bestDelimiter = new RegExp(d === '\t' ? '\\t' : `\\${d}`);
        }
    });

    if (maxCount > 3) {
        return bestDelimiter!;
    }
    
    // If no clear delimiter is found, default to multiple spaces.
    return /\s{2,}/;
};


const parseDateTime = (str: string): { date: string, time: string } => {
    if (!str || !/\d/.test(str)) return { date: '', time: '00:00' };

    // Regex for YYYY.MM.DD HH:MM:SS format (most common in MT reports)
    const mt5Regex = /(\d{4})\.(\d{2})\.(\d{2})\s+(\d{2}:\d{2}(?::\d{2})?)/;
    const mt5Match = str.match(mt5Regex);
    if (mt5Match) {
        const [, year, month, day, timeStr] = mt5Match;
        return {
            date: `${year}-${month}-${day}`,
            time: timeStr.substring(0, 5) // HH:MM
        };
    }

    try {
        const date = new Date(str);
        if (!isNaN(date.getTime())) {
            return {
                date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
                time: `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
            };
        }
    } catch (e) { /* ignore parse errors and proceed */ }

    return { date: '', time: '00:00' };
};


const mapHeaders = (headers: string[]): { [key in keyof ImportedTrade]?: number } => {
    const columnIndexMap: { [key in keyof ImportedTrade]?: number } = {};
    const lowerCaseHeaders = headers.map(h => h.toLowerCase().trim());
    
    const usedIndices = new Set<number>();

    // Context-aware mapping for duplicate headers 'Time' and 'Price'
    const timeIndices = lowerCaseHeaders.reduce((acc, h, i) => (h === 'time' ? [...acc, i] : acc), [] as number[]);
    const priceIndices = lowerCaseHeaders.reduce((acc, h, i) => (h === 'price' ? [...acc, i] : acc), [] as number[]);

    if (timeIndices.length > 0) {
        // @ts-ignore
        columnIndexMap.openDateTime = timeIndices[0];
        // @ts-ignore
        columnIndexMap.openDate = timeIndices[0];
        // @ts-ignore
        columnIndexMap.openTime = timeIndices[0];
        usedIndices.add(timeIndices[0]);
    }
    if (timeIndices.length > 1) {
        // @ts-ignore
        columnIndexMap.closeDateTime = timeIndices[1];
        // @ts-ignore
        columnIndexMap.closeDate = timeIndices[1];
        // @ts-ignore
        columnIndexMap.closeTime = timeIndices[1];
        usedIndices.add(timeIndices[1]);
    }
    
    if (priceIndices.length > 0) {
        columnIndexMap.entryPrice = priceIndices[0];
        usedIndices.add(priceIndices[0]);
    }
    if (priceIndices.length > 1) {
        columnIndexMap.closingPrice = priceIndices[1];
        usedIndices.add(priceIndices[1]);
    }


    // Assign other fields based on synonyms
    for (const field in headerSynonyms) {
        if (field === 'openDateTime' || field === 'closeDateTime' || columnIndexMap[field as keyof ImportedTrade] !== undefined) continue;

        let bestMatch = { index: -1, distance: Infinity };
        const synonyms = headerSynonyms[field as keyof typeof headerSynonyms];

        lowerCaseHeaders.forEach((header, index) => {
            if (usedIndices.has(index)) return; // Skip already mapped columns
            
            const distance = findBestHeaderMatch(header, synonyms);
            if (distance < bestMatch.distance) {
                bestMatch = { index, distance };
            }
        });
        
        if (bestMatch.index !== -1 && bestMatch.distance < 4) {
             if (!Object.values(columnIndexMap).includes(bestMatch.index)) {
                columnIndexMap[field as keyof ImportedTrade] = bestMatch.index;
                usedIndices.add(bestMatch.index);
             }
        }
    }
    
    return columnIndexMap;
};

const findBestHeaderMatch = (header: string, fieldSynonyms: string[]): number => {
    const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!normalizedHeader) return Infinity;

    for (const synonym of fieldSynonyms) {
        const normalizedSynonym = synonym.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (normalizedHeader === normalizedSynonym) return 0; // Exact match
        if (normalizedHeader.includes(normalizedSynonym) || normalizedSynonym.includes(normalizedHeader)) {
            return 1; // Substring match
        }
    }
    
    let minDistance = Infinity;
    fieldSynonyms.forEach(synonym => {
        const normalizedSynonym = synonym.toLowerCase().replace(/[^a-z0-9]/g, '');
        const distance = levenshtein(normalizedHeader, normalizedSynonym);
        if (distance < minDistance) {
            minDistance = distance;
        }
    });
    return minDistance + 2; // Add penalty for fuzzy matching
};

const findHeaderRow = (lines: string[], delimiter: RegExp): { headerRowIndex: number; startColumnIndex: number; headers: string[] } => {
    let bestMatch = { index: -1, score: -1, startCol: 0, finalHeaders: [] as string[] };
    // These are the most critical, non-repeating headers
    const requiredHeaders = ['symbol', 'type', 'volume', 'profit', 's / l', 't / p', 'time', 'price'];
    
    lines.forEach((line, i) => {
        if (line.length < 20) return;
        
        const cells = line.split(delimiter);
        const firstContentCol = cells.findIndex(c => c.trim() !== '');
        if (firstContentCol === -1) return;

        const headers = cells.slice(firstContentCol).map(h => h.trim().toLowerCase().replace(/"/g, ''));
        if (headers.length < 5) return;

        let score = 0;
        requiredHeaders.forEach(req => {
            if (headers.some(h => h.includes(req))) {
                score++;
            }
        });
        
        if (score > bestMatch.score) {
            bestMatch = { index: i, score, startCol: firstContentCol, finalHeaders: cells.slice(firstContentCol).map(h => h.trim().replace(/"/g, '')) };
        }
    });

    if (bestMatch.score < 5) { 
        return { headerRowIndex: -1, startColumnIndex: 0, headers: [] };
    }
    
    return { headerRowIndex: bestMatch.index, startColumnIndex: bestMatch.startCol, headers: bestMatch.finalHeaders };
};


export async function parseTradeData(rawData: string): Promise<ImportedTrade[]> {
    if (!rawData || !rawData.trim()) {
        return [];
    }
    let processedData = rawData;

    const safeParseFloat = (val: any): number | undefined => {
        if (val === null || val === undefined || typeof val !== 'string' || val.trim() === '') return undefined;
        const num = parseFloat(String(val).replace(/[^\d.-]/g, ''));
        return isNaN(num) ? undefined : num;
    };

    if (processedData.trim().startsWith('{') || processedData.trim().startsWith('[')) {
        try {
            const jsonData = JSON.parse(processedData);
            const trades = Array.isArray(jsonData) ? jsonData : jsonData.trades;
            if (Array.isArray(trades)) {
                 // Check if it's a full Trade object array (from our own export)
                if (trades.length > 0 && 'auto' in trades[0] && 'lotSize' in trades[0]) {
                    return trades.map(t => ({
                        // Map all relevant fields from the full Trade object to ImportedTrade
                        openDate: t.openDate,
                        openTime: t.openTime,
                        closeDate: t.closeDate,
                        closeTime: t.closeTime,
                        pair: t.pair,
                        direction: t.direction,
                        lotSize: t.lotSize,
                        entryPrice: t.entryPrice,
                        closingPrice: t.closingPrice,
                        stopLoss: t.stopLoss,
                        takeProfit: t.takeProfit,
                        note: t.note,
                        strategy: t.strategy,
                        commission: t.commission,
                        swap: t.swap,
                        tag: t.tag,
                        sentiment: t.sentiment,
                        newsEvents: t.newsEvents,
                        analysisSelections: t.analysisSelections,
                        customStats: t.customStats,
                        mae: t.mae,
                        mfe: t.mfe,
                        partials: t.partials,
                        layers: t.layers,
                        hasPartial: t.hasPartial,
                        isLayered: t.isLayered,
                        breakeven: t.breakeven,
                        wasTpHit: t.wasTpHit,
                        lessonsLearned: t.lessonsLearned,
                        images: t.images,
                        imagesByTimeframe: t.imagesByTimeframe
                    })).filter(t => t.pair && t.openDate && t.lotSize > 0);
                }
            }
        } catch (e) { /* Fallback to text parsing */ }
    }

    if (processedData.trim().toLowerCase().includes('<html')) {
        if (typeof DOMParser === 'undefined') throw new Error("HTML parsing is only available in the browser environment.");
        const parser = new DOMParser();
        const doc = parser.parseFromString(processedData, "text/html");
        
        const positionsHeader = Array.from(doc.querySelectorAll('h1, h2, h3, b')).find(h => h.textContent?.trim().toLowerCase() === 'positions');
        let tableElement: HTMLTableElement | null = null;

        if (positionsHeader) {
            let sibling = positionsHeader.nextElementSibling;
            while (sibling) {
                if (sibling.tagName.toLowerCase() === 'table') {
                    tableElement = sibling as HTMLTableElement;
                    break;
                }
                sibling = sibling.nextElementSibling;
            }
        }

        if (tableElement) {
            processedData = Array.from(tableElement.rows).map(row => Array.from(row.cells).map(cell => cell.textContent?.trim() || '').join('\t')).join('\n');
        } else {
             const allTables = Array.from(doc.querySelectorAll('table'));
             const tradeTable = allTables.find(t => t.textContent?.includes('Profit') && t.textContent?.includes('Symbol')) || allTables.sort((a,b) => b.rows.length - a.rows.length)[0];
             if(tradeTable) {
                processedData = Array.from(tradeTable.rows).map(row => Array.from(row.cells).map(cell => cell.textContent?.trim() || '').join('\t')).join('\n');
             } else {
                throw new Error("No suitable data table found in the HTML file.");
             }
        }
    }

    const lines = processedData.trim().split(/[\r\n]+/).filter(line => line.trim() !== '');
    if (lines.length < 2) throw new Error("Not enough data to parse.");

    const delimiter = detectDelimiter(lines.find(l => l.split(/[\t,;]/).length > 5) || lines[0]);
    
    const positionsHeaderIndex = lines.findIndex(line => line.trim().toLowerCase() === 'positions');
    let dataLines = lines;

    if (positionsHeaderIndex !== -1) {
        const nextHeaderIndex = lines.findIndex((line, i) => i > positionsHeaderIndex && /^(deals|orders|summary)/i.test(line.trim()));
        const start = positionsHeaderIndex;
        const end = nextHeaderIndex !== -1 ? nextHeaderIndex : lines.length;
        dataLines = lines.slice(start, end);
    }
    
    const { headerRowIndex, startColumnIndex, headers } = findHeaderRow(dataLines, delimiter);
    
    if (headerRowIndex === -1) {
        throw new Error("Could not find a valid header row in the data provided. Please check your data format.");
    }
    
    // This is the critical fix. The regex ensures we only process rows that are definitively trade rows.
    const dataRows = dataLines.slice(headerRowIndex + 1).filter(line => /^\d{4}\.\d{2}\.\d{2}\s+\d{2}:\d{2}(?::\d{2})?\t/.test(line.trim()));
    
    const columnIndexMap = mapHeaders(headers);

    const requiredFields: (keyof ImportedTrade)[] = ['pair', 'direction', 'openDate', 'entryPrice', 'closingPrice', 'lotSize'];
    const missingFields = requiredFields.filter(f => columnIndexMap[f] === undefined);
    if (missingFields.length > 0) {
        throw new Error(`Could not identify essential columns: ${missingFields.join(', ')}. Please check your data headers.`);
    }

    const trades: ImportedTrade[] = [];
    for (let i = 0; i < dataRows.length; i++) {
        const values = dataRows[i].split(delimiter).slice(startColumnIndex);
        if (values.length < headers.length * 0.8) continue;
        
        try {
            // @ts-ignore
            const { date: openDate, time: openTime } = parseDateTime(values[columnIndexMap.openDateTime!]);
            // @ts-ignore
            const { date: closeDate, time: closeTime } = parseDateTime(values[columnIndexMap.closeDateTime!]);

            const directionStr = values[columnIndexMap.direction!]?.toLowerCase();
            const direction: 'Buy' | 'Sell' = directionStr.includes('buy') || directionStr === 'in' ? 'Buy' : 'Sell';
            
            const pair = values[columnIndexMap.pair!].replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
            
            const trade: ImportedTrade = {
                openDate, openTime, closeDate, closeTime, pair, direction,
                lotSize: safeParseFloat(values[columnIndexMap.lotSize!]) || 0,
                entryPrice: safeParseFloat(values[columnIndexMap.entryPrice!]) || 0,
                closingPrice: safeParseFloat(values[columnIndexMap.closingPrice!]) || 0,
                stopLoss: safeParseFloat(values[columnIndexMap.stopLoss!]),
                takeProfit: safeParseFloat(values[columnIndexMap.takeProfit!]),
                note: [],
                strategy: columnIndexMap.strategy !== undefined ? values[columnIndexMap.strategy!] : undefined,
                commission: safeParseFloat(values[columnIndexMap.commission!]),
                swap: safeParseFloat(values[columnIndexMap.swap!]),
            };
            
            if (trade.pair && trade.openDate && trade.entryPrice && trade.closingPrice && trade.lotSize > 0) {
                trades.push(trade);
            }
        } catch (rowError) {
            console.warn(`Skipping invalid row ${headerRowIndex + i + 2}:`, rowError);
        }
    }
    
    if (trades.length === 0) {
        throw new Error("Could not parse any trades from the provided data. Make sure the 'Positions' table is present in your report.");
    }

    return trades;
}

    
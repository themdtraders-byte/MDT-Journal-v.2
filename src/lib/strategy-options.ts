

import type { AnalysisCategory } from '@/types';

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
}

export interface AnalysisSubCategory {
    id: string;
    title: string;
    options: AnalysisOption[];
    modifiers?: Modifier[];
}

export const allAnalysisCategories: AnalysisCategory[] = [
    {
        id: 'bias', title: 'Bias', icon: 'TrendingUp', isSingleChoice: true,
        subCategories: [
            { id: 'bias', title: 'Bias', options: [
                {id: 'b_bull', value: 'Bullish'},
                {id: 'b_bear', value: 'Bearish'},
                {id: 'b_range', value: 'Ranging'},
            ]}
        ]
    },
    {
        id: 'volatility', title: 'Volatility', icon: 'Wind', isSingleChoice: true,
        subCategories: [
            { id: 'volatility', title: 'Volatility', options: [
                {id: 'v_high', value: 'High'},
                {id: 'v_med', value: 'Medium'},
                {id: 'v_low', value: 'Low'},
            ]}
        ]
    },
    {
        id: 'zone', title: 'Zone', icon: 'BoxSelect', isSingleChoice: false,
        subCategories: [
            { 
                id: 'zone', title: 'Zone', 
                options: [
                    {id: 'z_disc', value: 'Discount'},
                    {id: 'z_prem', value: 'Premium'},
                    {id: 'z_eq', value: 'Equilibrium'},
                ],
                modifiers: [
                    { 
                        key: 'point', 
                        label: 'Point Type', 
                        options: [
                            { value: 'Extreme', label: 'Extreme' },
                            { value: 'Decisive', label: 'Decisive' },
                            { value: 'Start', label: 'Start' }
                        ]
                    }
                ]
            }
        ]
    },
    {
        id: 'poi', title: 'POI', icon: 'Pin', isSingleChoice: false,
        subCategories: [
            {
                id: 'institutional_poi',
                title: 'Institutional POIs',
                options: [
                    {id: 'poi_fvg', value: 'Imbalance (FVG)'},
                    {id: 'poi_ob', value: 'Order Block (OB)'},
                    {id: 'poi_supply', value: 'Supply'},
                    {id: 'poi_demand', value: 'Demand'},
                    {id: 'poi_ind', value: 'Inducement'},
                    {id: 'poi_fob', value: 'Failed OB'},
                    {id: 'poi_ffvg', value: 'Failed FVG'},
                ],
                modifiers: [
                    { 
                        key: 'status', 
                        label: 'Status', 
                        options: [
                            { value: 'Pick', label: 'Pick' },
                            { value: 'Swept', label: 'Swept' },
                            { value: 'Break', label: 'Break' }
                        ]
                    }
                ]
            },
            {
                id: 'structural_poi',
                title: 'Structural & Session POIs',
                options: [
                    {id: 'poi_pdh', value: 'Previous Day High'},
                    {id: 'poi_pdl', value: 'Previous Day Low'},
                    {id: 'poi_eqh', value: 'Equal High'},
                    {id: 'poi_eql', value: 'Equal Low'},
                    {id: 'poi_swh', value: 'Swing High'},
                    {id: 'poi_swl', value: 'Swing Low'},
                    {id: 'poi_ah', value: 'Asian High'},
                    {id: 'poi_al', value: 'Asian Low'},
                    {id: 'poi_lh', value: 'London High'},
                    {id: 'poi_ll', value: 'London Low'},
                    {id: 'poi_nyh', value: 'New York High'},
                    {id: 'poi_nyl', value: 'New York Low'},
                    {id: 'poi_lh', value: 'Last High'},
                    {id: 'poi_ll', value: 'Last Low'},
                    {id: 'poi_sup', value: 'Support'},
                    {id: 'poi_res', value: 'Resistance'},
                ],
                modifiers: [
                    { 
                        key: 'status', 
                        label: 'Status', 
                        options: [
                            { value: 'Pick', label: 'Pick' },
                            { value: 'Swept', label: 'Swept' },
                            { value: 'Break', label: 'Break' }
                        ]
                    }
                ]
            },
        ]
    },
    {
        id: 'confirmation', title: 'Confirmation', icon: 'Check', isSingleChoice: false,
        subCategories: [
            {
                id: 'confirmation',
                title: 'Confirmation Signals',
                options: [
                    {id: 'c_cont', value: 'Continuation'},
                    {id: 'c_ms', value: 'Market Shift (MS)'},
                    {id: 'c_rms', value: 'Retracement after MS'},
                    {id: 'c_bos', value: 'Break of Structure (BoS)'},
                    {id: 'c_bo', value: 'Break Out'},
                    {id: 'c_icc', value: 'Inverse Candle Closing'},
                    {id: 'c_tc', value: 'Trap Candle'},
                    {id: 'c_ls', value: 'Liquidity Swept'},
                    {id: 'c_ec', value: 'Engulfing Candle'},
                ],
            }
        ]
    },
    {
        id: 'indicator', title: 'Indicator', icon: 'Spline', isSingleChoice: false,
        subCategories: [
            {
                id: 'indicator',
                title: 'Indicators',
                options: [
                    {id: 'i_rsi', value: 'RSI'},
                    {id: 'i_ma', value: 'Moving Average'},
                    {id: 'i_vol', value: 'Volume'},
                    {id: 'i_bb', value: 'Bollinger Bands'},
                    {id: 'i_stoch', value: 'Stochastic Oscillator'},
                ],
                modifiers: [
                    {
                        key: 'freeText',
                        label: 'Value/Condition',
                        type: 'text',
                        options: [] // No predefined options for free text
                    }
                ]
            }
        ]
    },
    {
        id: 'pattern', title: 'Pattern', icon: 'AreaChart', isSingleChoice: false,
        subCategories: [
            {
                id: 'pattern',
                title: 'Chart Patterns',
                options: [
                    {id: 'p_bf', value: 'Bull Flag'},
                    {id: 'p_bearf', value: 'Bear Flag'},
                    {id: 'p_rw', value: 'Raising Wedge'},
                    {id: 'p_fw', value: 'Falling Wedge'},
                    {id: 'p_at', value: 'Ascending Triangle'},
                    {id: 'p_dt', value: 'Descending Triangle'},
                    {id: 'p_hs', value: 'Head & Shoulders'},
                    {id: 'p_dtop', value: 'Double Top'},
                    {id: 'p_dbot', value: 'Double Bottom'},
                    {id: 'p_ch', value: 'Cup & Handle'},
                    {id: 'p_ttop', value: 'Triple Top'},
                    {id: 'p_tbot', value: 'Triple Bottom'},
                ],
            }
        ]
    }
];


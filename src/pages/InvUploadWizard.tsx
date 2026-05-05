import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft, Upload, FileSearch, FileSpreadsheet, Check, Tag,
  Download, AlertCircle, ChevronDown, ChevronRight, Info,
  AlertTriangle, Building2, MapPin, Plus, Pencil, X,
  FileText, Trash2, Calendar, Users,
} from 'lucide-react';
import { Button } from '@/components/wp-ui/button';
import { Badge } from '@/components/wp-ui/badge';
import { Select } from '../components/ui';

import toast from 'react-hot-toast';

// ── Types ─────────────────────────────────────────────────────────────────────
type ImportDataType  = 'transactions' | 'holdings' | 'income';
type WizardStep      = 'choose' | 'upload' | 'map' | 'gl' | 'preview';
type ImportPath      = 'excel' | 'ocr';
type OcrPhase        = 'drop' | 'queue' | 'processing' | 'review' | 'gl' | 'accounts' | 'done';
type BlankStep       = 'setup' | 'sections';

const WIZARD_STEPS: { id: WizardStep; label: string }[] = [
  { id: 'choose',  label: 'Data Type' },
  { id: 'upload',  label: 'Upload'    },
  { id: 'map',     label: 'Map Cols'  },
  { id: 'gl',      label: 'GL Tags'   },
  { id: 'preview', label: 'Preview'   },
];

const OCR_STEPS: { id: OcrPhase; label: string }[] = [
  { id: 'drop',     label: 'Upload'   },
  { id: 'review',   label: 'Review'   },
  { id: 'gl',       label: 'GL Map'   },
  { id: 'accounts', label: 'Accounts' },
  { id: 'done',     label: 'Confirm'  },
];

// ── OCR extracted mock data (real Richardson Wealth / SPM Holdings Ltd data) ──
export type OcrRow = {
  id: string;
  date: string;
  type: string;
  description: string;
  security: string;
  ticker: string;       // may be '' (private funds / bonds have no exchange ticker)
  broker: string;
  acct: string;
  qty: number;
  price: number;
  ccy: string;
  fxRate: number | null;  // null = missing (USD-denominated income converted inline)
  netCAD: number;
  glAccount: string;    // starts ''
  missing: string[];    // which fields are missing
};

// 12 rows extracted from Richardson Wealth consolidated statement (Aug–Nov 2023)
// SPM HOLDINGS LTD — Accounts H11-YLF0-E (IAA) and H11-YLG0-E (PMA)
// FX as at Aug 31 2023: USD 1 = CAD 1.3531
const OCR_EXTRACTED: OcrRow[] = [
  // ✅ Complete rows
  { id:'e01', date:'2023-08-02', type:'Buy',               description:'Buy 2,465 units iShares MSCI EAFE Index ETF @ $32.46',                             security:'iShares MSCI EAFE Index ETF',                                ticker:'XEF.TO',  broker:'Richardson Wealth', acct:'YLG0', qty:2_465,   price:32.46,  ccy:'CAD', fxRate:1,      netCAD:-80_013.90, glAccount:'', missing:[] },
  { id:'e06', date:'2023-08-31', type:'Cash Distribution', description:'Cash distribution — 3,345 units iShares S&P/TSX 60 Index ETF',                     security:'iShares S&P/TSX 60 Index ETF',                                ticker:'XIU.TO',  broker:'Richardson Wealth', acct:'YLG0', qty:3_345,   price:0,      ccy:'CAD', fxRate:1,      netCAD:819.53,     glAccount:'', missing:[] },
  { id:'e04', date:'2023-08-28', type:'Bond Interest',     description:'Semi-annual bond interest — CIBC 2.35% FXD RT SR NT 28AUG2024',                   security:'CIBC 2.35% Fixed Rate Senior Notes 28AUG2024',               ticker:'',        broker:'Richardson Wealth', acct:'YLG0', qty:16_000,  price:0,      ccy:'CAD', fxRate:1,      netCAD:188.00,     glAccount:'', missing:[] },
  { id:'e09', date:'2023-09-13', type:'Sale',              description:'Sell 2,465 units iShares MSCI EAFE Index ETF @ $31.90',                             security:'iShares MSCI EAFE Index ETF',                                ticker:'XEF.TO',  broker:'Richardson Wealth', acct:'YLG0', qty:2_465,   price:31.90,  ccy:'CAD', fxRate:1,      netCAD:78_633.50,  glAccount:'', missing:[] },
  { id:'e10', date:'2023-09-14', type:'Matured',           description:'Matured — Canadian Western Bank Senior Deposit Notes 1.57% 14SEP2023',             security:'Canadian Western Bank Senior Deposit Notes 1.57% 14SEP2023', ticker:'',        broker:'Richardson Wealth', acct:'YLG0', qty:6_000,   price:100,    ccy:'CAD', fxRate:1,      netCAD:6_000.00,   glAccount:'', missing:[] },
  { id:'e11', date:'2023-11-01', type:'Bond Interest',     description:'Semi-annual bond interest — Bank of Nova Scotia Fixed Rate Notes 1.4% 01NOV2027',  security:'Bank of Nova Scotia Senior Fixed Rate Notes 1.4% 01NOV2027', ticker:'',        broker:'Richardson Wealth', acct:'YLG0', qty:16_000,  price:0,      ccy:'CAD', fxRate:1,      netCAD:112.00,     glAccount:'', missing:[] },
  { id:'e12', date:'2023-11-30', type:'Cash Distribution', description:'Cash distribution — 5,497 units iShares S&P/TSX 60 Index ETF',                     security:'iShares S&P/TSX 60 Index ETF',                                ticker:'XIU.TO',  broker:'Richardson Wealth', acct:'YLG0', qty:5_497,   price:0,      ccy:'CAD', fxRate:1,      netCAD:1_385.24,   glAccount:'', missing:[] },
  { id:'e13', date:'2023-11-30', type:'Dividend',          description:'Dividend — Rise Properties Trust Class F',                                          security:'Rise Properties Trust Class F',                               ticker:'',        broker:'Richardson Wealth', acct:'YLG0', qty:0,        price:0,      ccy:'CAD', fxRate:1,      netCAD:113.45,     glAccount:'', missing:[] },
  // ⚠️ Rows with extraction gaps — user must resolve before importing
  { id:'e02', date:'2023-08-02', type:'Sale',              description:'Sell 7,157.519 units Manulife World Investment Fund',                               security:'Manulife World Investment Fund',                              ticker:'',        broker:'Richardson Wealth', acct:'YLG0', qty:7_158,   price:18.88,  ccy:'CAD', fxRate:1,      netCAD:135_144.69, glAccount:'', missing:['Ticker'] },
  { id:'e03', date:'2023-08-03', type:'Dividend',          description:'Dividend — ACM Commercial Mortgage Fund - Class F (no exchange listing)',           security:'ACM Commercial Mortgage Fund - Class F',                     ticker:'',        broker:'Richardson Wealth', acct:'YLF0', qty:0,        price:0,      ccy:'CAD', fxRate:1,      netCAD:210.76,     glAccount:'', missing:['Ticker'] },
  { id:'e07', date:'2023-06-30', type:'Dividend',          description:'Dividend — Revesco Canadian Holdings LP Class B — converted USD (FX rate unclear)', security:'Revesco Canadian Holdings LP Class B',                       ticker:'',        broker:'Richardson Wealth', acct:'YLG0', qty:0,        price:0,      ccy:'USD', fxRate:null,   netCAD:346.72,     glAccount:'', missing:['FX Rate'] },
  { id:'e08', date:'2023-09-07', type:'?',                 description:'EXERCISE — S/R LPU HEPF III Limited Cl A Instalment Receipts (capital call?)',     security:'S/R LPU HEPF III Limited Class A Instalment Receipts',       ticker:'',        broker:'Richardson Wealth', acct:'YLG0', qty:0,        price:0,      ccy:'CAD', fxRate:1,      netCAD:-17_159.37, glAccount:'', missing:['Activity Type'] },
];

// Additional rows surfaced when multiple statements are imported (Dec 2023 – Apr 2024)
const OCR_EXTRA_ROWS: OcrRow[] = [
  { id:'x01', date:'2023-12-05', type:'Dividend',          description:'Dividend — ACM Commercial Mortgage Fund - Class F',                      security:'ACM Commercial Mortgage Fund - Class F',                        ticker:'',        broker:'Richardson Wealth', acct:'YLG0', qty:0,       price:0,     ccy:'CAD', fxRate:1,      netCAD:210.76,    glAccount:'', missing:[] },
  { id:'x02', date:'2023-12-07', type:'Dividend',          description:'Dividend — Four Quadrant Global Real Estate Partners Trust Cl J',        security:'Four Quadrant Global Real Estate Partners Trust Class J',       ticker:'',        broker:'Richardson Wealth', acct:'YLG0', qty:0,       price:0,     ccy:'CAD', fxRate:1,      netCAD:198.08,    glAccount:'', missing:[] },
  { id:'x03', date:'2023-12-31', type:'Dividend',          description:'Dividend — Regimen Equity Partners Series IV Preferred Securities',      security:'Regimen Equity Partners Series IV Preferred Securities',        ticker:'',        broker:'Richardson Wealth', acct:'YLF0', qty:0,       price:0,     ccy:'CAD', fxRate:1,      netCAD:849.32,    glAccount:'', missing:[] },
  { id:'x04', date:'2023-12-31', type:'Cash Distribution', description:'Cash distribution — iShares S&P/TSX 60 Index ETF',                      security:'iShares S&P/TSX 60 Index ETF',                                  ticker:'XIU.TO',  broker:'Richardson Wealth', acct:'YLG0', qty:5_497,   price:0,     ccy:'CAD', fxRate:1,      netCAD:1_520.86,  glAccount:'', missing:[] },
  { id:'x05', date:'2024-01-05', type:'Dividend',          description:'Dividend — Four Quadrant Global Real Estate Partners Trust Cl J',        security:'Four Quadrant Global Real Estate Partners Trust Class J',       ticker:'',        broker:'Richardson Wealth', acct:'YLG0', qty:0,       price:0,     ccy:'CAD', fxRate:1,      netCAD:198.08,    glAccount:'', missing:[] },
  { id:'x06', date:'2024-01-12', type:'Bond Interest',     description:'Bond interest — Telus Corp 2.75% 08JUL2026',                           security:'Telus Corp 2.75% 08JUL2026',                                    ticker:'',        broker:'Richardson Wealth', acct:'YLG0', qty:30_000,  price:0,     ccy:'CAD', fxRate:1,      netCAD:412.50,    glAccount:'', missing:[] },
  { id:'x07', date:'2024-01-31', type:'Dividend',          description:'Dividend — Regimen Equity Partners Series IV Preferred Securities',      security:'Regimen Equity Partners Series IV Preferred Securities',        ticker:'',        broker:'Richardson Wealth', acct:'YLF0', qty:0,       price:0,     ccy:'CAD', fxRate:1,      netCAD:849.32,    glAccount:'', missing:[] },
  { id:'x08', date:'2024-02-14', type:'Buy',               description:'Buy 170 units iShares Core S&P 500 Index CAD Hedged ETF @ $54.20',      security:'iShares Core S&P 500 Index CAD Hedged ETF',                     ticker:'XSP.TO',  broker:'Richardson Wealth', acct:'YLG0', qty:170,     price:54.20, ccy:'CAD', fxRate:1,      netCAD:-9_214.00, glAccount:'', missing:[] },
  { id:'x09', date:'2024-02-29', type:'Cash Distribution', description:'Cash distribution — iShares S&P/TSX 60 Index ETF',                      security:'iShares S&P/TSX 60 Index ETF',                                  ticker:'XIU.TO',  broker:'Richardson Wealth', acct:'YLG0', qty:5_497,   price:0,     ccy:'CAD', fxRate:1,      netCAD:1_427.55,  glAccount:'', missing:[] },
  { id:'x10', date:'2024-03-12', type:'Bond Interest',     description:'Bond interest — RBC 1.833% SR Unsecured 31JUL2028',                    security:'RBC 1.833% SR Unsecured 31JUL2028',                             ticker:'',        broker:'Richardson Wealth', acct:'YLG0', qty:64_000,  price:0,     ccy:'CAD', fxRate:1,      netCAD:586.56,    glAccount:'', missing:[] },
  { id:'x11', date:'2024-03-29', type:'Return of Capital', description:'Return of capital — Rise Properties Trust Class F',                     security:'Rise Properties Trust Class F',                                 ticker:'',        broker:'Richardson Wealth', acct:'YLG0', qty:0,        price:0,     ccy:'CAD', fxRate:1,      netCAD:-113.45,   glAccount:'', missing:[] },
  { id:'x12', date:'2024-04-30', type:'Dividend',          description:'Dividend — Revesco Canadian Holdings LP Class B (USD converted)',        security:'Revesco Canadian Holdings LP Class B',                          ticker:'',        broker:'Richardson Wealth', acct:'YLG0', qty:0,        price:0,     ccy:'USD', fxRate:null,   netCAD:362.40,    glAccount:'', missing:['FX Rate'] },
  { id:'x13', date:'2024-04-30', type:'Cash Distribution', description:'Cash distribution — iShares S&P/TSX 60 Index ETF',                      security:'iShares S&P/TSX 60 Index ETF',                                  ticker:'XIU.TO',  broker:'Richardson Wealth', acct:'YLG0', qty:5_497,   price:0,     ccy:'CAD', fxRate:1,      netCAD:1_499.03,  glAccount:'', missing:[] },
];

const GL_BY_TYPE: Record<string, { label: string; options: string[] }> = {
  'Buy':               { label: 'Investments (Cost)',           options: ['1310 – Investments (Cost)', '1320 – Quoted Investments', '1330 – Unquoted Investments', '1340 – Equity Method Investments'] },
  'Sale':              { label: 'Realized G/L on Investments',  options: ['4500 – Realized G/L on Investments', '4510 – Gain on Disposal', '4520 – Loss on Disposal'] },
  'Dividend':          { label: 'Dividend Income',              options: ['4400 – Dividend Income', '4410 – Eligible Dividends', '4420 – Capital Dividends'] },
  'Bond Interest':     { label: 'Interest Income',              options: ['4010 – Interest Income', '4015 – Bond Interest Earned', '4020 – Accrued Interest'] },
  'Cash Distribution': { label: 'Investment Distributions',     options: ['4420 – ETF / Fund Distributions', '4400 – Dividend Income', '1310 – Return of Capital (cost adj.)'] },
  'Return of Capital': { label: 'Investments (Cost) Reduction', options: ['1310 – Investments (Cost)', '4430 – Return of Capital Received'] },
  'Capital Call':      { label: 'Investments (Cost)',           options: ['1310 – Investments (Cost)', '1330 – Unquoted Investments'] },
  'Matured':           { label: 'Principal Return — Cash',      options: ['1010 – Cash & Cash Equivalents', '1310 – Investments (Cost)'] },
  'Interest in Kind':  { label: 'Interest Income (non-cash)',   options: ['4010 – Interest Income', '1310 – Investments (Cost)'] },
  'DRIP':              { label: 'Investments (Cost)',           options: ['1310 – Investments (Cost)', '4400 – Dividend Income (DRIP)'] },
  'Withholding Tax':   { label: 'WHT Expense',                  options: ['6150 – Withholding Tax Expense', '6155 – Foreign WHT Claimable (T2209)'] },
  'Fee':               { label: 'Investment Management Fees',   options: ['5020 – Investment Management Fees', '5025 – Advisory / PMA Fees'] },
  'Switch In':         { label: 'Investments (Cost)',           options: ['1310 – Investments (Cost)'] },
  'Switch Out':        { label: 'Investments (Cost)',           options: ['1310 – Investments (Cost)'] },
  '?':                 { label: 'Unclassified',                 options: ['9999 – Suspense / Unclassified', '1310 – Investments (Cost)'] },
};

const TXN_TYPES = ['Buy','Sale','Dividend','Bond Interest','Cash Distribution','Return of Capital','Capital Call','Matured','Interest in Kind','DRIP','Withholding Tax','Fee','Switch In','Switch Out','Other'];

// ── Type badge colour helper (covers all Richardson Wealth activity types) ────
function typeBadgeClass(t: string): string {
  if (t === 'Buy')               return 'bg-blue-50 text-blue-700';
  if (t === 'Sale')              return 'bg-orange-50 text-orange-700';
  if (t === 'Dividend')          return 'bg-green-50 text-green-700';
  if (t === 'Bond Interest')     return 'bg-teal-50 text-teal-700';
  if (t === 'Cash Distribution') return 'bg-emerald-50 text-emerald-700';
  if (t === 'Return of Capital') return 'bg-cyan-50 text-cyan-700';
  if (t === 'Capital Call')      return 'bg-indigo-50 text-indigo-700';
  if (t === 'Matured')           return 'bg-sky-50 text-sky-700';
  if (t === 'Interest in Kind')  return 'bg-teal-50 text-teal-700';
  if (t === 'DRIP')              return 'bg-purple-50 text-purple-700';
  if (t === 'Withholding Tax')   return 'bg-red-50 text-red-700';
  if (t === 'Fee')               return 'bg-slate-100 text-slate-600';
  if (t === 'Switch In')         return 'bg-violet-50 text-violet-700';
  if (t === 'Switch Out')        return 'bg-violet-50 text-violet-700';
  return 'bg-muted text-muted-foreground';
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt2(n: number) { return n.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtCAD(n: number) { return (n < 0 ? '(' : '') + fmt2(Math.abs(n)) + (n < 0 ? ')' : ''); }

const COLS = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N'].map(c => ({ value: `Column ${c}`, label: `Column ${c}` }));

// ── Mock preview data (Excel path — Richardson Wealth / SPM Holdings) ────────
const MOCK_TXN_PREVIEW = [
  { date:'2023-08-02', settleDate:'2023-08-04', type:'Buy',               description:'Buy 2,465 units iShares MSCI EAFE Index ETF @ $32.46',       security:'iShares MSCI EAFE Index ETF',                  ticker:'XEF.TO',  broker:'Richardson Wealth', qty:2_465,  price:32.46,  ccy:'CAD', netCAD:-80_013.90 },
  { date:'2023-08-03', settleDate:'2023-08-05', type:'Dividend',          description:'Dividend — ACM Commercial Mortgage Fund - Class F',           security:'ACM Commercial Mortgage Fund - Class F',       ticker:'',        broker:'Richardson Wealth', qty:0,       price:0,      ccy:'CAD', netCAD:210.76     },
  { date:'2023-08-31', settleDate:'2023-08-31', type:'Cash Distribution', description:'Cash distribution — 3,345 units iShares S&P/TSX 60 Index ETF', security:'iShares S&P/TSX 60 Index ETF',               ticker:'XIU.TO',  broker:'Richardson Wealth', qty:3_345,  price:0,      ccy:'CAD', netCAD:819.53     },
  { date:'2023-09-13', settleDate:'2023-09-15', type:'Sale',              description:'Sell 2,465 units iShares MSCI EAFE Index ETF @ $31.90',       security:'iShares MSCI EAFE Index ETF',                  ticker:'XEF.TO',  broker:'Richardson Wealth', qty:2_465,  price:31.90,  ccy:'CAD', netCAD:78_633.50  },
  { date:'2023-11-30', settleDate:'2023-11-30', type:'Dividend',          description:'Dividend — Regimen Equity Partners Series IV Preferred',       security:'Regimen Equity Partners Series IV Preferred',  ticker:'',        broker:'Richardson Wealth', qty:0,       price:0,      ccy:'CAD', netCAD:821.92     },
];

const MOCK_HOLDINGS_PREVIEW = [
  { security:'iShares S&P/TSX 60 Index ETF',                  ticker:'XIU.TO',  broker:'Richardson Wealth', ccy:'CAD', units:5_497,     wac:30.18,   costCAD:165_970.35, gl:'1310' },
  { security:'RBC 1.833% SR Unsecured 31JUL2028',             ticker:'',        broker:'Richardson Wealth', ccy:'CAD', units:64_000,    wac:0.861,   costCAD:55_084.80,  gl:'1310' },
  { security:'Regimen Equity Partners Series IV Preferred',   ticker:'',        broker:'Richardson Wealth', ccy:'CAD', units:10_000,    wac:10.00,   costCAD:100_000.00, gl:'1330' },
  { security:'Kensington Private Equity Fund Class G',        ticker:'',        broker:'Richardson Wealth', ccy:'CAD', units:1_091.128, wac:32.34,   costCAD:35_293.03,  gl:'1330' },
  { security:'iShares Core S&P 500 Index CAD Hedged ETF',     ticker:'XSP.TO',  broker:'Richardson Wealth', ccy:'CAD', units:1_950,     wac:40.83,   costCAD:79_626.57,  gl:'1310' },
];

const MOCK_INCOME_PREVIEW = [
  { date:'2023-08-28', broker:'Richardson Wealth', type:'Bond Interest',     description:'CIBC 2.35% FXD RT SR NT 28AUG2024 — semi-annual', ccy:'CAD', localAmt:188.00,  cadAmt:188.00,  gl:'4010', taxSlip:'T5'  },
  { date:'2023-08-31', broker:'Richardson Wealth', type:'Cash Distribution', description:'iShares S&P/TSX 60 Index ETF — monthly dist.',      ccy:'CAD', localAmt:819.53,  cadAmt:819.53,  gl:'4420', taxSlip:'T3'  },
  { date:'2023-09-29', broker:'Richardson Wealth', type:'Interest in Kind',  description:'BNS Corporate Tiered Investment Savings Acct',      ccy:'CAD', localAmt:252.66,  cadAmt:252.66,  gl:'4010', taxSlip:''    },
  { date:'2023-11-21', broker:'Richardson Wealth', type:'Fee',               description:'PMA fee FEE/FRAIS 10/2023',                         ccy:'CAD', localAmt:-852.15, cadAmt:-852.15, gl:'5020', taxSlip:''    },
];

// ── GL config per data type ──────────────────────────────────────────────────
const GL_CFG: Record<ImportDataType, Array<{ key: string; label: string; hint: string; options: { value: string; label: string }[] }>> = {
  transactions: [
    { key:'investments', label:'Investments (Cost)',  hint:'Balance sheet — investment account at cost', options:[
      { value:'1310 – Investments (Cost)', label:'1310 – Investments (Cost)' },
      { value:'1320 – Quoted Investments', label:'1320 – Quoted Investments' },
    ]},
    { key:'realizedGL', label:'Realized G/L', hint:'Income statement — gain or loss on disposition', options:[
      { value:'4500 – Realized G/L on Investments', label:'4500 – Realized G/L on Investments' },
      { value:'4510 – Gain on Disposal',             label:'4510 – Gain on Disposal' },
    ]},
    { key:'commission', label:'Commission / Fees', hint:'Income statement — brokerage costs', options:[
      { value:'5020 – Investment Transaction Costs', label:'5020 – Investment Transaction Costs' },
      { value:'5025 – Brokerage Commissions',        label:'5025 – Brokerage Commissions' },
    ]},
  ],
  holdings: [
    { key:'investments', label:'Investments (Cost)', hint:'Balance sheet — investment account at cost', options:[
      { value:'1310 – Investments (Cost)', label:'1310 – Investments (Cost)' },
    ]},
    { key:'unrealizedGL', label:'Unrealized G/L (Disclose)', hint:'Disclosure only — ASPE cost method', options:[
      { value:'4550 – Unrealized G/L (Disclosure)', label:'4550 – Unrealized G/L (Disclosure)' },
    ]},
  ],
  income: [
    { key:'dividends', label:'Dividend Income', hint:'Income statement — cash dividends received', options:[
      { value:'4400 – Dividend Income', label:'4400 – Dividend Income' },
    ]},
    { key:'interest', label:'Interest Income', hint:'Income statement — interest earned', options:[
      { value:'4010 – Interest Income', label:'4010 – Interest Income' },
    ]},
    { key:'wht', label:'Withholding Tax', hint:'Income statement — claimable via T2209', options:[
      { value:'6150 – Withholding Tax Expense', label:'6150 – Withholding Tax Expense' },
    ]},
    { key:'fees', label:'Account / Mgmt Fees', hint:'Income statement — investment management costs', options:[
      { value:'5020 – Account Fees', label:'5020 – Account Fees' },
    ]},
  ],
};

// ── Col map config ────────────────────────────────────────────────────────────
const COL_MAP_CFG: Record<ImportDataType, { field: string; required?: boolean; defaultCol: string }[]> = {
  transactions: [
    { field:'Process Date',    required:true,  defaultCol:'Column A' },
    { field:'Settle Date',                     defaultCol:'Column B' },
    { field:'Activity Type',   required:true,  defaultCol:'Column C' },
    { field:'Description',                     defaultCol:'Column D' },
    { field:'Security',        required:true,  defaultCol:'Column E' },
    { field:'Symbol / Ticker',                 defaultCol:'Column F' },
    { field:'Broker',          required:true,  defaultCol:'Column G' },
    { field:'Unit Price',      required:true,  defaultCol:'Column H' },
    { field:'Quantity',        required:true,  defaultCol:'Column I' },
    { field:'Currency',        required:true,  defaultCol:'Column J' },
    { field:'Commission',                      defaultCol:'Column K' },
    { field:'FX Rate',                         defaultCol:'Column L' },
    { field:'Notes',                           defaultCol:'Column M' },
  ],
  holdings: [
    { field:'Security',        required:true,  defaultCol:'Column A' },
    { field:'Symbol / Ticker',                 defaultCol:'Column B' },
    { field:'Broker',          required:true,  defaultCol:'Column C' },
    { field:'Acct Last 4',                     defaultCol:'Column D' },
    { field:'Currency',        required:true,  defaultCol:'Column E' },
    { field:'Units',           required:true,  defaultCol:'Column F' },
    { field:'WAC / Unit',                      defaultCol:'Column G' },
    { field:'Cost (Local)',                    defaultCol:'Column H' },
    { field:'Acq. FX Rate',                    defaultCol:'Column I' },
    { field:'Cost (CAD)',                      defaultCol:'Column J' },
    { field:'GL Account',                      defaultCol:'Column K' },
    { field:'Notes',                           defaultCol:'Column L' },
  ],
  income: [
    { field:'Date',            required:true,  defaultCol:'Column A' },
    { field:'Broker',          required:true,  defaultCol:'Column B' },
    { field:'Acct Last 4',                     defaultCol:'Column C' },
    { field:'Transaction Type',required:true,  defaultCol:'Column D' },
    { field:'Description',     required:true,  defaultCol:'Column E' },
    { field:'Security',                        defaultCol:'Column F' },
    { field:'Ticker',                          defaultCol:'Column G' },
    { field:'Local Amount',    required:true,  defaultCol:'Column H' },
    { field:'Currency',        required:true,  defaultCol:'Column I' },
    { field:'FX Rate',                         defaultCol:'Column J' },
    { field:'CAD Amount',                      defaultCol:'Column K' },
    { field:'GL Account',                      defaultCol:'Column L' },
    { field:'Tax Slip',                        defaultCol:'Column M' },
    { field:'Notes',                           defaultCol:'Column N' },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// OCR step indicator
// ─────────────────────────────────────────────────────────────────────────────
function OcrStepBar({ current }: { current: OcrPhase }) {
  const steps = OCR_STEPS.filter(s => s.id !== 'drop' && s.id !== 'queue');
  const effective = current === 'queue' ? 'review' : current;
  const currentIdx = steps.findIndex(s => s.id === effective);
  return (
    <div className="flex items-center gap-0 mb-1">
      {steps.map((s, i) => (
        <React.Fragment key={s.id}>
          <div className="flex items-center gap-1.5">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
              i < currentIdx  ? 'bg-primary text-primary-foreground' :
              i === currentIdx ? 'bg-primary text-primary-foreground ring-2 ring-primary/30' :
              'bg-muted text-muted-foreground'
            }`}>
              {i < currentIdx ? '✓' : i + 1}
            </div>
            <span className={`text-xs font-medium ${i === currentIdx ? 'text-foreground' : 'text-muted-foreground'}`}>{s.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-px mx-2 ${i < currentIdx ? 'bg-primary' : 'bg-border'}`} style={{ minWidth: 12 }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// OCR path: full enhanced flow
// ─────────────────────────────────────────────────────────────────────────────
function OcrUploadStep({ onBack, onComplete, onImport }: {
  onBack: () => void;
  onComplete: () => void;
  onImport?: (rows: OcrRow[], glMap: Record<string, string>) => void;
}) {
  const [phase,        setPhase]      = useState<OcrPhase>('drop');
  const [dragging,     setDragging]   = useState(false);
  const [fileQueue,    setFileQueue]  = useState<string[]>([]);
  const [fileIdx,      setFileIdx]    = useState(0);
  const [progress,     setProgress]   = useState(0);
  const [rows,         setRows]       = useState<OcrRow[]>(OCR_EXTRACTED.map(r => ({ ...r })));
  const [glMap,        setGlMap]      = useState<Record<string, string>>({});
  const [acctMap,      setAcctMap]    = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  // Current file name (during processing)
  const currentFile = fileQueue[fileIdx] ?? 'RichardsonWealth_SPMHoldings_Nov2023.pdf';

  // Init GL map
  useEffect(() => {
    const m: Record<string, string> = {};
    Object.keys(GL_BY_TYPE).forEach(t => { m[t] = GL_BY_TYPE[t].options[0]; });
    setGlMap(m);
  }, []);

  // Discovered broker accounts (derived from actual rows after processing)
  const brokerAccts = Array.from(new Set(rows.map(r => `${r.broker} ···${r.acct}`))).map(key => {
    const [broker, acct] = key.split(' ···');
    return { key, broker, acct };
  });

  useEffect(() => {
    const m: Record<string, string> = {};
    brokerAccts.forEach(a => { m[a.key] = '1310 – Investments (Cost)'; });
    setAcctMap(m);
  }, [rows]);  // eslint-disable-line react-hooks/exhaustive-deps

  // Queue files from drop / file picker
  const enqueueFiles = (names: string[]) => {
    if (!names.length) return;
    setFileQueue(names);
    setFileIdx(0);
    setPhase('queue');
  };

  // Start scanning all queued files
  const startProcessingQueue = () => {
    setProgress(0);
    setFileIdx(0);
    setPhase('processing');
  };

  // Per-file progress ticker
  useEffect(() => {
    if (phase !== 'processing') return;
    const totalFiles = Math.max(fileQueue.length, 1);
    const tickMs = Math.max(40, Math.round(2200 / totalFiles)); // faster per file when many
    const iv = setInterval(() => {
      setProgress(p => {
        const next = p + 4;
        if (next >= 100) {
          clearInterval(iv);
          const nextIdx = fileIdx + 1;
          if (nextIdx < totalFiles) {
            // Move to next file
            setTimeout(() => {
              setFileIdx(nextIdx);
              setProgress(0);
            }, 300);
          } else {
            // All done — merge extra rows if multiple files
            if (totalFiles > 1) {
              const extra = OCR_EXTRA_ROWS.slice(0, Math.min((totalFiles - 1) * 4, OCR_EXTRA_ROWS.length));
              setRows([...OCR_EXTRACTED.map(r => ({ ...r })), ...extra.map(r => ({ ...r }))]);
            } else {
              setRows(OCR_EXTRACTED.map(r => ({ ...r })));
            }
            setTimeout(() => setPhase('review'), 400);
          }
          return 100;
        }
        return next;
      });
    }, tickMs);
    return () => clearInterval(iv);
  }, [phase, fileIdx, fileQueue.length]);

  const totalFiles = Math.max(fileQueue.length, 1);
  const processingLabel =
    progress < 20 ? 'Reading consolidated statement…'   :
    progress < 40 ? 'Identifying securities & tickers…' :
    progress < 60 ? 'Classifying activity types…'       :
    progress < 75 ? 'Extracting amounts & FX rates…'    :
    progress < 90 ? 'Mapping to investment register…'   : 'Finalising…';

  const missingCount = rows.filter(r => r.missing.length > 0).length;
  const totalMissing = rows.reduce((s, r) => s + r.missing.length, 0);

  const patchRow = (id: string, patch: Partial<OcrRow>) => {
    const keyToField: Record<string, string> = { ticker: 'Ticker', fxRate: 'FX Rate', type: 'Activity Type', security: 'Security' };
    const resolvedFields = Object.keys(patch).map(k => keyToField[k] ?? '').filter(Boolean);
    setRows(prev => prev.map(r => r.id === id ? { ...r, ...patch, missing: patch.missing ?? r.missing.filter(f => !resolvedFields.includes(f)) } : r));
  };

  return (
    <div className="space-y-4">

      {/* ── Drop ── */}
      {phase === 'drop' && (
        <>
          <div
            onDrop={e => {
              e.preventDefault(); setDragging(false);
              const names = Array.from(e.dataTransfer.files).map(f => f.name).filter(Boolean);
              if (names.length) enqueueFiles(names);
            }}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer select-none
              ${dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/30'}`}
          >
            <input ref={fileRef} type="file" accept=".pdf,.docx,.png,.jpg,.jpeg" multiple className="hidden"
              onChange={e => {
                const names = Array.from(e.target.files ?? []).map(f => f.name).filter(Boolean);
                if (names.length) enqueueFiles(names);
              }} />
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileSearch className="w-7 h-7 text-primary" />
            </div>
            <p className="text-sm font-semibold text-foreground mb-1">Drop your account statements here or click to browse</p>
            <p className="text-xs text-muted-foreground mb-1">PDF · DOCX · PNG · JPG — consolidated statements, trade confirmations, T3/T5 slips</p>
            <p className="text-[11px] text-muted-foreground mt-2">You can drop multiple monthly statements at once — AI will scan them all together</p>
            <div className="flex items-center justify-center gap-2 mt-5">
              <Button variant="default" size="sm" onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}>
                <Upload className="w-3.5 h-3.5 mr-1.5" /> Browse Files
              </Button>
              <span className="text-xs text-muted-foreground">or drag &amp; drop</span>
            </div>
          </div>
          {/* Supported brokers */}
          <div className="flex flex-wrap gap-1.5 justify-center pt-1">
            {['Richardson Wealth', 'TD Waterhouse', 'RBC Direct', 'BMO InvestorLine', 'Questrade', 'CI Direct', 'National Bank'].map(b => (
              <span key={b} className="text-[10px] px-2 py-0.5 rounded-full bg-muted border border-border text-muted-foreground">{b}</span>
            ))}
          </div>
          <div className="flex justify-end pt-1 border-t border-border">
            <Button variant="secondary" size="sm" onClick={onBack}>Cancel</Button>
          </div>
        </>
      )}

      {/* ── Queue — files selected, awaiting scan ── */}
      {phase === 'queue' && (
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
            <FileSearch className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-foreground">{fileQueue.length} statement{fileQueue.length !== 1 ? 's' : ''} ready to scan</p>
              <p className="text-xs text-muted-foreground mt-0.5">AI will extract transactions from each file, merge duplicates, and flag any missing fields for your review.</p>
            </div>
          </div>

          {/* File list */}
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Files Queued</span>
              <button onClick={() => fileRef.current?.click()}
                className="text-xs text-primary hover:underline flex items-center gap-1">
                <Plus className="w-3 h-3" /> Add more
              </button>
              <input ref={fileRef} type="file" accept=".pdf,.docx,.png,.jpg,.jpeg" multiple className="hidden"
                onChange={e => {
                  const extra = Array.from(e.target.files ?? []).map(f => f.name).filter(Boolean);
                  if (extra.length) setFileQueue(prev => [...prev, ...extra]);
                }} />
            </div>
            <div className="divide-y divide-border max-h-64 overflow-y-auto">
              {fileQueue.map((name, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                  <FileText className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <span className="text-xs text-foreground flex-1 truncate">{name}</span>
                  <button onClick={() => setFileQueue(prev => prev.filter((_, idx) => idx !== i))}
                    className="text-foreground/30 hover:text-red-500 transition-colors">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-border">
            <Button variant="secondary" onClick={() => { setFileQueue([]); setPhase('drop'); }}>Back</Button>
            <Button variant="default" onClick={startProcessingQueue} disabled={fileQueue.length === 0}>
              <FileSearch className="w-3.5 h-3.5 mr-1.5" />
              Scan {fileQueue.length} Statement{fileQueue.length !== 1 ? 's' : ''} →
            </Button>
          </div>
        </div>
      )}

      {/* ── Processing ── */}
      {phase === 'processing' && (
        <div className="py-8 flex flex-col items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <FileSearch className="w-8 h-8 text-primary animate-pulse" />
          </div>
          <div className="text-center space-y-1">
            {totalFiles > 1 && (
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Statement {fileIdx + 1} of {totalFiles}
              </p>
            )}
            <p className="text-sm font-semibold text-foreground truncate max-w-xs">{currentFile}</p>
            <p className="text-xs text-muted-foreground">{processingLabel}</p>
          </div>
          {/* Per-file progress bar */}
          <div className="w-full max-w-xs space-y-1.5">
            <div className="bg-muted rounded-full h-1.5 overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-75" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-muted-foreground text-center tabular-nums">
              {progress < 100 ? `${progress}%` : 'Complete — loading transactions…'}
            </p>
          </div>
          {/* Overall batch progress — shown only when scanning multiple files */}
          {totalFiles > 1 && (
            <div className="w-full max-w-xs space-y-1.5 pt-1 border-t border-border/50">
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Overall progress</span>
                <span>{fileIdx} / {totalFiles} complete</span>
              </div>
              <div className="bg-muted rounded-full h-1 overflow-hidden">
                <div
                  className="h-full bg-primary/60 rounded-full transition-all duration-300"
                  style={{ width: `${Math.round(((fileIdx + progress / 100) / totalFiles) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Review extracted + fill missing ── */}
      {phase === 'review' && (
        <div className="space-y-4">
          <OcrStepBar current="review" />

          {/* Summary banner */}
          <div className={`flex items-start gap-3 p-3 rounded-xl border ${
            missingCount > 0
              ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700'
              : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
          }`}>
            {missingCount > 0
              ? <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              : <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />}
            <div>
              <p className={`text-xs font-semibold ${missingCount > 0 ? 'text-amber-800' : 'text-green-800'}`}>
                {rows.length} transactions extracted from {totalFiles > 1 ? `${totalFiles} statements` : currentFile}
                {missingCount > 0 && ` · ${totalMissing} field${totalMissing !== 1 ? 's' : ''} need attention`}
              </p>
              <p className={`text-xs mt-0.5 ${missingCount > 0 ? 'text-amber-700' : 'text-green-700'}`}>
                {missingCount > 0
                  ? 'Highlighted rows have missing or ambiguous information. Fill them in below before continuing.'
                  : 'All required fields were extracted successfully. Review and continue.'}
              </p>
            </div>
          </div>

          {/* Extracted rows table */}
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="overflow-x-auto max-h-80">
              <table className="w-full text-xs">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-muted/80 border-b border-border">
                    <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Date</th>
                    <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground uppercase tracking-wide">Type</th>
                    <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground uppercase tracking-wide">Security</th>
                    <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground uppercase tracking-wide">Ticker</th>
                    <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground uppercase tracking-wide">Broker</th>
                    <th className="text-right px-3 py-2.5 font-semibold text-muted-foreground uppercase tracking-wide">Qty</th>
                    <th className="text-right px-3 py-2.5 font-semibold text-muted-foreground uppercase tracking-wide">Price</th>
                    <th className="text-center px-2 py-2.5 font-semibold text-muted-foreground uppercase tracking-wide">CCY</th>
                    <th className="text-right px-3 py-2.5 font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">FX Rate</th>
                    <th className="text-right px-3 py-2.5 font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Net (CAD)</th>
                    <th className="px-2 py-2.5 w-6" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => {
                    const hasMissing = r.missing.length > 0;
                    return (
                      <tr key={r.id} className={`border-b border-border/50 transition-colors ${hasMissing ? 'bg-amber-50/60 dark:bg-amber-900/10' : 'hover:bg-muted/30'}`}>
                        <td className="px-3 py-2 text-foreground whitespace-nowrap">{r.date}</td>

                        {/* Activity Type */}
                        <td className="px-3 py-2">
                          {r.missing.includes('Activity Type') ? (
                            <div className="relative">
                              <select
                                value={r.type === '?' ? '' : r.type}
                                onChange={e => patchRow(r.id, { type: e.target.value, missing: r.missing.filter(f => f !== 'Activity Type') })}
                                className="h-6 pl-1.5 pr-5 text-xs rounded border border-amber-400 bg-amber-50 text-amber-900 appearance-none focus:outline-none focus:ring-1 focus:ring-amber-500 w-28"
                              >
                                <option value="">— Select —</option>
                                {TXN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                              </select>
                              <AlertTriangle className="absolute right-1 top-1/2 -translate-y-1/2 w-3 h-3 text-amber-500 pointer-events-none" />
                            </div>
                          ) : (
                            <span className={`px-1.5 py-0.5 rounded font-medium text-[10px] ${typeBadgeClass(r.type)}`}>{r.type}</span>
                          )}
                        </td>

                        {/* Security */}
                        <td className="px-3 py-2">
                          {r.missing.includes('Security') ? (
                            <input value={r.security}
                              onChange={e => patchRow(r.id, { security: e.target.value, missing: e.target.value ? r.missing.filter(f => f !== 'Security') : r.missing })}
                              placeholder="Security name *"
                              className="h-6 px-1.5 text-xs rounded border border-amber-400 bg-amber-50 text-amber-900 w-32 focus:outline-none focus:ring-1 focus:ring-amber-500" />
                          ) : (
                            <span className="font-medium text-foreground">{r.security}</span>
                          )}
                        </td>

                        {/* Ticker */}
                        <td className="px-3 py-2">
                          {r.missing.includes('Ticker') ? (
                            <input value={r.ticker}
                              onChange={e => patchRow(r.id, { ticker: e.target.value.toUpperCase(), missing: e.target.value ? r.missing.filter(f => f !== 'Ticker') : r.missing })}
                              placeholder="TICK"
                              className="h-6 px-1.5 text-xs font-mono rounded border border-amber-400 bg-amber-50 text-amber-900 w-16 uppercase focus:outline-none focus:ring-1 focus:ring-amber-500" />
                          ) : (
                            <span className="font-mono text-foreground">{r.ticker || '—'}</span>
                          )}
                        </td>

                        <td className="px-3 py-2 text-foreground whitespace-nowrap">{r.broker.replace(' Investing','').replace(' Waterhouse','')}</td>
                        <td className="px-3 py-2 text-right tabular-nums font-mono text-foreground">{r.qty > 0 ? r.qty : 0}</td>
                        <td className="px-3 py-2 text-right tabular-nums font-mono text-foreground">{fmt2(r.price)}</td>
                        <td className="px-2 py-2 text-center font-mono text-foreground">{r.ccy}</td>

                        {/* FX Rate */}
                        <td className="px-3 py-2 text-right">
                          {r.missing.includes('FX Rate') ? (
                            <input value={r.fxRate ?? ''}
                              type="number" step="0.0001" placeholder="1.0000"
                              onChange={e => {
                                const v = parseFloat(e.target.value);
                                patchRow(r.id, { fxRate: isNaN(v) ? null : v, missing: !isNaN(v) ? r.missing.filter(f => f !== 'FX Rate') : r.missing });
                              }}
                              className="h-6 px-1.5 text-xs font-mono rounded border border-amber-400 bg-amber-50 text-amber-900 w-20 text-right focus:outline-none focus:ring-1 focus:ring-amber-500" />
                          ) : (
                            <span className="tabular-nums font-mono text-foreground">{fmt2(r.fxRate ?? 0)}</span>
                          )}
                        </td>

                        <td className={`px-3 py-2 text-right tabular-nums font-mono font-semibold ${r.netCAD < 0 ? 'text-red-600' : 'text-foreground'}`}>
                          {fmtCAD(r.netCAD)}
                        </td>
                        <td className="px-2 py-2">
                          {hasMissing && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border bg-muted/60">
                    <td colSpan={9} className="px-3 py-2 font-semibold text-foreground">
                      {rows.length} transactions
                      {missingCount > 0 && <span className="ml-2 text-amber-600 text-[10px] font-semibold">· {missingCount} row{missingCount !== 1 ? 's' : ''} incomplete</span>}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums font-mono font-bold text-foreground">
                      {fmtCAD(rows.reduce((s, r) => s + r.netCAD, 0))}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button variant="secondary" onClick={() => setPhase('drop')}>Re-upload</Button>
            <Button variant="default"
              disabled={rows.some(r => r.missing.length > 0)}
              onClick={() => setPhase('gl')}
            >
              {rows.some(r => r.missing.length > 0)
                ? `Fill ${totalMissing} missing field${totalMissing !== 1 ? 's' : ''} above`
                : 'Next: Map GL Accounts →'}
            </Button>
          </div>
        </div>
      )}

      {/* ── GL Mapping ── */}
      {phase === 'gl' && (
        <div className="space-y-4">
          <OcrStepBar current="gl" />

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-primary/5 border border-primary/20">
            <Tag className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-xs text-foreground">
              Assign a GL account to each transaction type found in this statement. These will be applied across all matching transactions and used to auto-generate journal entries.
            </p>
          </div>

          <div className="rounded-lg border border-border overflow-hidden">
            <div className="px-4 py-2.5 bg-muted/50 border-b border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Transaction Type → GL Account</p>
            </div>
            <div className="divide-y divide-border">
              {Array.from(new Set(rows.map(r => r.type))).map(txnType => {
                const cfg = GL_BY_TYPE[txnType] ?? GL_BY_TYPE['?'];
                const count = rows.filter(r => r.type === txnType).length;
                return (
                  <div key={txnType} className="flex items-center gap-4 px-4 py-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${typeBadgeClass(txnType)}`}>{txnType}</span>
                        <span className="text-xs text-muted-foreground">{count} row{count !== 1 ? 's' : ''}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{cfg.label}</p>
                    </div>
                    <div className="w-72">
                      <select
                        value={glMap[txnType] ?? cfg.options[0]}
                        onChange={e => setGlMap(prev => ({ ...prev, [txnType]: e.target.value }))}
                        className="w-full h-7 px-2 text-xs rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                      >
                        {cfg.options.map(o => <option key={o} value={o}>{o}</option>)}
                        <option value="9999 – Suspense / Unclassified">9999 – Suspense / Unclassified</option>
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Per-security override note */}
          <div className="flex items-start gap-2 rounded-lg bg-muted/50 border border-border px-3 py-2.5">
            <Info className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-muted-foreground">
              GL codes applied here default across all transactions of the same type. You can override individual rows after import from the Transactions tab.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button variant="secondary" onClick={() => setPhase('review')}>Back</Button>
            <Button variant="default" onClick={() => setPhase('accounts')}>Next: Confirm Accounts →</Button>
          </div>
        </div>
      )}

      {/* ── Account / Security Assignment ── */}
      {phase === 'accounts' && (
        <div className="space-y-4">
          <OcrStepBar current="accounts" />

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-primary/5 border border-primary/20">
            <Building2 className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-xs text-foreground">
              Confirm each broker account found in this statement. Map them to the correct investment account classification and GL.
            </p>
          </div>

          {/* Broker accounts found */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Broker Accounts Detected</p>
            {brokerAccts.map(a => (
              <div key={a.key} className="rounded-lg border border-border bg-muted/20 overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3 border-b border-border/60 bg-muted/40">
                  <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-foreground">{a.broker}</p>
                    <p className="text-[10px] font-mono text-muted-foreground">Account ···{a.acct}</p>
                  </div>
                  <Badge variant="success" className="text-[10px]">
                    {OCR_EXTRACTED.filter(r => r.acct === a.acct).length} transactions
                  </Badge>
                </div>
                <div className="px-4 py-3 space-y-2">
                  <div className="flex items-center gap-3">
                    <label className="text-xs text-muted-foreground w-32 flex-shrink-0">Investment GL</label>
                    <select
                      value={acctMap[a.key] ?? '1310 – Investments (Cost)'}
                      onChange={e => setAcctMap(prev => ({ ...prev, [a.key]: e.target.value }))}
                      className="flex-1 h-7 px-2 text-xs rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      <option>1310 – Investments (Cost)</option>
                      <option>1320 – Quoted Investments</option>
                      <option>1330 – Unquoted Investments</option>
                      <option>1340 – Equity Method Investments</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Securities found */}
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Securities Found</p>
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/60 border-b border-border">
                    <th className="text-left px-3 py-2 font-semibold text-muted-foreground uppercase tracking-wide">Security</th>
                    <th className="text-left px-3 py-2 font-semibold text-muted-foreground uppercase tracking-wide">Ticker</th>
                    <th className="text-center px-3 py-2 font-semibold text-muted-foreground uppercase tracking-wide">CCY</th>
                    <th className="text-center px-3 py-2 font-semibold text-muted-foreground uppercase tracking-wide">Txns</th>
                    <th className="text-center px-3 py-2 font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from(new Map(rows.filter(r => r.security).map(r => [r.ticker || r.security, r])).values()).map(r => (
                    <tr key={r.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-2 font-medium text-foreground">{r.security}</td>
                      <td className="px-3 py-2 font-mono text-foreground">{r.ticker || <span className="text-foreground/30">—</span>}</td>
                      <td className="px-3 py-2 text-center font-mono text-foreground">{r.ccy}</td>
                      <td className="px-3 py-2 text-center text-foreground">{rows.filter(x => x.security === r.security).length}</td>
                      <td className="px-3 py-2 text-center">
                        <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 font-medium">
                          <Check className="w-2.5 h-2.5" /> Matched
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button variant="secondary" onClick={() => setPhase('gl')}>Back</Button>
            <Button variant="default" onClick={() => setPhase('done')}>Review &amp; Import →</Button>
          </div>
        </div>
      )}

      {/* ── Final Confirmation ── */}
      {phase === 'done' && (
        <div className="space-y-4">
          <OcrStepBar current="done" />

          <div className="flex items-start gap-3 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200">
            <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-green-800">{rows.length} transactions ready to import from {totalFiles > 1 ? `${totalFiles} statements` : currentFile}</p>
              <p className="text-xs text-green-700 mt-0.5">All required fields are complete · GL accounts assigned · broker accounts confirmed</p>
            </div>
          </div>

          {/* Final summary table */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto max-h-56">
              <table className="w-full text-xs">
                <thead className="sticky top-0">
                  <tr className="border-b border-border bg-muted/70">
                    {['Date','Type','Security','Ticker','Broker','Qty','Price','CCY','Net (CAD)','GL Account'].map(h => (
                      <th key={h} className="text-left px-3 py-2 font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-2 text-foreground whitespace-nowrap">{r.date}</td>
                      <td className="px-3 py-2">
                        <span className={`px-1.5 py-0.5 rounded font-medium text-[10px] ${typeBadgeClass(r.type)}`}>{r.type}</span>
                      </td>
                      <td className="px-3 py-2 font-medium text-foreground">{r.security}</td>
                      <td className="px-3 py-2 font-mono text-foreground">{r.ticker || '—'}</td>
                      <td className="px-3 py-2 text-foreground whitespace-nowrap">{r.broker.replace(' Investing','').replace(' Waterhouse','')}</td>
                      <td className="px-3 py-2 text-right tabular-nums font-mono text-foreground">{r.qty > 0 ? r.qty : 0}</td>
                      <td className="px-3 py-2 text-right tabular-nums font-mono text-foreground">{fmt2(r.price)}</td>
                      <td className="px-2 py-2 text-center font-mono text-foreground">{r.ccy}</td>
                      <td className={`px-3 py-2 text-right tabular-nums font-mono font-semibold ${r.netCAD < 0 ? 'text-red-600' : 'text-foreground'}`}>{fmtCAD(r.netCAD)}</td>
                      <td className="px-3 py-2 font-mono text-foreground text-[10px]">{glMap[r.type] ?? '1310'}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border bg-muted/60">
                    <td colSpan={8} className="px-3 py-2 font-semibold text-foreground">{rows.length} transactions</td>
                    <td className="px-3 py-2 text-right tabular-nums font-mono font-bold text-foreground">{fmtCAD(rows.reduce((s, r) => s + r.netCAD, 0))}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* GL summary */}
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="flex items-center gap-1.5 px-4 py-2.5 bg-muted/60 border-b border-border">
              <Tag className="w-3 h-3 text-primary" />
              <span className="text-xs font-semibold text-foreground">GL Account Summary</span>
            </div>
            <table className="w-full text-xs">
              <tbody>
                {Array.from(new Set(rows.map(r => r.type))).map(t => (
                  <tr key={t} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-2.5 text-muted-foreground">{t}</td>
                    <td className="px-4 py-2.5 font-mono font-medium text-foreground">{glMap[t] ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button variant="secondary" onClick={() => setPhase('accounts')}>Back</Button>
            <Button variant="default" onClick={() => {
              onImport?.(rows, glMap);
              onComplete();
              toast.success(`${rows.length} transactions imported · GL accounts assigned`, { duration: 4000 });
            }}>
              <Check className="w-3.5 h-3.5 mr-1.5" /> Import {rows.length} Transactions
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Excel wizard ──────────────────────────────────────────────────────────────
function ExcelWizard({ onBack, onComplete }: { onBack: () => void; onComplete: () => void }) {
  const [step,     setStep]     = useState<WizardStep>('choose');
  const [dataType, setDataType] = useState<ImportDataType>('transactions');
  const [colMaps,  setColMaps]  = useState<Record<string, string>>({});
  const [glTags,   setGlTags]   = useState<Record<string, string>>({});
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const d: Record<string, string> = {};
    GL_CFG[dataType].forEach(f => { d[f.key] = f.options[0]?.value ?? ''; });
    setGlTags(d);
  }, [dataType]);

  useEffect(() => {
    const d: Record<string, string> = {};
    COL_MAP_CFG[dataType].forEach(f => { d[f.field] = f.defaultCol; });
    setColMaps(d);
  }, [dataType]);

  const stepIdx    = WIZARD_STEPS.findIndex(s => s.id === step);
  const previewData = dataType === 'transactions' ? MOCK_TXN_PREVIEW : dataType === 'holdings' ? MOCK_HOLDINGS_PREVIEW : MOCK_INCOME_PREVIEW;
  const previewCount = previewData.length;

  const DataTypeCard = ({ id, title, desc, icon: Icon }: { id: ImportDataType; title: string; desc: string; icon: React.ComponentType<{ className?: string }> }) => (
    <button onClick={() => setDataType(id)}
      className={`flex items-start gap-3 w-full p-4 rounded-xl border-2 text-left transition-all ${
        dataType === id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40 hover:bg-muted/30'
      }`}>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${dataType === id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
        <Icon className="w-4.5 h-4.5" />
      </div>
      <div>
        <p className={`text-sm font-semibold ${dataType === id ? 'text-primary' : 'text-foreground'}`}>{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
      </div>
      {dataType === id && <Check className="w-4 h-4 text-primary ml-auto flex-shrink-0 mt-0.5" />}
    </button>
  );

  return (
    <div className="space-y-4">
      {/* Step indicator */}
      <div className="flex items-center gap-0">
        {WIZARD_STEPS.map((s, i) => (
          <React.Fragment key={s.id}>
            <div className="flex items-center gap-1.5">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
                i < stepIdx  ? 'bg-primary text-primary-foreground' :
                i === stepIdx ? 'bg-primary text-primary-foreground ring-2 ring-primary/30' :
                'bg-muted text-muted-foreground'
              }`}>{i < stepIdx ? '✓' : i + 1}</div>
              <span className={`text-xs font-medium ${i === stepIdx ? 'text-foreground' : 'text-muted-foreground'}`}>{s.label}</span>
            </div>
            {i < WIZARD_STEPS.length - 1 && (
              <div className={`flex-1 h-px mx-2 ${i < stepIdx ? 'bg-primary' : 'bg-border'}`} style={{ minWidth: 12 }} />
            )}
          </React.Fragment>
        ))}
      </div>

      {step === 'choose' && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">Select the type of investment data you want to import:</p>
          <DataTypeCard id="transactions" title="Transactions"        desc="Purchases, sales, dividends, transfers — full transaction register" icon={FileSpreadsheet} />
          <DataTypeCard id="holdings"     title="Holdings / Positions" desc="Opening or closing position balances per security and broker"       icon={FileSpreadsheet} />
          <DataTypeCard id="income"       title="Income & Expenses"   desc="Interest income, fees, withholding tax, DRIP, ROC entries"          icon={FileSpreadsheet} />
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button variant="secondary" onClick={onBack}>Cancel</Button>
            <Button variant="default" onClick={() => setStep('upload')}>Next: Upload →</Button>
          </div>
        </div>
      )}

      {step === 'upload' && (
        <div className="space-y-3">
          <div
            onDrop={e => { e.preventDefault(); setDragging(false); setFileName(e.dataTransfer.files[0]?.name ?? ''); setStep('map'); }}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer select-none ${dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/30'}`}
          >
            <input ref={fileRef} type="file" accept=".xlsx,.csv" className="hidden"
              onChange={e => { setFileName(e.target.files?.[0]?.name ?? ''); setStep('map'); }} />
            <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground">Drop <span className="text-primary font-semibold capitalize">{dataType}</span> file here or click to browse</p>
            <p className="text-xs text-muted-foreground mt-1">.xlsx or .csv accepted</p>
          </div>
          <div className="flex items-center justify-between text-xs">
            <button className="flex items-center gap-1.5 text-primary hover:underline font-medium" onClick={() => toast.success(`Downloading ${dataType} template…`)}>
              <Download className="w-3.5 h-3.5" /> Download {dataType} template
            </button>
            <span className="text-muted-foreground">or <button className="underline underline-offset-2" onClick={() => { setFileName('sample_data.csv'); setStep('map'); }}>use sample data</button></span>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button variant="secondary" onClick={() => setStep('choose')}>Back</Button>
          </div>
        </div>
      )}

      {step === 'map' && (
        <div className="space-y-3">
          {fileName && (
            <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg text-xs">
              <FileSpreadsheet className="w-3.5 h-3.5 text-primary" />
              <span className="font-medium text-foreground">{fileName}</span>
              <Badge variant="success" className="text-xs ml-auto">Loaded</Badge>
            </div>
          )}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200">
            <Info className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-800 dark:text-blue-300">
              Match your spreadsheet columns to the required fields below. Required fields are marked <span className="font-semibold">*</span>.
            </p>
          </div>
          <div className="max-h-72 overflow-y-auto rounded-lg border border-border">
            {COL_MAP_CFG[dataType].map(({ field, required, defaultCol }) => (
              <div key={field} className="flex items-center justify-between px-3 py-2 border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors">
                <span className="text-sm text-foreground">{field}{required && <span className="text-red-500 ml-0.5">*</span>}</span>
                <Select value={colMaps[field] ?? defaultCol}
                  onChange={e => setColMaps(prev => ({ ...prev, [field]: e.target.value }))}
                  options={[{ value:'(skip)', label:'— Skip —' }, ...COLS]} className="w-32" />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button variant="secondary" onClick={() => setStep('upload')}>Back</Button>
            <Button variant="default" onClick={() => setStep('gl')}>Next: GL Tags →</Button>
          </div>
        </div>
      )}

      {step === 'gl' && (
        <div className="space-y-4">
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-primary/5 border border-primary/20">
            <Tag className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-xs text-foreground">
              Assign GL account codes for each field type. These will be applied to all imported {dataType}.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
            {GL_CFG[dataType].map(({ key, label, hint, options }) => (
              <div key={key}>
                <Select label={label} value={glTags[key] ?? options[0]?.value ?? ''}
                  onChange={e => setGlTags(prev => ({ ...prev, [key]: e.target.value }))} options={options} />
                <p className="text-[11px] text-muted-foreground mt-1">{hint}</p>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button variant="secondary" onClick={() => setStep('map')}>Back</Button>
            <Button variant="default" onClick={() => setStep('preview')}>Preview →</Button>
          </div>
        </div>
      )}

      {step === 'preview' && (
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200">
            <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-green-800 dark:text-green-300 font-medium">{previewCount} records ready to import. No errors detected.</p>
          </div>

          {dataType === 'transactions' && (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="overflow-x-auto max-h-64">
                <table className="w-full text-sm">
                  <thead className="sticky top-0">
                    <tr className="border-b border-border bg-muted/70">
                      {['Date','Settle','Type','Security','Broker','Qty','Price','CCY','Net (CAD)'].map(h => (
                        <th key={h} className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_TXN_PREVIEW.map((r, i) => (
                      <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="px-3 py-2 text-xs text-foreground whitespace-nowrap">{r.date}</td>
                        <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">{r.settleDate}</td>
                        <td className="px-3 py-2"><span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${r.type==='Purchase'?'bg-blue-50 text-blue-700':r.type==='Sale'?'bg-orange-50 text-orange-700':r.type==='Dividend'?'bg-green-50 text-green-700':'bg-muted text-foreground'}`}>{r.type}</span></td>
                        <td className="px-3 py-2"><div className="text-xs font-medium text-foreground">{r.security}</div><div className="text-[10px] font-mono text-muted-foreground">{r.ticker}</div></td>
                        <td className="px-3 py-2 text-xs text-foreground">{r.broker}</td>
                        <td className="px-3 py-2 text-right tabular-nums font-mono text-xs">{r.qty>0?r.qty:'—'}</td>
                        <td className="px-3 py-2 text-right tabular-nums font-mono text-xs">{r.price>0?fmt2(r.price):'—'}</td>
                        <td className="px-3 py-2 text-center font-mono text-xs">{r.ccy}</td>
                        <td className={`px-3 py-2 text-right tabular-nums font-mono font-semibold text-xs ${r.netCAD<0?'text-red-600':'text-foreground'}`}>{fmtCAD(r.netCAD)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-border bg-muted/60">
                      <td colSpan={8} className="px-3 py-2 text-xs font-semibold">{previewCount} transactions</td>
                      <td className="px-3 py-2 text-right tabular-nums font-mono font-bold text-xs">{fmtCAD(MOCK_TXN_PREVIEW.reduce((s,r)=>s+r.netCAD,0))}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {dataType === 'holdings' && (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border bg-muted/70">{['Security','Ticker','Broker','CCY','Units','WAC / Unit','Cost (CAD)','GL Acct'].map(h=><th key={h} className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">{h}</th>)}</tr></thead>
                  <tbody>{MOCK_HOLDINGS_PREVIEW.map((r,i)=><tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors"><td className="px-3 py-2 text-xs font-medium text-foreground">{r.security}</td><td className="px-3 py-2 text-xs font-mono text-foreground">{r.ticker}</td><td className="px-3 py-2 text-xs text-foreground">{r.broker}</td><td className="px-3 py-2 text-center text-xs font-mono">{r.ccy}</td><td className="px-3 py-2 text-right tabular-nums font-mono text-xs">{r.units.toLocaleString()}</td><td className="px-3 py-2 text-right tabular-nums font-mono text-xs">{fmt2(r.wac)}</td><td className="px-3 py-2 text-right tabular-nums font-mono font-semibold text-xs">{fmtCAD(r.costCAD)}</td><td className="px-3 py-2 text-xs font-mono text-foreground">{r.gl}</td></tr>)}</tbody>
                  <tfoot><tr className="border-t-2 border-border bg-muted/60"><td colSpan={6} className="px-3 py-2 text-xs font-semibold">{previewCount} positions</td><td className="px-3 py-2 text-right tabular-nums font-mono font-bold text-xs">{fmtCAD(MOCK_HOLDINGS_PREVIEW.reduce((s,r)=>s+r.costCAD,0))}</td><td/></tr></tfoot>
                </table>
              </div>
            </div>
          )}

          {dataType === 'income' && (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border bg-muted/70">{['Date','Broker','Type','Description','CCY','Local Amt','CAD Amt','GL Acct','Tax Slip'].map(h=><th key={h} className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">{h}</th>)}</tr></thead>
                  <tbody>{MOCK_INCOME_PREVIEW.map((r,i)=><tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors"><td className="px-3 py-2 text-xs text-foreground whitespace-nowrap">{r.date}</td><td className="px-3 py-2 text-xs text-foreground">{r.broker}</td><td className="px-3 py-2"><span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">{r.type}</span></td><td className="px-3 py-2 text-xs text-foreground max-w-[150px] truncate">{r.description}</td><td className="px-3 py-2 text-center text-xs font-mono">{r.ccy}</td><td className={`px-3 py-2 text-right tabular-nums font-mono text-xs ${r.localAmt<0?'text-red-600':''}`}>{r.localAmt<0?`(${fmt2(Math.abs(r.localAmt))})`:fmt2(r.localAmt)}</td><td className={`px-3 py-2 text-right tabular-nums font-mono font-semibold text-xs ${r.cadAmt<0?'text-red-600':r.type==='Interest Income'?'text-green-600':''}`}>{fmtCAD(r.cadAmt)}</td><td className="px-3 py-2 text-xs font-mono text-foreground">{r.gl}</td><td className="px-3 py-2">{r.taxSlip?<span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold font-mono">{r.taxSlip}</span>:<span className="text-foreground/30 text-xs">—</span>}</td></tr>)}</tbody>
                  <tfoot><tr className="border-t-2 border-border bg-muted/60"><td colSpan={6} className="px-3 py-2 text-xs font-semibold">{previewCount} entries</td><td className="px-3 py-2 text-right tabular-nums font-mono font-bold text-xs">{fmtCAD(MOCK_INCOME_PREVIEW.reduce((s,r)=>s+r.cadAmt,0))}</td><td colSpan={2}/></tr></tfoot>
                </table>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-border overflow-hidden">
            <div className="flex items-center gap-1.5 px-4 py-2.5 bg-muted/60 border-b border-border">
              <Tag className="w-3 h-3 text-primary" /><span className="text-xs font-semibold text-foreground">GL Account Mapping</span>
            </div>
            <table className="w-full text-xs">
              <thead><tr className="border-b border-border bg-muted/30"><th className="text-left px-4 py-2 font-semibold text-muted-foreground uppercase tracking-wide">Field</th><th className="text-left px-4 py-2 font-semibold text-muted-foreground uppercase tracking-wide">GL Account</th></tr></thead>
              <tbody>{GL_CFG[dataType].map(({key,label})=><tr key={key} className="border-b border-border/50 hover:bg-muted/30 transition-colors"><td className="px-4 py-2.5 text-muted-foreground">{label}</td><td className="px-4 py-2.5 font-mono font-medium text-foreground">{glTags[key]||'—'}</td></tr>)}</tbody>
              <tfoot><tr className="bg-primary/5 border-t-2 border-primary/25"><td className="px-4 py-2.5 font-semibold text-foreground">{previewCount} records</td><td className="px-4 py-2.5"><span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">✓ Ready to import</span></td></tr></tfoot>
            </table>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button variant="secondary" onClick={() => setStep('gl')}>Back</Button>
            <Button variant="default" onClick={() => { onComplete(); toast.success(`${previewCount} ${dataType} imported successfully`, { duration: 4000 }); }}>
              <Check className="w-3.5 h-3.5 mr-1.5" /> Import {previewCount} Records
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main: InvUploadWizard
// ─────────────────────────────────────────────────────────────────────────────
export function InvUploadWizard({ onBack, onImport, isModal }: {
  onBack: () => void;
  onImport?: (rows: OcrRow[], glMap: Record<string, string>) => void;
  /** When true the wizard renders as modal body: no full-page back header, no 20% gutter */
  isModal?: boolean;
}) {
  const [path,        setPath]        = useState<ImportPath | 'blank' | null>(null);
  const [dragging,    setDragging]    = useState(false);
  const [blankStep,   setBlankStep]   = useState<BlankStep>('setup');
  const [blankTitle,  setBlankTitle]  = useState('SPM Holdings Ltd – Investment Workpaper');
  const [blankEntity, setBlankEntity] = useState('SPM Holdings Ltd.');
  const [blankFYE,    setBlankFYE]    = useState('2024-07-31');
  const [blankAccts,  setBlankAccts]  = useState([
    { id: '1', broker: 'Richardson Wealth', acctNo: 'H11-YLF0-E', type: 'IAA' },
    { id: '2', broker: 'Richardson Wealth', acctNo: 'H11-YLG0-E', type: 'PMA' },
  ]);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase() ?? '';
    if (['pdf', 'docx', 'png', 'jpg', 'jpeg'].includes(ext)) setPath('ocr');
    else setPath('excel');
  };

  const subTitle =
    path === 'ocr'   ? 'Scan Investment Statement' :
    path === 'excel' ? 'Import from Excel / CSV'   :
    path === 'blank' ? 'Start Blank Workpaper'      :
    'Add Investment Workpaper';

  return (
    /* When isModal, fill the definite-height DialogContent so flex-1 scroll works */
    <div className={isModal ? "flex flex-col h-full" : "flex flex-col"}>
      {/* ── Back header — full-page mode only ─────────────────────────────── */}
      {!isModal && (
        <div className="flex items-center gap-2 px-6 pt-5 pb-4 border-b border-border flex-shrink-0">
          <button onClick={path ? () => setPath(null) : onBack}
            className="flex items-center gap-1.5 text-sm text-foreground hover:text-muted-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            {path ? 'Back' : 'Back to Investments'}
          </button>
          <span className="text-muted-foreground mx-1">/</span>
          <span className="text-sm font-semibold text-foreground">{subTitle}</span>
        </div>
      )}

      {/* ── Modal mode: sub-path back nav (landing "Back" handled by Dialog ×) */}
      {isModal && path && (
        <div className="flex items-center gap-2 px-4 pt-3 pb-3 border-b border-border flex-shrink-0">
          <button onClick={() => setPath(null)}
            className="flex items-center gap-1.5 text-sm text-foreground hover:text-muted-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <span className="text-muted-foreground mx-1">/</span>
          <span className="text-sm font-semibold text-foreground">{subTitle}</span>
        </div>
      )}

      <div
        className={isModal ? "flex-1 min-h-0 overflow-y-auto px-4 py-4" : "px-[20%] py-6 overflow-y-auto"}
        style={isModal ? undefined : { maxHeight: 'calc(100vh - 120px)' }}
      >
        <div className="rounded-xl border border-border bg-card">
          <div className="px-6 py-5 space-y-5">

            {/* ── Landing — no path chosen ── */}
            {path === null && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Set Up Investment Workpaper</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Start from scratch or import existing data from a broker statement or spreadsheet.
                  </p>
                </div>

                {/* Option cards */}
                <div className="grid grid-cols-1 gap-3">

                  {/* Blank */}
                  <button onClick={() => setPath('blank')}
                    className="flex items-start gap-4 p-4 rounded-xl border-2 border-border hover:border-primary/50 hover:bg-muted/30 text-left transition-all group">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 transition-colors">
                      <Plus className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Start Blank</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Create an empty investment workpaper and add holdings, transactions, and income entries manually.</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-foreground/30 ml-auto flex-shrink-0 mt-1 group-hover:text-muted-foreground" />
                  </button>

                  {/* OCR / Statement scan */}
                  <button onClick={() => setPath('ocr')}
                    className="flex items-start gap-4 p-4 rounded-xl border-2 border-border hover:border-primary/50 hover:bg-muted/30 text-left transition-all group">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <FileSearch className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Scan Investment Statement</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Upload a PDF or image broker statement — AI extracts transactions, flags missing fields, and guides GL mapping.</p>
                      <div className="flex gap-1.5 mt-2 flex-wrap">
                        {['PDF', 'DOCX', 'PNG', 'JPG'].map(f => <span key={f} className="text-[10px] font-mono px-1.5 py-0.5 bg-muted rounded border border-border">{f}</span>)}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-foreground/30 ml-auto flex-shrink-0 mt-1 group-hover:text-muted-foreground" />
                  </button>

                  {/* Excel / CSV */}
                  <button onClick={() => setPath('excel')}
                    className="flex items-start gap-4 p-4 rounded-xl border-2 border-border hover:border-primary/50 hover:bg-muted/30 text-left transition-all group">
                    <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                      <FileSpreadsheet className="w-5 h-5 text-green-700 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Import from Excel / CSV</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Upload a spreadsheet export — map columns, assign GL accounts, preview before importing.</p>
                      <div className="flex gap-1.5 mt-2 flex-wrap">
                        {['.xlsx', '.csv'].map(f => <span key={f} className="text-[10px] font-mono px-1.5 py-0.5 bg-muted rounded border border-border">{f}</span>)}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-foreground/30 ml-auto flex-shrink-0 mt-1 group-hover:text-muted-foreground" />
                  </button>

                  {/* Drop zone as additional shortcut */}
                  <div
                    onDrop={e => { e.preventDefault(); setDragging(false); const n = e.dataTransfer.files[0]?.name ?? ''; if (n) handleFile(n); }}
                    onDragOver={e => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onClick={() => fileRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer select-none
                      ${dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40 hover:bg-muted/30 transition-colors'}`}
                  >
                    <input ref={fileRef} type="file" accept=".pdf,.docx,.png,.jpg,.jpeg,.xlsx,.csv" className="hidden"
                      onChange={e => { const n = e.target.files?.[0]?.name ?? ''; if (n) handleFile(n); }} />
                    <p className="text-xs text-muted-foreground">Or drop any file here to auto-detect type</p>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <Button variant="secondary" onClick={onBack}>Cancel</Button>
                </div>
              </div>
            )}

            {/* ── Blank workpaper ── */}
            {path === 'blank' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Blank Investment Workpaper</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {blankStep === 'setup'
                      ? 'Set up the workpaper details — title, entity, fiscal year, and broker accounts.'
                      : 'Review the sections that will be created. Add data manually or import at any time.'}
                  </p>
                </div>

                {/* Step indicator */}
                <div className="flex items-center gap-0">
                  {(['Setup', 'Sections'] as const).map((label, i) => {
                    const active = i === (blankStep === 'setup' ? 0 : 1);
                    const done   = blankStep === 'sections' && i === 0;
                    return (
                      <React.Fragment key={label}>
                        <div className="flex items-center gap-1.5">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
                            done   ? 'bg-primary text-primary-foreground' :
                            active ? 'bg-primary text-primary-foreground ring-2 ring-primary/30' :
                                     'bg-muted text-muted-foreground'
                          }`}>{done ? '✓' : i + 1}</div>
                          <span className={`text-xs font-medium ${active ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</span>
                        </div>
                        {i === 0 && <div className={`flex-1 h-px mx-2 ${done ? 'bg-primary' : 'bg-border'}`} style={{ minWidth: 16 }} />}
                      </React.Fragment>
                    );
                  })}
                </div>

                {/* ── Step 1: Setup ── */}
                {blankStep === 'setup' && (
                  <div className="space-y-4">
                    {/* Basic info */}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-foreground mb-1">
                          Workpaper Title <span className="text-red-500">*</span>
                        </label>
                        <input
                          value={blankTitle}
                          onChange={e => setBlankTitle(e.target.value)}
                          placeholder="e.g. SPM Holdings Ltd – Investment Workpaper"
                          className="w-full h-8 px-3 text-sm rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-foreground mb-1">
                            Entity Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            value={blankEntity}
                            onChange={e => setBlankEntity(e.target.value)}
                            placeholder="Legal entity name"
                            className="w-full h-8 px-3 text-sm rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-foreground mb-1">
                            Fiscal Year End <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="date"
                            value={blankFYE}
                            onChange={e => setBlankFYE(e.target.value)}
                            className="w-full h-8 px-3 text-sm rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Broker accounts */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-foreground uppercase tracking-wide">
                          Broker Accounts
                        </label>
                        <button
                          onClick={() => setBlankAccts(prev => [...prev, { id: String(Date.now()), broker: '', acctNo: '', type: 'IAA' }])}
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" /> Add account
                        </button>
                      </div>
                      <div className="rounded-lg border border-border overflow-hidden">
                        {blankAccts.length === 0 ? (
                          <div className="px-4 py-5 text-center text-xs text-muted-foreground">
                            No accounts added — click "Add account" to add one, or skip and add later.
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 border-b border-border">
                              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide flex-1">Broker</span>
                              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide w-28">Account #</span>
                              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide w-20">Type</span>
                              <span className="w-3.5" />
                            </div>
                            <div className="divide-y divide-border">
                              {blankAccts.map((acct, i) => (
                                <div key={acct.id} className="flex items-center gap-2 px-3 py-2.5">
                                  <Building2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                                  <input
                                    value={acct.broker}
                                    onChange={e => setBlankAccts(prev => prev.map((a, idx) => idx === i ? { ...a, broker: e.target.value } : a))}
                                    placeholder="Broker name"
                                    className="flex-1 h-6 px-1.5 text-xs rounded border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring min-w-0"
                                  />
                                  <input
                                    value={acct.acctNo}
                                    onChange={e => setBlankAccts(prev => prev.map((a, idx) => idx === i ? { ...a, acctNo: e.target.value } : a))}
                                    placeholder="H11-YLF0-E"
                                    className="w-28 h-6 px-1.5 text-xs font-mono rounded border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                                  />
                                  <select
                                    value={acct.type}
                                    onChange={e => setBlankAccts(prev => prev.map((a, idx) => idx === i ? { ...a, type: e.target.value } : a))}
                                    className="w-20 h-6 px-1 text-xs rounded border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                                  >
                                    {['IAA','PMA','RRSP','TFSA','RESP','Cash','Other'].map(t => <option key={t}>{t}</option>)}
                                  </select>
                                  <button
                                    onClick={() => setBlankAccts(prev => prev.filter((_, idx) => idx !== i))}
                                    className="text-foreground/30 hover:text-red-500 transition-colors flex-shrink-0"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        You can add or edit accounts at any time from workpaper settings.
                      </p>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-border">
                      <Button variant="secondary" onClick={() => { setBlankStep('setup'); setPath(null); }}>Back</Button>
                      <Button
                        variant="default"
                        disabled={!blankTitle.trim() || !blankEntity.trim() || !blankFYE}
                        onClick={() => setBlankStep('sections')}
                      >
                        Next: Review Sections →
                      </Button>
                    </div>
                  </div>
                )}

                {/* ── Step 2: Sections ── */}
                {blankStep === 'sections' && (
                  <div className="space-y-4">
                    {/* Summary pill */}
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
                      <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <div className="text-xs text-foreground/80 min-w-0 flex-1">
                        <p className="font-semibold truncate">{blankTitle}</p>
                        <p className="text-muted-foreground mt-0.5">
                          {blankEntity}
                          {blankFYE && ` · FYE ${blankFYE}`}
                          {blankAccts.length > 0 && ` · ${blankAccts.length} account${blankAccts.length !== 1 ? 's' : ''}`}
                        </p>
                      </div>
                      <button
                        onClick={() => setBlankStep('setup')}
                        className="ml-auto flex-shrink-0 text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        <Pencil className="w-3 h-3" /> Edit
                      </button>
                    </div>

                    {/* Section cards */}
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Holdings',         desc: 'Opening positions by security & broker'       },
                        { label: 'Transactions',      desc: 'Purchase, sale, dividend & transfer activity' },
                        { label: 'WAC Schedule',      desc: 'Weighted average cost per security'           },
                        { label: 'Gain / Loss',       desc: 'Realized G/L on dispositions'                },
                        { label: 'FX Schedule',       desc: 'Foreign currency translation'                 },
                        { label: 'Income & Expenses', desc: 'Interest, fees, WHT, DRIP, ROC'              },
                        { label: 'Broker Recon',      desc: 'Reconcile to broker statements'              },
                        { label: 'AJEs',              desc: 'Automated journal entries'                   },
                      ].map(s => (
                        <div key={s.label} className="flex items-start gap-3 p-3.5 rounded-xl border border-border bg-muted/20">
                          <div className="w-2 h-2 rounded-full bg-foreground/20 flex-shrink-0 mt-1.5" />
                          <div>
                            <p className="text-xs font-semibold text-foreground">{s.label}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{s.desc}</p>
                            <span className="text-[10px] text-foreground/30 italic mt-1 block">Empty — ready to add data</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-border">
                      <Button variant="secondary" onClick={() => setBlankStep('setup')}>Back</Button>
                      <Button variant="default" onClick={() => { onBack(); toast.success(`"${blankTitle}" created`); }}>
                        <Check className="w-3.5 h-3.5 mr-1.5" /> Create Workpaper
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── OCR path ── */}
            {path === 'ocr' && (
              <>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Scan Investment Statement</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Upload a PDF, DOCX or image — AI will extract all transactions, flag missing fields, and guide you through GL and account mapping.
                  </p>
                </div>
                <OcrUploadStep onBack={() => setPath(null)} onComplete={onBack} onImport={onImport} />
              </>
            )}

            {/* ── Excel path ── */}
            {path === 'excel' && (
              <>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Import from Excel / CSV</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Upload a spreadsheet with investment data — map columns, tag GL accounts, then preview before importing.
                  </p>
                </div>
                <ExcelWizard onBack={() => setPath(null)} onComplete={onBack} />
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

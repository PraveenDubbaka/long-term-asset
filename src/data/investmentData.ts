// ── Investment Mock Data — Countable Holdings Corp., FY2025 ──────────────────
// Source: Luka_Investment_Schedule_FY2025.xlsx

import type {
  Holding, InvTransaction, WACGroup, RealizedRow, DividendRow,
  UnrealizedRow, FXRateRow, FXScheduleRow, InvAJE, GLSummaryRow,
} from '../types/investmentTypes';

// ─── Holdings (closing positions Dec 31, 2025) ───────────────────────────────
export const holdings: Holding[] = [
  {
    id: 'h1', security: 'Apple Inc.', ticker: 'AAPL', broker: 'TD Waterhouse', acctLast4: '4521',
    currency: 'USD', units: 250, wacLocal: 189.14, costLocal: 47284.98, acqFxRate: 1.4197,
    costCAD: 67102.68, yeFxRate: 1.442, fmvLocal: 60000.00, fmvCAD: 86520.00,
    unrealizedGL_CAD: 19417.32, glAccount: '1310', notes: 'WAC per FIFO-equivalent — 2 lots',
  },
  {
    id: 'h2', security: 'Apple Inc.', ticker: 'AAPL', broker: 'RBC Direct Investing', acctLast4: '8834',
    currency: 'USD', units: 50, wacLocal: 205.20, costLocal: 10260.00, acqFxRate: 1.3890,
    costCAD: 14251.14, yeFxRate: 1.442, fmvLocal: 12000.00, fmvCAD: 17304.00,
    unrealizedGL_CAD: 3052.87, glAccount: '1310',
  },
  {
    id: 'h3', security: 'Royal Bank of Canada', ticker: 'RY.TO', broker: 'TD Waterhouse', acctLast4: '4521',
    currency: 'CAD', units: 200, wacLocal: 132.50, costLocal: 26500.00, acqFxRate: 1,
    costCAD: 26500.00, yeFxRate: 1, fmvLocal: 29000.00, fmvCAD: 29000.00,
    unrealizedGL_CAD: 2500.00, glAccount: '1310',
  },
  {
    id: 'h4', security: 'Royal Bank of Canada', ticker: 'RY.TO', broker: 'BMO InvestorLine', acctLast4: '6690',
    currency: 'CAD', units: 150, wacLocal: 130.00, costLocal: 19500.00, acqFxRate: 1,
    costCAD: 19500.00, yeFxRate: 1, fmvLocal: 21750.00, fmvCAD: 21750.00,
    unrealizedGL_CAD: 2250.00, glAccount: '1310',
  },
  {
    id: 'h5', security: 'Amazon.com Inc.', ticker: 'AMZN', broker: 'TD Waterhouse', acctLast4: '4521',
    currency: 'USD', units: 30, wacLocal: 185.40, costLocal: 5562.00, acqFxRate: 1.4390,
    costCAD: 8003.50, yeFxRate: 1.442, fmvLocal: 6450.00, fmvCAD: 9300.90,
    unrealizedGL_CAD: 1297.40, glAccount: '1310',
  },
  {
    id: 'h6', security: 'Shopify Inc.', ticker: 'SHOP.TO', broker: 'BMO InvestorLine', acctLast4: '6690',
    currency: 'CAD', units: 150, wacLocal: 126.69, costLocal: 19004.00, acqFxRate: 1,
    costCAD: 19004.00, yeFxRate: 1, fmvLocal: 22500.00, fmvCAD: 22500.00,
    unrealizedGL_CAD: 3496.00, glAccount: '1310', notes: 'Transferred in from RBC mid-year — verify cost basis',
  },
  {
    id: 'h7', security: 'Airbus SE', ticker: 'AIR.PA', broker: 'RBC Direct Investing', acctLast4: '8834',
    currency: 'EUR', units: 75, wacLocal: 146.93, costLocal: 11019.98, acqFxRate: 1.5038,
    costCAD: 16575.23, yeFxRate: 1.558, fmvLocal: 11625.00, fmvCAD: 18111.75,
    unrealizedGL_CAD: 1536.52, glAccount: '1310',
  },
  {
    id: 'h8', security: 'Microsoft Corp.', ticker: 'MSFT', broker: 'Fidelity Investments', acctLast4: '2267',
    currency: 'USD', units: 120, wacLocal: 379.78, costLocal: 45573.98, acqFxRate: 1.3770,
    costCAD: 62617.45, yeFxRate: 1.442, fmvLocal: 53400.00, fmvCAD: 77002.80,
    unrealizedGL_CAD: 14385.35, glAccount: '1310',
  },
  {
    id: 'h9', security: 'Unilever PLC', ticker: 'ULVR', broker: 'Fidelity Investments', acctLast4: '2267',
    currency: 'GBP', units: 150, wacLocal: 43.10, costLocal: 6464.98, acqFxRate: 1.7990,
    costCAD: 11629.64, yeFxRate: 1.812, fmvLocal: 7125.00, fmvCAD: 12910.50,
    unrealizedGL_CAD: 1280.86, glAccount: '1310',
  },
  {
    id: 'h10', security: 'Enbridge Inc.', ticker: 'ENB.TO', broker: 'BMO InvestorLine', acctLast4: '6690',
    currency: 'CAD', units: 400, wacLocal: 54.50, costLocal: 21800.00, acqFxRate: 1,
    costCAD: 21800.00, yeFxRate: 1, fmvLocal: 22800.00, fmvCAD: 22800.00,
    unrealizedGL_CAD: 1000.00, glAccount: '1310',
  },
];

// ─── Transaction Register ─────────────────────────────────────────────────────
export const transactions: InvTransaction[] = [
  // TD Waterhouse — SOURCE A
  { id: 't1',  source: 'A', broker: 'TD Waterhouse',       date: '2025-01-15', security: 'Apple Inc.',           ticker: 'AAPL',    txnType: 'Purchase', qty: 200,  price: 185.00, currency: 'USD', commission: 19.99, grossLocal: 37000.00,  netLocal: 37019.99,  fxRate: 1.4390, netCAD: 53273.77,  notes: 'New position' },
  { id: 't2',  source: 'A', broker: 'TD Waterhouse',       date: '2025-01-15', security: 'Royal Bank of Canada', ticker: 'RY.TO',   txnType: 'Purchase', qty: 300,  price: 132.50, currency: 'CAD', commission:  9.99, grossLocal: 39750.00,  netLocal: 39759.99,  fxRate: 1,      netCAD: 39759.99,  notes: 'New position' },
  { id: 't3',  source: 'A', broker: 'TD Waterhouse',       date: '2025-02-20', security: 'Apple Inc.',           ticker: 'AAPL',    txnType: 'Dividend', qty: 200,  price: 0.25,   currency: 'USD', commission:  0,    grossLocal:    50.00, netLocal:    50.00,  fxRate: 1.4420, netCAD:    72.10,  notes: 'Cash div: 200×$0.25' },
  { id: 't4',  source: 'A', broker: 'TD Waterhouse',       date: '2025-03-10', security: 'Apple Inc.',           ticker: 'AAPL',    txnType: 'Purchase', qty:  50,  price: 192.00, currency: 'USD', commission: 19.99, grossLocal:  9600.00, netLocal:  9619.99,  fxRate: 1.3995, netCAD: 13461.67,  notes: 'Add to position' },
  { id: 't5',  source: 'A', broker: 'TD Waterhouse',       date: '2025-04-05', security: 'Apple Inc.',           ticker: 'AAPL',    txnType: 'Sale',     qty:  50,  price: 210.00, currency: 'USD', commission: 19.99, grossLocal: 10500.00, netLocal: 10480.01,  fxRate: 1.3950, netCAD: 14619.61,  notes: 'Partial disposition' },
  { id: 't6',  source: 'A', broker: 'TD Waterhouse',       date: '2025-05-18', security: 'Amazon.com Inc.',      ticker: 'AMZN',    txnType: 'Purchase', qty:  30,  price: 185.40, currency: 'USD', commission: 19.99, grossLocal:  5562.00, netLocal:  5581.99,  fxRate: 1.3890, netCAD:  7753.24,  notes: 'New position' },
  { id: 't7',  source: 'A', broker: 'TD Waterhouse',       date: '2025-08-20', security: 'Royal Bank of Canada', ticker: 'RY.TO',   txnType: 'Sale',     qty: 100,  price: 145.00, currency: 'CAD', commission:  9.99, grossLocal: 14500.00, netLocal: 14490.01,  fxRate: 1,      netCAD: 14490.01,  notes: 'Partial disposition' },
  { id: 't8',  source: 'A', broker: 'TD Waterhouse',       date: '2025-09-15', security: 'Royal Bank of Canada', ticker: 'RY.TO',   txnType: 'Dividend', qty: 200,  price: 1.38,   currency: 'CAD', commission:  0,    grossLocal:   276.00, netLocal:   276.00,  fxRate: 1,      netCAD:   276.00,  notes: 'Q3 dividend' },
  { id: 't9',  source: 'A', broker: 'TD Waterhouse',       date: '2025-11-15', security: 'Apple Inc.',           ticker: 'AAPL',    txnType: 'Dividend', qty: 250,  price: 0.25,   currency: 'USD', commission:  0,    grossLocal:    62.50, netLocal:    62.50,  fxRate: 1.4200, netCAD:    88.75,  notes: 'Cash div: 250×$0.25' },
  // RBC Direct — SOURCE B
  { id: 't10', source: 'B', broker: 'RBC Direct Investing', date: '2025-01-20', security: 'Apple Inc.',           ticker: 'AAPL',    txnType: 'Purchase', qty:  50,  price: 205.20, currency: 'USD', commission:  9.99, grossLocal: 10260.00, netLocal: 10269.99,  fxRate: 1.3890, netCAD: 14265.01,  notes: 'New position — account 8834' },
  { id: 't11', source: 'B', broker: 'RBC Direct Investing', date: '2025-02-14', security: 'Shopify Inc.',         ticker: 'SHOP.TO', txnType: 'Purchase', qty: 200,  price: 120.00, currency: 'CAD', commission:  9.99, grossLocal: 24000.00, netLocal: 24009.99,  fxRate: 1,      netCAD: 24009.99,  notes: 'New position' },
  { id: 't12', source: 'B', broker: 'RBC Direct Investing', date: '2025-03-22', security: 'Airbus SE',            ticker: 'AIR.PA',  txnType: 'Purchase', qty:  75,  price: 146.93, currency: 'EUR', commission:  9.99, grossLocal: 11019.98, netLocal: 11029.97,  fxRate: 1.5038, netCAD: 16583.54,  notes: 'New position — EUR' },
  { id: 't13', source: 'B', broker: 'RBC Direct Investing', date: '2025-05-10', security: 'Apple Inc.',           ticker: 'AAPL',    txnType: 'Dividend', qty:  50,  price: 0.25,   currency: 'USD', commission:  0,    grossLocal:    12.50, netLocal:    12.50,  fxRate: 1.3890, netCAD:    17.36,  notes: 'Cash div: 50×$0.25' },
  { id: 't14', source: 'B', broker: 'RBC Direct Investing', date: '2025-06-30', security: 'Shopify Inc.',         ticker: 'SHOP.TO', txnType: 'Transfer Out', qty: 200, price: 95.02, currency: 'CAD', commission: 0, grossLocal: 19004.00, netLocal: 19004.00, fxRate: 1, netCAD: 19004.00, notes: 'Transfer out to BMO …6690', flag: true },
  { id: 't15', source: 'B', broker: 'RBC Direct Investing', date: '2025-08-01', security: 'Airbus SE',            ticker: 'AIR.PA',  txnType: 'Dividend', qty:  75,  price: 1.86,   currency: 'EUR', commission:  0,    grossLocal:   139.50, netLocal:   139.50,  fxRate: 1.5080, netCAD:   210.37,  notes: 'Annual dividend' },
  { id: 't16', source: 'B', broker: 'RBC Direct Investing', date: '2025-10-05', security: 'Airbus SE',            ticker: 'AIR.PA',  txnType: 'Sale',     qty:  20,  price: 160.00, currency: 'EUR', commission:  9.99, grossLocal:  3200.00, netLocal:  3190.01,  fxRate: 1.4895, netCAD:  4751.76,  notes: 'Partial disposition' },
  // Fidelity — SOURCE C
  { id: 't17', source: 'C', broker: 'Fidelity Investments', date: '2025-01-10', security: 'Microsoft Corp.',      ticker: 'MSFT',    txnType: 'Purchase', qty:  60,  price: 375.00, currency: 'USD', commission:  0,    grossLocal: 22500.00, netLocal: 22500.00,  fxRate: 1.3770, netCAD: 30982.50,  notes: 'New position' },
  { id: 't18', source: 'C', broker: 'Fidelity Investments', date: '2025-02-25', security: 'Microsoft Corp.',      ticker: 'MSFT',    txnType: 'Purchase', qty:  60,  price: 384.57, currency: 'USD', commission:  0,    grossLocal: 23073.98, netLocal: 23073.98,  fxRate: 1.3770, netCAD: 31772.87,  notes: 'Add to position' },
  { id: 't19', source: 'C', broker: 'Fidelity Investments', date: '2025-04-15', security: 'Unilever PLC',         ticker: 'ULVR',    txnType: 'Purchase', qty: 150,  price: 43.10,  currency: 'GBP', commission:  0,    grossLocal:  6464.98, netLocal:  6464.98,  fxRate: 1.7990, netCAD: 11629.64,  notes: 'New position — GBP' },
  { id: 't20', source: 'C', broker: 'Fidelity Investments', date: '2025-06-15', security: 'Microsoft Corp.',      ticker: 'MSFT',    txnType: 'Dividend', qty: 120,  price: 0.75,   currency: 'USD', commission:  0,    grossLocal:    90.00, netLocal:    90.00,  fxRate: 1.3920, netCAD:   125.28,  notes: 'Q2 dividend' },
  { id: 't21', source: 'C', broker: 'Fidelity Investments', date: '2025-07-20', security: 'Microsoft Corp.',      ticker: 'MSFT',    txnType: 'Sale',     qty:  20,  price: 420.00, currency: 'USD', commission:  0,    grossLocal:  8400.00, netLocal:  8400.00,  fxRate: 1.3810, netCAD: 11600.40,  notes: 'Partial disposition' },
  { id: 't22', source: 'C', broker: 'Fidelity Investments', date: '2025-09-20', security: 'Microsoft Corp.',      ticker: 'MSFT',    txnType: 'Dividend', qty: 120,  price: 0.75,   currency: 'USD', commission:  0,    grossLocal:    90.00, netLocal:    90.00,  fxRate: 1.4200, netCAD:   127.80,  notes: 'Q3 dividend' },
  { id: 't23', source: 'C', broker: 'Fidelity Investments', date: '2025-11-10', security: 'Unilever PLC',         ticker: 'ULVR',    txnType: 'Return of Capital', qty: 150, price: 0.29, currency: 'GBP', commission: 0, grossLocal: 43.75, netLocal: 43.75, fxRate: 1.8100, netCAD: 79.19, notes: 'ROC — not income', flag: true },
  // BMO — SOURCE D
  { id: 't24', source: 'D', broker: 'BMO InvestorLine',     date: '2025-01-25', security: 'Royal Bank of Canada', ticker: 'RY.TO',   txnType: 'Purchase', qty: 150,  price: 130.00, currency: 'CAD', commission:  9.99, grossLocal: 19500.00, netLocal: 19509.99,  fxRate: 1,      netCAD: 19509.99,  notes: 'New position' },
  { id: 't25', source: 'D', broker: 'BMO InvestorLine',     date: '2025-06-30', security: 'Shopify Inc.',         ticker: 'SHOP.TO', txnType: 'Transfer In', qty: 200, price: 95.02, currency: 'CAD', commission: 0, grossLocal: 19004.00, netLocal: 19004.00, fxRate: 1, netCAD: 19004.00, notes: 'Transfer in from RBC …8834 — verify cost', flag: true },
  { id: 't26', source: 'D', broker: 'BMO InvestorLine',     date: '2025-07-05', security: 'Shopify Inc.',         ticker: 'SHOP.TO', txnType: 'Sale',     qty:  50,  price: 132.00, currency: 'CAD', commission:  9.99, grossLocal:  6600.00, netLocal:  6590.01,  fxRate: 1,      netCAD:  6590.01,  notes: 'Partial sale after transfer' },
  { id: 't27', source: 'D', broker: 'BMO InvestorLine',     date: '2025-03-15', security: 'Enbridge Inc.',        ticker: 'ENB.TO',  txnType: 'Purchase', qty: 400,  price: 54.50,  currency: 'CAD', commission:  9.99, grossLocal: 21800.00, netLocal: 21809.99,  fxRate: 1,      netCAD: 21809.99,  notes: 'New position' },
  { id: 't28', source: 'D', broker: 'BMO InvestorLine',     date: '2025-06-01', security: 'Enbridge Inc.',        ticker: 'ENB.TO',  txnType: 'Dividend', qty: 400,  price: 0.915,  currency: 'CAD', commission:  0,    grossLocal:   366.00, netLocal:   366.00,  fxRate: 1,      netCAD:   366.00,  notes: 'Q2 dividend' },
  { id: 't29', source: 'D', broker: 'BMO InvestorLine',     date: '2025-09-01', security: 'Enbridge Inc.',        ticker: 'ENB.TO',  txnType: 'Dividend', qty: 400,  price: 0.915,  currency: 'CAD', commission:  0,    grossLocal:   366.00, netLocal:   366.00,  fxRate: 1,      netCAD:   366.00,  notes: 'Q3 dividend' },
  { id: 't30', source: 'D', broker: 'BMO InvestorLine',     date: '2025-12-01', security: 'Enbridge Inc.',        ticker: 'ENB.TO',  txnType: 'Dividend', qty: 400,  price: 0.915,  currency: 'CAD', commission:  0,    grossLocal:   366.00, netLocal:   366.00,  fxRate: 1,      netCAD:   366.00,  notes: 'Q4 div — see AE-03 (accrual)' },
];

// ─── WAC Schedule ─────────────────────────────────────────────────────────────
export const wacGroups: WACGroup[] = [
  {
    id: 'wac1', security: 'Apple Inc.', ticker: 'AAPL', broker: 'TD Waterhouse', acctLast4: '4521', currency: 'USD',
    totalRealizedGL: 1708.89,
    rows: [
      { id: 'w1a', date: '2025-01-15', txnType: 'Purchase',       unitsIn: 200, unitsOut:  0, priceLocal: 185.00, costIn: 37000.00, costOut:     0, cumulUnits: 200, cumulCost: 37000.00, wacPerUnit: 185.00, realizedGL: 0,       notes: 'New position' },
      { id: 'w1b', date: '2025-03-10', txnType: 'Purchase',       unitsIn:  50, unitsOut:  0, priceLocal: 192.00, costIn:  9600.00, costOut:     0, cumulUnits: 250, cumulCost: 46600.00, wacPerUnit: 186.40, realizedGL: 0 },
      { id: 'w1c', date: '2025-04-05', txnType: 'Sale',           unitsIn:   0, unitsOut: 50, priceLocal: 210.00, costIn:      0,   costOut: 9320.00, cumulUnits: 200, cumulCost: 37280.00, wacPerUnit: 186.40, realizedGL: 1680.01, notes: 'Gain: (210−186.40)×50' },
      { id: 'w1d', date: '2025-12-31', txnType: 'Closing',        unitsIn:   0, unitsOut:  0, priceLocal: 240.00, costIn:      0,   costOut:     0,   cumulUnits: 200, cumulCost: 37280.00, wacPerUnit: 186.40, realizedGL: 0,       notes: 'Dec 31' },
    ],
  },
  {
    id: 'wac2', security: 'Apple Inc.', ticker: 'AAPL', broker: 'RBC Direct Investing', acctLast4: '8834', currency: 'USD',
    totalRealizedGL: 0,
    rows: [
      { id: 'w2a', date: '2025-01-20', txnType: 'Purchase',       unitsIn:  50, unitsOut:  0, priceLocal: 205.20, costIn: 10260.00, costOut: 0, cumulUnits: 50, cumulCost: 10260.00, wacPerUnit: 205.20, realizedGL: 0 },
      { id: 'w2b', date: '2025-12-31', txnType: 'Closing',        unitsIn:   0, unitsOut:  0, priceLocal: 240.00, costIn:     0,    costOut: 0, cumulUnits: 50, cumulCost: 10260.00, wacPerUnit: 205.20, realizedGL: 0, notes: 'Dec 31' },
    ],
  },
  {
    id: 'wac3', security: 'Royal Bank of Canada', ticker: 'RY.TO', broker: 'TD Waterhouse', acctLast4: '4521', currency: 'CAD',
    totalRealizedGL: 1254.25,
    rows: [
      { id: 'w3a', date: '2025-01-15', txnType: 'Purchase',       unitsIn: 300, unitsOut:   0, priceLocal: 132.50, costIn: 39750.00, costOut:     0, cumulUnits: 300, cumulCost: 39750.00, wacPerUnit: 132.50, realizedGL: 0 },
      { id: 'w3b', date: '2025-08-20', txnType: 'Sale',           unitsIn:   0, unitsOut: 100, priceLocal: 145.00, costIn:     0,    costOut: 13250.00, cumulUnits: 200, cumulCost: 26500.00, wacPerUnit: 132.50, realizedGL: 1250.01, notes: 'Gain: (145−132.50)×100' },
      { id: 'w3c', date: '2025-12-31', txnType: 'Closing',        unitsIn:   0, unitsOut:   0, priceLocal: 145.00, costIn:     0,    costOut:     0,   cumulUnits: 200, cumulCost: 26500.00, wacPerUnit: 132.50, realizedGL: 0,       notes: 'Dec 31' },
    ],
  },
  {
    id: 'wac4', security: 'Royal Bank of Canada', ticker: 'RY.TO', broker: 'BMO InvestorLine', acctLast4: '6690', currency: 'CAD',
    totalRealizedGL: 0,
    rows: [
      { id: 'w4a', date: '2025-01-25', txnType: 'Purchase',       unitsIn: 150, unitsOut: 0, priceLocal: 130.00, costIn: 19500.00, costOut: 0, cumulUnits: 150, cumulCost: 19500.00, wacPerUnit: 130.00, realizedGL: 0 },
      { id: 'w4b', date: '2025-12-31', txnType: 'Closing',        unitsIn:   0, unitsOut: 0, priceLocal: 145.00, costIn:     0,    costOut: 0, cumulUnits: 150, cumulCost: 19500.00, wacPerUnit: 130.00, realizedGL: 0, notes: 'Dec 31' },
    ],
  },
  {
    id: 'wac5', security: 'Amazon.com Inc.', ticker: 'AMZN', broker: 'TD Waterhouse', acctLast4: '4521', currency: 'USD',
    totalRealizedGL: 0,
    rows: [
      { id: 'w5a', date: '2025-05-18', txnType: 'Purchase',       unitsIn:  30, unitsOut: 0, priceLocal: 185.40, costIn: 5562.00, costOut: 0, cumulUnits: 30, cumulCost: 5562.00, wacPerUnit: 185.40, realizedGL: 0 },
      { id: 'w5b', date: '2025-12-31', txnType: 'Closing',        unitsIn:   0, unitsOut: 0, priceLocal: 215.00, costIn:     0,   costOut: 0, cumulUnits: 30, cumulCost: 5562.00, wacPerUnit: 185.40, realizedGL: 0, notes: 'Dec 31' },
    ],
  },
  {
    id: 'wac6', security: 'Shopify Inc.', ticker: 'SHOP.TO', broker: 'BMO InvestorLine', acctLast4: '6690', currency: 'CAD',
    totalRealizedGL: 1833.87,
    rows: [
      { id: 'w6a', date: '2025-06-30', txnType: 'Transfer In',    unitsIn: 200, unitsOut:   0, priceLocal:  95.02, costIn: 19004.00, costOut:     0, cumulUnits: 200, cumulCost: 19004.00, wacPerUnit:  95.02, realizedGL: 0, notes: 'Cost basis from RBC' },
      { id: 'w6b', date: '2025-07-05', txnType: 'Sale',           unitsIn:   0, unitsOut:  50, priceLocal: 132.00, costIn:     0,    costOut:  4751.00, cumulUnits: 150, cumulCost: 14253.00, wacPerUnit:  95.02, realizedGL: 1849.01, notes: 'Gain: (132−95.02)×50' },
      { id: 'w6c', date: '2025-12-31', txnType: 'Closing',        unitsIn:   0, unitsOut:   0, priceLocal: 150.00, costIn:     0,    costOut:     0,   cumulUnits: 150, cumulCost: 14253.00, wacPerUnit:  95.02, realizedGL: 0, notes: 'Dec 31' },
    ],
  },
  {
    id: 'wac7', security: 'Airbus SE', ticker: 'AIR.PA', broker: 'RBC Direct Investing', acctLast4: '8834', currency: 'EUR',
    totalRealizedGL: 208.53,
    rows: [
      { id: 'w7a', date: '2025-03-22', txnType: 'Purchase',       unitsIn:  75, unitsOut:   0, priceLocal: 146.93, costIn: 11019.98, costOut:     0, cumulUnits:  75, cumulCost: 11019.98, wacPerUnit: 146.93, realizedGL: 0 },
      { id: 'w7b', date: '2025-10-05', txnType: 'Sale',           unitsIn:   0, unitsOut:  20, priceLocal: 160.00, costIn:     0,    costOut:  2938.60, cumulUnits:  55, cumulCost:  8081.38, wacPerUnit: 146.93, realizedGL:  261.40, notes: 'Gain: (160−146.93)×20' },
      { id: 'w7c', date: '2025-12-31', txnType: 'Closing',        unitsIn:   0, unitsOut:   0, priceLocal: 155.00, costIn:     0,    costOut:     0,   cumulUnits:  55, cumulCost:  8081.38, wacPerUnit: 146.93, realizedGL: 0, notes: 'Dec 31' },
    ],
  },
  {
    id: 'wac8', security: 'Microsoft Corp.', ticker: 'MSFT', broker: 'Fidelity Investments', acctLast4: '2267', currency: 'USD',
    totalRealizedGL: 4481.49,
    rows: [
      { id: 'w8a', date: '2025-01-10', txnType: 'Purchase',       unitsIn:  60, unitsOut:   0, priceLocal: 375.00, costIn: 22500.00, costOut:     0, cumulUnits:  60, cumulCost: 22500.00, wacPerUnit: 375.00, realizedGL: 0 },
      { id: 'w8b', date: '2025-02-25', txnType: 'Purchase',       unitsIn:  60, unitsOut:   0, priceLocal: 384.57, costIn: 23073.98, costOut:     0, cumulUnits: 120, cumulCost: 45573.98, wacPerUnit: 379.78, realizedGL: 0 },
      { id: 'w8c', date: '2025-07-20', txnType: 'Sale',           unitsIn:   0, unitsOut:  20, priceLocal: 420.00, costIn:     0,    costOut:  7595.72, cumulUnits: 100, cumulCost: 37978.27, wacPerUnit: 379.78, realizedGL:  804.28, notes: 'Gain: (420−379.78)×20' },
      { id: 'w8d', date: '2025-12-31', txnType: 'Closing',        unitsIn:   0, unitsOut:   0, priceLocal: 445.00, costIn:     0,    costOut:     0,   cumulUnits: 100, cumulCost: 37978.27, wacPerUnit: 379.78, realizedGL: 0, notes: 'Dec 31' },
    ],
  },
  {
    id: 'wac9', security: 'Unilever PLC', ticker: 'ULVR', broker: 'Fidelity Investments', acctLast4: '2267', currency: 'GBP',
    totalRealizedGL: 0,
    rows: [
      { id: 'w9a', date: '2025-04-15', txnType: 'Purchase',       unitsIn: 150, unitsOut: 0, priceLocal: 43.10, costIn: 6464.98, costOut: 0, cumulUnits: 150, cumulCost: 6464.98, wacPerUnit: 43.10, realizedGL: 0 },
      { id: 'w9b', date: '2025-12-31', txnType: 'Closing',        unitsIn:   0, unitsOut: 0, priceLocal: 47.50, costIn:     0,   costOut: 0, cumulUnits: 150, cumulCost: 6464.98, wacPerUnit: 43.10, realizedGL: 0, notes: 'Dec 31' },
    ],
  },
  {
    id: 'wac10', security: 'Enbridge Inc.', ticker: 'ENB.TO', broker: 'BMO InvestorLine', acctLast4: '6690', currency: 'CAD',
    totalRealizedGL: 0,
    rows: [
      { id: 'w10a', date: '2025-03-15', txnType: 'Purchase',      unitsIn: 400, unitsOut: 0, priceLocal: 54.50, costIn: 21800.00, costOut: 0, cumulUnits: 400, cumulCost: 21800.00, wacPerUnit: 54.50, realizedGL: 0 },
      { id: 'w10b', date: '2025-12-31', txnType: 'Closing',       unitsIn:   0, unitsOut: 0, priceLocal: 57.00, costIn:     0,    costOut: 0, cumulUnits: 400, cumulCost: 21800.00, wacPerUnit: 54.50, realizedGL: 0, notes: 'Dec 31' },
    ],
  },
];

// ─── Realized Gain/Loss ───────────────────────────────────────────────────────
export const realizedRows: RealizedRow[] = [
  { id: 'r1', security: 'Apple Inc.',           ticker: 'AAPL',    broker: 'TD Waterhouse',       date: '2025-04-05', unitsSold:  50, proceedsLocal: 10480.01, wacCostLocal: 9320.00,  realizedGL_Local: 1160.01, currency: 'USD', fxRate: 1.3950, realizedGL_CAD: 1618.21, type: 'Capital Gain', notes: 'Partial disposition — 50/250 units' },
  { id: 'r2', security: 'Royal Bank of Canada', ticker: 'RY.TO',   broker: 'TD Waterhouse',       date: '2025-08-20', unitsSold: 100, proceedsLocal: 14490.01, wacCostLocal: 13250.00, realizedGL_Local: 1240.01, currency: 'CAD', fxRate: 1,      realizedGL_CAD: 1240.01, type: 'Capital Gain' },
  { id: 'r3', security: 'Shopify Inc.',         ticker: 'SHOP.TO', broker: 'BMO InvestorLine',    date: '2025-07-05', unitsSold:  50, proceedsLocal:  6590.01, wacCostLocal:  4751.00, realizedGL_Local: 1839.01, currency: 'CAD', fxRate: 1,      realizedGL_CAD: 1839.01, type: 'Capital Gain', notes: 'Post-transfer partial sale' },
  { id: 'r4', security: 'Airbus SE',            ticker: 'AIR.PA',  broker: 'RBC Direct Investing', date: '2025-10-05', unitsSold:  20, proceedsLocal:  3190.01, wacCostLocal:  2938.60, realizedGL_Local:  251.41, currency: 'EUR', fxRate: 1.4895, realizedGL_CAD:  374.47, type: 'Capital Gain' },
  { id: 'r5', security: 'Microsoft Corp.',      ticker: 'MSFT',    broker: 'Fidelity Investments', date: '2025-07-20', unitsSold:  20, proceedsLocal:  8400.00, wacCostLocal:  7595.72, realizedGL_Local:  804.28, currency: 'USD', fxRate: 1.3810, realizedGL_CAD: 1110.71, type: 'Capital Gain' },
];

// ─── Dividend Income ──────────────────────────────────────────────────────────
export const dividendRows: DividendRow[] = [
  { id: 'd1', security: 'Apple Inc.',           ticker: 'AAPL',    broker: 'TD Waterhouse',        currency: 'USD', totalDivLocal:  112.50, avgFxRate: 1.4310, totalDivCAD:  160.99, notes: 'Q1 + Q4 dividends' },
  { id: 'd2', security: 'Apple Inc.',           ticker: 'AAPL',    broker: 'RBC Direct Investing', currency: 'USD', totalDivLocal:   12.50, avgFxRate: 1.3890, totalDivCAD:   17.36 },
  { id: 'd3', security: 'Royal Bank of Canada', ticker: 'RY.TO',   broker: 'TD Waterhouse',        currency: 'CAD', totalDivLocal:  276.00, avgFxRate: 1,      totalDivCAD:  276.00 },
  { id: 'd4', security: 'Airbus SE',            ticker: 'AIR.PA',  broker: 'RBC Direct Investing', currency: 'EUR', totalDivLocal:  139.50, avgFxRate: 1.5080, totalDivCAD:  210.37 },
  { id: 'd5', security: 'Microsoft Corp.',      ticker: 'MSFT',    broker: 'Fidelity Investments', currency: 'USD', totalDivLocal:  180.00, avgFxRate: 1.4060, totalDivCAD:  253.08, notes: 'Q2 + Q3 dividends' },
  { id: 'd6', security: 'Enbridge Inc.',        ticker: 'ENB.TO',  broker: 'BMO InvestorLine',     currency: 'CAD', totalDivLocal: 1098.00, avgFxRate: 1,      totalDivCAD: 1098.00, notes: 'Q2 + Q3 + Q4 dividends' },
  { id: 'd7', security: 'Unilever PLC',         ticker: 'ULVR',    broker: 'Fidelity Investments', currency: 'GBP', totalDivLocal:   43.75, avgFxRate: 1.8100, totalDivCAD:   79.19, notes: 'ROC — reclassified per AE-01' },
];

// ─── Unrealized G/L (Disclosure only — ASPE cost method) ─────────────────────
export const unrealizedRows: UnrealizedRow[] = [
  { id: 'u1', security: 'Apple Inc.',           ticker: 'AAPL',    broker: 'TD Waterhouse',        currency: 'USD', yeUnits: 250, bookValueLocal: 47284.98, yeFmvLocal: 60000.00, unrealizedGL_Local: 12715.02, yeFxRate: 1.442, unrealizedGL_CAD: 19417.32 },
  { id: 'u2', security: 'Apple Inc.',           ticker: 'AAPL',    broker: 'RBC Direct Investing', currency: 'USD', yeUnits:  50, bookValueLocal: 10260.00, yeFmvLocal: 12000.00, unrealizedGL_Local:  1740.00, yeFxRate: 1.442, unrealizedGL_CAD:  3052.87 },
  { id: 'u3', security: 'Royal Bank of Canada', ticker: 'RY.TO',   broker: 'TD Waterhouse',        currency: 'CAD', yeUnits: 200, bookValueLocal: 26500.00, yeFmvLocal: 29000.00, unrealizedGL_Local:  2500.00, yeFxRate: 1,     unrealizedGL_CAD:  2500.00 },
  { id: 'u4', security: 'Royal Bank of Canada', ticker: 'RY.TO',   broker: 'BMO InvestorLine',     currency: 'CAD', yeUnits: 150, bookValueLocal: 19500.00, yeFmvLocal: 21750.00, unrealizedGL_Local:  2250.00, yeFxRate: 1,     unrealizedGL_CAD:  2250.00 },
  { id: 'u5', security: 'Amazon.com Inc.',      ticker: 'AMZN',    broker: 'TD Waterhouse',        currency: 'USD', yeUnits:  30, bookValueLocal:  5562.00, yeFmvLocal:  6450.00, unrealizedGL_Local:   888.00, yeFxRate: 1.442, unrealizedGL_CAD:  1297.40 },
  { id: 'u6', security: 'Shopify Inc.',         ticker: 'SHOP.TO', broker: 'BMO InvestorLine',     currency: 'CAD', yeUnits: 150, bookValueLocal: 14253.00, yeFmvLocal: 22500.00, unrealizedGL_Local:  8247.00, yeFxRate: 1,     unrealizedGL_CAD:  8247.00 },
  { id: 'u7', security: 'Airbus SE',            ticker: 'AIR.PA',  broker: 'RBC Direct Investing', currency: 'EUR', yeUnits:  75, bookValueLocal: 11019.98, yeFmvLocal: 11625.00, unrealizedGL_Local:   605.02, yeFxRate: 1.558, unrealizedGL_CAD:  1536.52 },
  { id: 'u8', security: 'Microsoft Corp.',      ticker: 'MSFT',    broker: 'Fidelity Investments', currency: 'USD', yeUnits: 120, bookValueLocal: 45573.98, yeFmvLocal: 53400.00, unrealizedGL_Local:  7826.02, yeFxRate: 1.442, unrealizedGL_CAD: 14385.35 },
  { id: 'u9', security: 'Unilever PLC',         ticker: 'ULVR',    broker: 'Fidelity Investments', currency: 'GBP', yeUnits: 150, bookValueLocal:  6464.98, yeFmvLocal:  7125.00, unrealizedGL_Local:   660.02, yeFxRate: 1.812, unrealizedGL_CAD:  1280.86 },
  { id: 'u10', security: 'Enbridge Inc.',       ticker: 'ENB.TO',  broker: 'BMO InvestorLine',     currency: 'CAD', yeUnits: 400, bookValueLocal: 21800.00, yeFmvLocal: 22800.00, unrealizedGL_Local:  1000.00, yeFxRate: 1,     unrealizedGL_CAD:  1000.00 },
];

// ─── FX Rates ─────────────────────────────────────────────────────────────────
export const fxRates: FXRateRow[] = [
  { date: '2025-01-08', usdCad: 1.438,  eurCad: 1.498,  gbpCad: 1.815,  notes: 'First transaction' },
  { date: '2025-01-15', usdCad: 1.4390, eurCad: 1.5010, gbpCad: 1.817 },
  { date: '2025-01-20', usdCad: 1.3890, eurCad: 1.4950, gbpCad: 1.812 },
  { date: '2025-01-25', usdCad: 1.3850, eurCad: 1.4920, gbpCad: 1.810 },
  { date: '2025-02-14', usdCad: 1.3900, eurCad: 1.4980, gbpCad: 1.816 },
  { date: '2025-02-20', usdCad: 1.4420, eurCad: 1.5080, gbpCad: 1.820 },
  { date: '2025-02-25', usdCad: 1.3770, eurCad: 1.4900, gbpCad: 1.808 },
  { date: '2025-03-10', usdCad: 1.3995, eurCad: 1.4970, gbpCad: 1.814 },
  { date: '2025-03-15', usdCad: 1.3980, eurCad: 1.4955, gbpCad: 1.813 },
  { date: '2025-03-22', usdCad: 1.5038, eurCad: 1.5038, gbpCad: 1.815 },
  { date: '2025-04-05', usdCad: 1.3950, eurCad: 1.4895, gbpCad: 1.805 },
  { date: '2025-04-15', usdCad: 1.3810, eurCad: 1.4880, gbpCad: 1.7990, notes: 'ULVR purchase' },
  { date: '2025-05-10', usdCad: 1.3890, eurCad: 1.4920, gbpCad: 1.808 },
  { date: '2025-05-18', usdCad: 1.3890, eurCad: 1.4910, gbpCad: 1.806 },
  { date: '2025-06-01', usdCad: 1.3920, eurCad: 1.4950, gbpCad: 1.809 },
  { date: '2025-06-15', usdCad: 1.3920, eurCad: 1.4940, gbpCad: 1.810 },
  { date: '2025-06-30', usdCad: 1.3960, eurCad: 1.4970, gbpCad: 1.811 },
  { date: '2025-07-05', usdCad: 1.3950, eurCad: 1.4960, gbpCad: 1.812 },
  { date: '2025-07-20', usdCad: 1.3810, eurCad: 1.4900, gbpCad: 1.808 },
  { date: '2025-08-01', usdCad: 1.4060, eurCad: 1.5080, gbpCad: 1.820 },
  { date: '2025-08-20', usdCad: 1.4000, eurCad: 1.5020, gbpCad: 1.816 },
  { date: '2025-09-01', usdCad: 1.4050, eurCad: 1.5060, gbpCad: 1.818 },
  { date: '2025-09-15', usdCad: 1.4020, eurCad: 1.5040, gbpCad: 1.815 },
  { date: '2025-09-20', usdCad: 1.4200, eurCad: 1.5150, gbpCad: 1.825 },
  { date: '2025-10-05', usdCad: 1.4895, eurCad: 1.4895, gbpCad: 1.805 },
  { date: '2025-11-10', usdCad: 1.4100, eurCad: 1.5200, gbpCad: 1.8100 },
  { date: '2025-11-15', usdCad: 1.4200, eurCad: 1.5200, gbpCad: 1.810 },
  { date: '2025-12-01', usdCad: 1.4150, eurCad: 1.5250, gbpCad: 1.812 },
  { date: '2025-12-31', usdCad: 1.4420, eurCad: 1.5580, gbpCad: 1.8120, notes: '▶ Year-end closing rate' },
];

// ─── FX Schedule ──────────────────────────────────────────────────────────────
export const fxSchedule: FXScheduleRow[] = [
  { id: 'fx1', security: 'Apple Inc.',      ticker: 'AAPL',    broker: 'TD Waterhouse',        acctLast4: '4521', currency: 'USD', yeUnits: 250, foreignCost: 47284.98, acqRate: 1.4197, cadCost: 67102.68, yeFxRate: 1.442, fmvForeign: 60000.00,  fmvCAD:  86520.00, unrealizedGL_CAD: 19417.32 },
  { id: 'fx2', security: 'Apple Inc.',      ticker: 'AAPL',    broker: 'RBC Direct Investing', acctLast4: '8834', currency: 'USD', yeUnits:  50, foreignCost: 10260.00, acqRate: 1.3890, cadCost: 14251.14, yeFxRate: 1.442, fmvForeign: 12000.00,  fmvCAD:  17304.00, unrealizedGL_CAD:  3052.87 },
  { id: 'fx3', security: 'Amazon.com Inc.', ticker: 'AMZN',    broker: 'TD Waterhouse',        acctLast4: '4521', currency: 'USD', yeUnits:  30, foreignCost:  5562.00, acqRate: 1.4390, cadCost:  8003.50, yeFxRate: 1.442, fmvForeign:  6450.00,  fmvCAD:   9300.90, unrealizedGL_CAD:  1297.40 },
  { id: 'fx4', security: 'Airbus SE',       ticker: 'AIR.PA',  broker: 'RBC Direct Investing', acctLast4: '8834', currency: 'EUR', yeUnits:  75, foreignCost: 11019.98, acqRate: 1.5038, cadCost: 16575.23, yeFxRate: 1.558, fmvForeign: 11625.00,  fmvCAD:  18111.75, unrealizedGL_CAD:  1536.52 },
  { id: 'fx5', security: 'Microsoft Corp.', ticker: 'MSFT',    broker: 'Fidelity Investments', acctLast4: '2267', currency: 'USD', yeUnits: 120, foreignCost: 45573.98, acqRate: 1.3770, cadCost: 62617.45, yeFxRate: 1.442, fmvForeign: 53400.00,  fmvCAD:  77002.80, unrealizedGL_CAD: 14385.35 },
  { id: 'fx6', security: 'Unilever PLC',    ticker: 'ULVR',    broker: 'Fidelity Investments', acctLast4: '2267', currency: 'GBP', yeUnits: 150, foreignCost:  6464.98, acqRate: 1.7990, cadCost: 11629.64, yeFxRate: 1.812, fmvForeign:  7125.00,  fmvCAD:  12910.50, unrealizedGL_CAD:  1280.86 },
];

// ─── AJEs ─────────────────────────────────────────────────────────────────────
export const invAJEs: InvAJE[] = [
  {
    id: 'aje1', entryNo: 'AE-01', status: 'Draft', confidence: 'Low', type: 'Correcting',
    description: 'Reclassify ULVR Return of Capital from dividend income',
    rationale: 'ULVR payment of £43.75 was reported as dividend on T5 slip but constitutes a return of capital per prospectus. Must reduce ACB, not income.',
    notes: 'Awaiting confirmation from Fidelity on slip classification',
    lines: [
      { account: 'Dividend Income',          glCode: '4200', dr:    0,    cr: 88.90 },
      { account: 'Investment — ULVR (Cost)', glCode: '1310', dr: 88.90, cr:    0 },
    ],
  },
  {
    id: 'aje2', entryNo: 'AE-02', status: 'Approved', confidence: 'Medium', type: 'Reclassification',
    description: 'Record SHOP.TO transfer-in cost basis at BMO',
    rationale: 'Transfer of 200 units from RBC to BMO. Broker shows $0 cost at BMO — must record cost carried over from RBC at $19,004 (WAC-based).',
    lines: [
      { account: 'Investment — SHOP.TO (Cost)', glCode: '1310', dr: 19004.00, cr:       0 },
      { account: 'Investment — SHOP.TO (RBC)',  glCode: '1310', dr:       0,  cr: 19004.00 },
    ],
  },
  {
    id: 'aje3', entryNo: 'AE-03', status: 'Draft', confidence: 'High', type: 'Accrual',
    description: 'Accrue Q4 Enbridge dividend receivable',
    rationale: 'ENB declared Q4 dividend ($0.915/unit × 400 units = $366) with record date Dec 15, 2025. Paid Jan 2026 — must accrue as at Dec 31, 2025.',
    lines: [
      { account: 'Dividend Receivable',  glCode: '1150', dr: 366.00, cr:     0 },
      { account: 'Dividend Income',      glCode: '4200', dr:     0,  cr: 366.00 },
    ],
  },
  {
    id: 'aje4', entryNo: 'AE-04', status: 'Approved', confidence: 'High', type: 'Disposition',
    description: 'Record realized gain on AAPL partial sale (TD — Apr 5)',
    rationale: '50 units sold @ $210 USD. WAC cost $186.40/unit. Realized G/L = (210−186.40)×50 = $1,180 USD × 1.395 = $1,646.10 CAD (net of commission).',
    lines: [
      { account: 'Cash / Settlement',              glCode: '1010', dr: 14619.61, cr:        0 },
      { account: 'Investment — AAPL (Cost)',        glCode: '1310', dr:        0, cr: 13001.40 },
      { account: 'Realized Gain on Investments',   glCode: '4100', dr:        0, cr:  1618.21 },
    ],
  },
  {
    id: 'aje5', entryNo: 'AE-05', status: 'Approved', confidence: 'High', type: 'Disposition',
    description: 'Record realized gain on MSFT partial sale (Fidelity — Jul 20)',
    rationale: '20 units sold @ $420 USD. WAC $379.78/unit. Realized G/L = $804.28 USD × 1.381 = $1,110.71 CAD.',
    lines: [
      { account: 'Cash / Settlement',             glCode: '1010', dr: 11600.40, cr:       0 },
      { account: 'Investment — MSFT (Cost)',       glCode: '1310', dr:       0,  cr: 10489.69 },
      { account: 'Realized Gain on Investments',  glCode: '4100', dr:       0,  cr:  1110.71 },
    ],
  },
  {
    id: 'aje6', entryNo: 'AE-06', status: 'Draft', confidence: 'Medium', type: 'Reclassification',
    description: 'Reclassify investment broker commissions',
    rationale: 'Commissions totalling ~$378 were netted in investment cost — for disclosure purposes reclassify as investment transaction costs per ASPE 3856.',
    lines: [
      { account: 'Investment Transaction Costs', glCode: '5500', dr: 378.00, cr:     0 },
      { account: 'Investment (Cost)',            glCode: '1310', dr:     0,  cr: 378.00 },
    ],
  },
  {
    id: 'aje7', entryNo: 'AE-07', status: 'Draft', confidence: 'Low', type: 'Accrual',
    description: 'Accrue AIR.PA EUR dividend (Q4 2025)',
    rationale: 'Airbus declared Q4 dividend €1.86/unit × 75 units = €139.50. Record date Dec 20, 2025. Paid Jan 2026. Convert at Dec 31 rate: €139.50 × 1.558 = CAD $217.34.',
    notes: 'Low confidence — awaiting Airbus Q4 dividend confirmation',
    lines: [
      { account: 'Dividend Receivable', glCode: '1150', dr: 217.34, cr:     0 },
      { account: 'Dividend Income',     glCode: '4200', dr:     0,  cr: 217.34 },
    ],
  },
];

// ─── GL Summary ───────────────────────────────────────────────────────────────
export const glSummaryRows: GLSummaryRow[] = [
  { id: 'gl1',  security: 'Apple Inc. (AAPL)',           broker: 'TD Waterhouse',        acctLast4: '4521', currency: 'USD', openingCAD: 0, purchasesCAD:  66735.44, disposalsAtCostCAD:  13001.40, realizedGL_CAD:  1618.21, dividendsCAD:  249.74, rocCAD: 0,      fxAdjCAD: 0, closingCAD:  53734.04 },
  { id: 'gl2',  security: 'Apple Inc. (AAPL)',           broker: 'RBC Direct Investing', acctLast4: '8834', currency: 'USD', openingCAD: 0, purchasesCAD:  14265.01, disposalsAtCostCAD:      0,     realizedGL_CAD:       0,  dividendsCAD:   17.36, rocCAD: 0,      fxAdjCAD: 0, closingCAD:  14265.01 },
  { id: 'gl3',  security: 'Royal Bank of Canada (RY.TO)',broker: 'TD Waterhouse',        acctLast4: '4521', currency: 'CAD', openingCAD: 0, purchasesCAD:  39759.99, disposalsAtCostCAD:  13250.00, realizedGL_CAD:  1240.01, dividendsCAD:  276.00, rocCAD: 0,      fxAdjCAD: 0, closingCAD:  26509.99 },
  { id: 'gl4',  security: 'Royal Bank of Canada (RY.TO)',broker: 'BMO InvestorLine',     acctLast4: '6690', currency: 'CAD', openingCAD: 0, purchasesCAD:  19509.99, disposalsAtCostCAD:      0,     realizedGL_CAD:       0,  dividendsCAD:    0,    rocCAD: 0,      fxAdjCAD: 0, closingCAD:  19509.99 },
  { id: 'gl5',  security: 'Amazon.com Inc. (AMZN)',      broker: 'TD Waterhouse',        acctLast4: '4521', currency: 'USD', openingCAD: 0, purchasesCAD:   7753.24, disposalsAtCostCAD:      0,     realizedGL_CAD:       0,  dividendsCAD:    0,    rocCAD: 0,      fxAdjCAD: 0, closingCAD:   7753.24 },
  { id: 'gl6',  security: 'Shopify Inc. (SHOP.TO)',      broker: 'BMO InvestorLine',     acctLast4: '6690', currency: 'CAD', openingCAD: 0, purchasesCAD:  19004.00, disposalsAtCostCAD:   4751.00, realizedGL_CAD:  1839.01, dividendsCAD:    0,    rocCAD: 0,      fxAdjCAD: 0, closingCAD:  14253.00 },
  { id: 'gl7',  security: 'Airbus SE (AIR.PA)',          broker: 'RBC Direct Investing', acctLast4: '8834', currency: 'EUR', openingCAD: 0, purchasesCAD:  16583.54, disposalsAtCostCAD:   4374.10, realizedGL_CAD:   374.47, dividendsCAD:  210.37, rocCAD: 0,      fxAdjCAD: 0, closingCAD:  12209.44 },
  { id: 'gl8',  security: 'Microsoft Corp. (MSFT)',      broker: 'Fidelity Investments', acctLast4: '2267', currency: 'USD', openingCAD: 0, purchasesCAD:  62755.37, disposalsAtCostCAD:  10489.69, realizedGL_CAD:  1110.71, dividendsCAD:  253.08, rocCAD: 0,      fxAdjCAD: 0, closingCAD:  52265.68 },
  { id: 'gl9',  security: 'Unilever PLC (ULVR)',         broker: 'Fidelity Investments', acctLast4: '2267', currency: 'GBP', openingCAD: 0, purchasesCAD:  11629.64, disposalsAtCostCAD:      0,     realizedGL_CAD:       0,  dividendsCAD:    0,    rocCAD: -88.90, fxAdjCAD: 0, closingCAD:  11629.64 },
  { id: 'gl10', security: 'Enbridge Inc. (ENB.TO)',      broker: 'BMO InvestorLine',     acctLast4: '6690', currency: 'CAD', openingCAD: 0, purchasesCAD:  21809.99, disposalsAtCostCAD:      0,     realizedGL_CAD:       0,  dividendsCAD: 1098.00, rocCAD: 0,      fxAdjCAD: 0, closingCAD:  21809.99 },
];

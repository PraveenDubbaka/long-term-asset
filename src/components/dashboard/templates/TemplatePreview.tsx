import { useState, useCallback, useRef, useEffect } from "react";
import CopyToMyTemplatesModal from "./CopyToMyTemplatesModal";
import TemplateEditableWrapper from "./TemplateEditableWrapper";
import { Plus, ChevronLeft, ChevronRight, ChevronDown, Eye, EyeOff, GripVertical, Pencil, Check, X, Copy, Trash2, ArrowLeft, Save, SlidersHorizontal, FileText, AlignLeft, Info, Upload, BadgeCheck, History, RotateCcw, User, Columns3, Settings2, Users, LayoutGrid, ListChecks, Table2, Minus } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { useLayoutSettings } from "@/components/dashboard/workspace/LayoutSettingsContext";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LayoutSettingsProvider } from "@/components/dashboard/workspace/LayoutSettingsContext";
import { validatePartnersCapital, partnersCapitalLimits } from "./partnersCapitalValidation";
import { exportPartnersCapitalSettingsPdf } from "./exportPartnersCapitalSettingsPdf";
import CoverPagePreview from "@/components/dashboard/workspace/CoverPagePreview";

import TemplateTableOfContentsPreview from "@/components/dashboard/templates/TemplateTableOfContentsPreview";
import CompilationReportPreview from "@/components/dashboard/workspace/CompilationReportPreview";
import TemplateBalanceSheetPreview from "@/components/dashboard/templates/TemplateBalanceSheetPreview";
import TemplateRetainedEarningsPreview from "@/components/dashboard/templates/TemplateRetainedEarningsPreview";
import TemplateCCorpBalanceSheetPreview from "@/components/dashboard/templates/TemplateCCorpBalanceSheetPreview";
import TemplateCCorpIncomePreview from "@/components/dashboard/templates/TemplateCCorpIncomePreview";
import TemplateCCorpRetainedEarningsPreview from "@/components/dashboard/templates/TemplateCCorpRetainedEarningsPreview";
import TemplateCCorpCashFlowsPreview from "@/components/dashboard/templates/TemplateCCorpCashFlowsPreview";
import TemplateCCorpNotesPreview from "@/components/dashboard/templates/TemplateCCorpNotesPreview";
import TemplateCCorpTaxBalanceSheetPreview from "@/components/dashboard/templates/TemplateCCorpTaxBalanceSheetPreview";
import TemplateCCorpTaxIncomePreview from "@/components/dashboard/templates/TemplateCCorpTaxIncomePreview";
import TemplateCCorpTaxEquityPreview from "@/components/dashboard/templates/TemplateCCorpTaxEquityPreview";
import TemplateCCorpTaxCashFlowsPreview from "@/components/dashboard/templates/TemplateCCorpTaxCashFlowsPreview";
import TemplateCCorpTaxNotesPreview from "@/components/dashboard/templates/TemplateCCorpTaxNotesPreview";
import TemplateRetainedEarningsTaxPreview from "@/components/dashboard/templates/TemplateRetainedEarningsTaxPreview";
import TemplateSCorpBalanceSheetPreview from "@/components/dashboard/templates/TemplateSCorpBalanceSheetPreview";
import TemplateSCorpIncomePreview from "@/components/dashboard/templates/TemplateSCorpIncomePreview";
import TemplateSCorpEquityPreview from "@/components/dashboard/templates/TemplateSCorpEquityPreview";
import TemplateSCorpCashFlowsPreview from "@/components/dashboard/templates/TemplateSCorpCashFlowsPreview";
import TemplateSCorpNotesPreview from "@/components/dashboard/templates/TemplateSCorpNotesPreview";
import TemplateSCorpTaxBalanceSheetPreview from "@/components/dashboard/templates/TemplateSCorpTaxBalanceSheetPreview";
import TemplateSCorpTaxIncomePreview from "@/components/dashboard/templates/TemplateSCorpTaxIncomePreview";
import TemplateSCorpTaxEquityPreview from "@/components/dashboard/templates/TemplateSCorpTaxEquityPreview";
import TemplateSCorpTaxCashFlowsPreview from "@/components/dashboard/templates/TemplateSCorpTaxCashFlowsPreview";
import TemplateSCorpTaxNotesPreview from "@/components/dashboard/templates/TemplateSCorpTaxNotesPreview";
import TemplatePartnersCapitalPreview from "@/components/dashboard/templates/TemplatePartnersCapitalPreview";
import TemplatePartnershipBalanceSheetPreview from "@/components/dashboard/templates/TemplatePartnershipBalanceSheetPreview";
import TemplatePartnershipIncomePreview from "@/components/dashboard/templates/TemplatePartnershipIncomePreview";
import TemplatePartnershipCashFlowsPreview from "@/components/dashboard/templates/TemplatePartnershipCashFlowsPreview";
import TemplatePartnershipNotesPreview from "@/components/dashboard/templates/TemplatePartnershipNotesPreview";
import TemplatePartnershipTaxBalanceSheetPreview from "@/components/dashboard/templates/TemplatePartnershipTaxBalanceSheetPreview";
import TemplatePartnershipTaxIncomePreview from "@/components/dashboard/templates/TemplatePartnershipTaxIncomePreview";
import TemplatePartnershipTaxCapitalPreview from "@/components/dashboard/templates/TemplatePartnershipTaxCapitalPreview";
import TemplatePartnershipTaxCashFlowsPreview from "@/components/dashboard/templates/TemplatePartnershipTaxCashFlowsPreview";
import TemplatePartnershipTaxNotesPreview from "@/components/dashboard/templates/TemplatePartnershipTaxNotesPreview";
import TemplateSoleBalanceSheetPreview from "@/components/dashboard/templates/TemplateSoleBalanceSheetPreview";
import TemplateSoleIncomePreview from "@/components/dashboard/templates/TemplateSoleIncomePreview";
import TemplateSoleOwnersEquityPreview from "@/components/dashboard/templates/TemplateSoleOwnersEquityPreview";
import TemplateSoleCashFlowsPreview from "@/components/dashboard/templates/TemplateSoleCashFlowsPreview";
import TemplateSoleNotesPreview from "@/components/dashboard/templates/TemplateSoleNotesPreview";
import TemplateSoleTaxBalanceSheetPreview from "@/components/dashboard/templates/TemplateSoleTaxBalanceSheetPreview";
import TemplateSoleTaxIncomePreview from "@/components/dashboard/templates/TemplateSoleTaxIncomePreview";
import TemplateSoleTaxCapitalPreview from "@/components/dashboard/templates/TemplateSoleTaxCapitalPreview";
import TemplateSoleTaxCashFlowsPreview from "@/components/dashboard/templates/TemplateSoleTaxCashFlowsPreview";
import TemplateSoleTaxNotesPreview from "@/components/dashboard/templates/TemplateSoleTaxNotesPreview";
import IncomeStatementPreview from "@/components/dashboard/workspace/IncomeStatementPreview";
import TemplateTrustBalanceSheetPreview from "@/components/dashboard/templates/TemplateTrustBalanceSheetPreview";
import TemplateTrustIncomePreview from "@/components/dashboard/templates/TemplateTrustIncomePreview";
import TemplateTrustCapitalPreview from "@/components/dashboard/templates/TemplateTrustCapitalPreview";
import TemplateTrustDistributionsPreview from "@/components/dashboard/templates/TemplateTrustDistributionsPreview";
import TemplateTrustCashFlowsPreview from "@/components/dashboard/templates/TemplateTrustCashFlowsPreview";
import TemplateTrustNotesPreview from "@/components/dashboard/templates/TemplateTrustNotesPreview";
import TemplateTrustTaxBalanceSheetPreview from "@/components/dashboard/templates/TemplateTrustTaxBalanceSheetPreview";
import TemplateTrustTaxIncomePreview from "@/components/dashboard/templates/TemplateTrustTaxIncomePreview";
import TemplateTrustTaxCorpusPreview from "@/components/dashboard/templates/TemplateTrustTaxCorpusPreview";
import TemplateTrustTaxDistributionsPreview from "@/components/dashboard/templates/TemplateTrustTaxDistributionsPreview";
import TemplateTrustTaxCashFlowsPreview from "@/components/dashboard/templates/TemplateTrustTaxCashFlowsPreview";
import TemplateTrustTaxNotesPreview from "@/components/dashboard/templates/TemplateTrustTaxNotesPreview";
import TemplateLLCSingleMemberCapitalPreview from "@/components/dashboard/templates/TemplateLLCSingleMemberCapitalPreview";
import TemplateLLCMultiBalanceSheetPreview from "@/components/dashboard/templates/TemplateLLCMultiBalanceSheetPreview";
import TemplateLLCMultiIncomePreview from "@/components/dashboard/templates/TemplateLLCMultiIncomePreview";
import TemplateLLCMultiMembersCapitalPreview from "@/components/dashboard/templates/TemplateLLCMultiMembersCapitalPreview";
import TemplateLLCMultiCashFlowsPreview from "@/components/dashboard/templates/TemplateLLCMultiCashFlowsPreview";
import TemplateLLCMultiNotesPreview from "@/components/dashboard/templates/TemplateLLCMultiNotesPreview";
import TemplateLLCMultiTaxBalanceSheetPreview from "@/components/dashboard/templates/TemplateLLCMultiTaxBalanceSheetPreview";
import TemplateLLCMultiTaxIncomePreview from "@/components/dashboard/templates/TemplateLLCMultiTaxIncomePreview";
import TemplateLLCMultiTaxCapitalPreview from "@/components/dashboard/templates/TemplateLLCMultiTaxCapitalPreview";
import TemplateLLCMultiTaxCashFlowsPreview from "@/components/dashboard/templates/TemplateLLCMultiTaxCashFlowsPreview";
import TemplateLLCMultiTaxNotesPreview from "@/components/dashboard/templates/TemplateLLCMultiTaxNotesPreview";
import CashFlowsPreview from "@/components/dashboard/workspace/CashFlowsPreview";
import NotesPreview from "@/components/dashboard/workspace/NotesPreview";

interface DocItem {
  id: number;
  label: string;
  componentKey: string;
  disabled?: boolean;
  hidden?: boolean;
}

const COMPILATION_DOCS: DocItem[] = [
  { id: 1, label: "Cover Page", componentKey: "cover" },
  { id: 2, label: "Table of Contents", componentKey: "toc" },
  { id: 3, label: "Compilation Report", componentKey: "compilation", disabled: true },
  { id: 4, label: "Balance Sheet", componentKey: "ccorp-balance" },
  { id: 5, label: "Income Statement", componentKey: "ccorp-income" },
  { id: 6, label: "Statement of Retained Earnings", componentKey: "ccorp-retained" },
  { id: 7, label: "Statement of Cash Flows", componentKey: "ccorp-cashflows" },
  { id: 8, label: "Notes to Financial Statements", componentKey: "ccorp-notes" },
  { id: 9, label: "Supporting Schedules", componentKey: "placeholder" },
];

const REVIEW_DOCS: DocItem[] = [
  { id: 1, label: "Cover Page", componentKey: "cover" },
  { id: 2, label: "Table of Contents", componentKey: "toc" },
  { id: 3, label: "Review Report", componentKey: "compilation", disabled: true },
  { id: 4, label: "Balance Sheet", componentKey: "ccorp-balance" },
  { id: 5, label: "Income Statement", componentKey: "ccorp-income" },
  { id: 6, label: "Statement of Retained Earnings", componentKey: "ccorp-retained" },
  { id: 7, label: "Statement of Cash Flows", componentKey: "ccorp-cashflows" },
  { id: 8, label: "Notes to Financial Statements", componentKey: "ccorp-notes" },
  { id: 9, label: "Supporting Schedules", componentKey: "placeholder" },
];

const TAX_DOCS: DocItem[] = [
  { id: 1, label: "Cover Page", componentKey: "cover" },
  { id: 2, label: "Table of Contents", componentKey: "toc" },
  { id: 3, label: "Statement of Assets, Liabilities & Stockholders' Equity — Income Tax Basis", componentKey: "ccorp-tax-balance" },
  { id: 4, label: "Statement of Revenue & Expenses — Income Tax Basis", componentKey: "ccorp-tax-income" },
  { id: 5, label: "Statement of Stockholders' Equity — Income Tax Basis", componentKey: "ccorp-tax-equity" },
  { id: 6, label: "Statement of Cash Flows — Income Tax Basis", componentKey: "ccorp-tax-cashflows" },
  { id: 7, label: "Notes to Tax-Basis Financial Statements", componentKey: "ccorp-tax-notes" },
  { id: 8, label: "Tax Return Schedules", componentKey: "placeholder" },
];

// S-Corp specific structures
const SCORP_COMPILATION_DOCS: DocItem[] = [
  { id: 1, label: "Cover Page", componentKey: "cover" },
  { id: 2, label: "Table of Contents", componentKey: "toc" },
  { id: 3, label: "Compilation Report", componentKey: "compilation", disabled: true },
  { id: 4, label: "Balance Sheet", componentKey: "scorp-balance" },
  { id: 5, label: "Income Statement", componentKey: "scorp-income" },
  { id: 6, label: "Statement of Stockholders' Equity", componentKey: "scorp-equity" },
  { id: 7, label: "Statement of Cash Flows", componentKey: "scorp-cashflows" },
  { id: 8, label: "Notes to Financial Statements", componentKey: "scorp-notes" },
  { id: 9, label: "Supporting Schedules", componentKey: "placeholder" },
];

const SCORP_REVIEW_DOCS: DocItem[] = [
  { id: 1, label: "Cover Page", componentKey: "cover" },
  { id: 2, label: "Table of Contents", componentKey: "toc" },
  { id: 3, label: "Review Report", componentKey: "compilation", disabled: true },
  { id: 4, label: "Balance Sheet", componentKey: "scorp-balance" },
  { id: 5, label: "Income Statement", componentKey: "scorp-income" },
  { id: 6, label: "Statement of Stockholders' Equity", componentKey: "scorp-equity" },
  { id: 7, label: "Statement of Cash Flows", componentKey: "scorp-cashflows" },
  { id: 8, label: "Notes to Financial Statements", componentKey: "scorp-notes" },
  { id: 9, label: "Supporting Schedules", componentKey: "placeholder" },
];

const SCORP_TAX_DOCS: DocItem[] = [
  { id: 1, label: "Cover Page", componentKey: "cover" },
  { id: 2, label: "Table of Contents", componentKey: "toc" },
  { id: 3, label: "Statement of Assets, Liabilities & Equity", componentKey: "scorp-tax-balance" },
  { id: 4, label: "Statement of Revenue & Expenses", componentKey: "scorp-tax-income" },
  { id: 5, label: "Statement of Stockholders' Equity", componentKey: "scorp-tax-equity" },
  { id: 6, label: "Statement of Cash Flows", componentKey: "scorp-tax-cashflows" },
  { id: 7, label: "Notes to Tax-Basis Financial Statements", componentKey: "scorp-tax-notes" },
  { id: 8, label: "Tax Return Schedules", componentKey: "placeholder" },
];

// Partnership
const PARTNERSHIP_COMPILATION_DOCS: DocItem[] = [
  { id: 1, label: "Cover Page", componentKey: "cover" },
  { id: 2, label: "Table of Contents", componentKey: "toc" },
  { id: 3, label: "Accountant's Compilation Report", componentKey: "compilation", disabled: true },
  { id: 4, label: "Balance Sheet", componentKey: "partnership-balance" },
  { id: 5, label: "Statement of Operations", componentKey: "partnership-income" },
  { id: 6, label: "Statement of Partners' Capital", componentKey: "partners-capital" },
  { id: 7, label: "Statement of Cash Flows", componentKey: "partnership-cashflows" },
  { id: 8, label: "Notes to Financial Statements", componentKey: "partnership-notes" },
  { id: 9, label: "Schedule of [Subject]", componentKey: "placeholder" },
];

const PARTNERSHIP_REVIEW_DOCS: DocItem[] = [
  { id: 1, label: "Cover Page", componentKey: "cover" },
  { id: 2, label: "Table of Contents", componentKey: "toc" },
  { id: 3, label: "Independent Accountant's Review Report", componentKey: "compilation", disabled: true },
  { id: 4, label: "Balance Sheet", componentKey: "partnership-balance" },
  { id: 5, label: "Statement of Operations", componentKey: "partnership-income" },
  { id: 6, label: "Statement of Partners' Capital", componentKey: "partners-capital" },
  { id: 7, label: "Statement of Cash Flows", componentKey: "partnership-cashflows" },
  { id: 8, label: "Notes to Financial Statements", componentKey: "partnership-notes" },
  { id: 9, label: "Schedule of [Subject]", componentKey: "placeholder" },
];

const PARTNERSHIP_TAX_DOCS: DocItem[] = [
  { id: 1, label: "Cover Page", componentKey: "cover" },
  { id: 2, label: "Table of Contents", componentKey: "toc" },
  { id: 3, label: "Statement of Assets, Liabilities, and Partners' Capital — Income Tax Basis", componentKey: "partnership-tax-balance" },
  { id: 4, label: "Statement of Revenues and Expenses — Income Tax Basis", componentKey: "partnership-tax-income" },
  { id: 5, label: "Statement of Changes in Partners' Capital — Income Tax Basis", componentKey: "partnership-tax-capital" },
  { id: 6, label: "Statement of Cash Flows — Income Tax Basis", componentKey: "partnership-tax-cashflows" },
  { id: 7, label: "Notes to Financial Statements — Income Tax Basis", componentKey: "partnership-tax-notes" },
  { id: 8, label: "Schedule of [Subject] — Income Tax Basis", componentKey: "placeholder" },
];

// LLC (Single Member)
const LLC_SINGLE_COMPILATION_DOCS: DocItem[] = [
  { id: 1, label: "Cover Page", componentKey: "cover" },
  { id: 2, label: "Table of Contents", componentKey: "toc" },
  { id: 3, label: "Accountant's Compilation Report", componentKey: "compilation", disabled: true },
  { id: 4, label: "Balance Sheet", componentKey: "sole-balance" },
  { id: 5, label: "Statement of Operations", componentKey: "sole-income" },
  { id: 6, label: "Statement of Member's Capital", componentKey: "llc-single-capital" },
  { id: 7, label: "Statement of Cash Flows", componentKey: "sole-cashflows" },
  { id: 8, label: "Notes to Financial Statements", componentKey: "sole-notes" },
  { id: 9, label: "Schedule of [Subject]", componentKey: "placeholder" },
];

const LLC_SINGLE_REVIEW_DOCS: DocItem[] = [
  { id: 1, label: "Cover Page", componentKey: "cover" },
  { id: 2, label: "Table of Contents", componentKey: "toc" },
  { id: 3, label: "Independent Accountant's Review Report", componentKey: "compilation", disabled: true },
  { id: 4, label: "Balance Sheet", componentKey: "sole-balance" },
  { id: 5, label: "Statement of Operations", componentKey: "sole-income" },
  { id: 6, label: "Statement of Member's Capital", componentKey: "llc-single-capital" },
  { id: 7, label: "Statement of Cash Flows", componentKey: "sole-cashflows" },
  { id: 8, label: "Notes to Financial Statements", componentKey: "sole-notes" },
  { id: 9, label: "Schedule of [Subject]", componentKey: "placeholder" },
];

const LLC_SINGLE_TAX_DOCS: DocItem[] = [
  { id: 1, label: "Cover Page", componentKey: "cover" },
  { id: 2, label: "Table of Contents", componentKey: "toc" },
  { id: 3, label: "Statement of Assets, Liabilities, and Member's Capital — Income Tax Basis", componentKey: "sole-tax-balance" },
  { id: 4, label: "Statement of Revenues and Expenses — Income Tax Basis", componentKey: "sole-tax-income" },
  { id: 5, label: "Statement of Changes in Member's Capital — Income Tax Basis", componentKey: "sole-tax-capital" },
  { id: 6, label: "Statement of Cash Flows — Income Tax Basis", componentKey: "sole-tax-cashflows" },
  { id: 7, label: "Notes to Financial Statements — Income Tax Basis", componentKey: "sole-tax-notes" },
  { id: 8, label: "Schedule of [Subject] — Income Tax Basis", componentKey: "placeholder" },
];

// LLC (Multiple Members)
const LLC_MULTI_COMPILATION_DOCS: DocItem[] = [
  { id: 1, label: "Cover Page", componentKey: "cover" },
  { id: 2, label: "Table of Contents", componentKey: "toc" },
  { id: 3, label: "Accountant's Compilation Report", componentKey: "compilation", disabled: true },
  { id: 4, label: "Balance Sheet", componentKey: "llc-multi-balance" },
  { id: 5, label: "Statement of Operations", componentKey: "llc-multi-income" },
  { id: 6, label: "Statement of Members' Capital", componentKey: "llc-multi-capital" },
  { id: 7, label: "Statement of Cash Flows", componentKey: "llc-multi-cashflows" },
  { id: 8, label: "Notes to Financial Statements", componentKey: "llc-multi-notes" },
  { id: 9, label: "Schedule of [Subject]", componentKey: "placeholder" },
];

const LLC_MULTI_REVIEW_DOCS: DocItem[] = [
  { id: 1, label: "Cover Page", componentKey: "cover" },
  { id: 2, label: "Table of Contents", componentKey: "toc" },
  { id: 3, label: "Independent Accountant's Review Report", componentKey: "compilation", disabled: true },
  { id: 4, label: "Balance Sheet", componentKey: "llc-multi-balance" },
  { id: 5, label: "Statement of Operations", componentKey: "llc-multi-income" },
  { id: 6, label: "Statement of Members' Capital", componentKey: "llc-multi-capital" },
  { id: 7, label: "Statement of Cash Flows", componentKey: "llc-multi-cashflows" },
  { id: 8, label: "Notes to Financial Statements", componentKey: "llc-multi-notes" },
  { id: 9, label: "Schedule of [Subject]", componentKey: "placeholder" },
];

const LLC_MULTI_TAX_DOCS: DocItem[] = [
  { id: 1, label: "Cover Page", componentKey: "cover" },
  { id: 2, label: "Table of Contents", componentKey: "toc" },
  { id: 3, label: "Statement of Assets, Liabilities, and Members' Capital — Income Tax Basis", componentKey: "llc-multi-tax-balance" },
  { id: 4, label: "Statement of Revenues and Expenses — Income Tax Basis", componentKey: "llc-multi-tax-income" },
  { id: 5, label: "Statement of Changes in Members' Capital — Income Tax Basis", componentKey: "llc-multi-tax-capital" },
  { id: 6, label: "Statement of Cash Flows — Income Tax Basis", componentKey: "llc-multi-tax-cashflows" },
  { id: 7, label: "Notes to Financial Statements — Income Tax Basis", componentKey: "llc-multi-tax-notes" },
  { id: 8, label: "Schedule of [Subject] — Income Tax Basis", componentKey: "placeholder" },
];

// Sole Proprietorship
const SOLE_COMPILATION_DOCS: DocItem[] = [
  { id: 1, label: "Cover Page", componentKey: "cover" },
  { id: 2, label: "Table of Contents", componentKey: "toc" },
  { id: 3, label: "Accountant's Compilation Report", componentKey: "compilation", disabled: true },
  { id: 4, label: "Statement of Financial Condition (Balance Sheet)", componentKey: "sole-balance" },
  { id: 5, label: "Statement of Revenues and Expenses", componentKey: "sole-income" },
  { id: 6, label: "Statement of Owner's Equity", componentKey: "sole-equity" },
  { id: 7, label: "Statement of Cash Flows", componentKey: "sole-cashflows" },
  { id: 8, label: "Notes to Financial Statements", componentKey: "sole-notes" },
  { id: 9, label: "Schedule of [Subject]", componentKey: "placeholder" },
];

const SOLE_REVIEW_DOCS: DocItem[] = [
  { id: 1, label: "Cover Page", componentKey: "cover" },
  { id: 2, label: "Table of Contents", componentKey: "toc" },
  { id: 3, label: "Independent Accountant's Review Report", componentKey: "compilation", disabled: true },
  { id: 4, label: "Statement of Financial Condition (Balance Sheet)", componentKey: "sole-balance" },
  { id: 5, label: "Statement of Revenues and Expenses", componentKey: "sole-income" },
  { id: 6, label: "Statement of Owner's Equity", componentKey: "sole-equity" },
  { id: 7, label: "Statement of Cash Flows", componentKey: "sole-cashflows" },
  { id: 8, label: "Notes to Financial Statements", componentKey: "sole-notes" },
  { id: 9, label: "Schedule of [Subject]", componentKey: "placeholder" },
];

const SOLE_TAX_DOCS: DocItem[] = [
  { id: 1, label: "Cover Page", componentKey: "cover" },
  { id: 2, label: "Table of Contents", componentKey: "toc" },
  { id: 3, label: "Statement of Assets and Liabilities — Income Tax Basis", componentKey: "sole-tax-balance" },
  { id: 4, label: "Statement of Revenues and Expenses — Income Tax Basis", componentKey: "sole-tax-income" },
  { id: 5, label: "Statement of Owner's Equity — Income Tax Basis", componentKey: "sole-tax-capital" },
  { id: 6, label: "Statement of Cash Flows — Income Tax Basis", componentKey: "sole-tax-cashflows" },
  { id: 7, label: "Notes to Financial Statements — Income Tax Basis", componentKey: "sole-tax-notes" },
  { id: 8, label: "Schedule of [Subject] — Income Tax Basis", componentKey: "placeholder" },
];

// Trust
const TRUST_COMPILATION_DOCS: DocItem[] = [
  { id: 1, label: "Cover Page", componentKey: "cover" },
  { id: 2, label: "Table of Contents", componentKey: "toc" },
  { id: 3, label: "Accountant's Compilation Report", componentKey: "compilation", disabled: true },
  { id: 4, label: "Statement of Assets and Liabilities", componentKey: "trust-balance" },
  { id: 5, label: "Statement of Trust Income and Expenses", componentKey: "trust-income" },
  { id: 6, label: "Statement of Changes in Trust Principal", componentKey: "trust-capital" },
  { id: 7, label: "Statement of Distributions to Beneficiaries", componentKey: "trust-distributions" },
  { id: 8, label: "Statement of Cash Flows", componentKey: "trust-cashflows" },
  { id: 9, label: "Notes to Financial Statements", componentKey: "trust-notes" },
  { id: 10, label: "Schedule of [Subject]", componentKey: "placeholder" },
];

const TRUST_REVIEW_DOCS: DocItem[] = [
  { id: 1, label: "Cover Page", componentKey: "cover" },
  { id: 2, label: "Table of Contents", componentKey: "toc" },
  { id: 3, label: "Independent Accountant's Review Report", componentKey: "compilation", disabled: true },
  { id: 4, label: "Statement of Assets and Liabilities", componentKey: "trust-balance" },
  { id: 5, label: "Statement of Trust Income and Expenses", componentKey: "trust-income" },
  { id: 6, label: "Statement of Changes in Trust Principal", componentKey: "trust-capital" },
  { id: 7, label: "Statement of Distributions to Beneficiaries", componentKey: "trust-distributions" },
  { id: 8, label: "Statement of Cash Flows", componentKey: "trust-cashflows" },
  { id: 9, label: "Notes to Financial Statements", componentKey: "trust-notes" },
  { id: 10, label: "Schedule of [Subject]", componentKey: "placeholder" },
];

const TRUST_TAX_DOCS: DocItem[] = [
  { id: 1, label: "Cover Page", componentKey: "cover" },
  { id: 2, label: "Table of Contents", componentKey: "toc" },
  { id: 3, label: "Statement of Assets and Liabilities — Income Tax Basis", componentKey: "trust-tax-balance" },
  { id: 4, label: "Statement of Income and Expenses — Income Tax Basis", componentKey: "trust-tax-income" },
  { id: 5, label: "Statement of Changes in Trust Corpus — Income Tax Basis", componentKey: "trust-tax-corpus" },
  { id: 6, label: "Statement of Distributions to Beneficiaries — Income Tax Basis", componentKey: "trust-tax-distributions" },
  { id: 7, label: "Statement of Cash Flows — Income Tax Basis", componentKey: "trust-tax-cashflows" },
  { id: 8, label: "Notes to Financial Statements — Income Tax Basis", componentKey: "trust-tax-notes" },
  { id: 9, label: "Schedule of [Subject] — Income Tax Basis", componentKey: "placeholder" },
];

// ===== CANADA (ASPE) Doc Structures =====

// Corporations (Canada)
const CA_CORP_COMPILATION_DOCS: DocItem[] = [
  { id: 1, label: "Cover Page", componentKey: "cover" },
  { id: 2, label: "Table of Contents", componentKey: "toc" },
  { id: 3, label: "Compilation Engagement Report", componentKey: "compilation", disabled: true },
  { id: 4, label: "Balance Sheet", componentKey: "balance" },
  { id: 5, label: "Statement of Income (or Statement of Earnings)", componentKey: "income" },
  { id: 6, label: "Statement of Retained Earnings", componentKey: "retained-earnings" },
  { id: 7, label: "Statement of Cash Flows", componentKey: "cashflows" },
  { id: 8, label: "Notes to Financial Statements", componentKey: "notes" },
  { id: 9, label: "Schedule of [Subject]", componentKey: "placeholder" },
];

const CA_CORP_REVIEW_DOCS: DocItem[] = [
  { id: 1, label: "Cover Page", componentKey: "cover" },
  { id: 2, label: "Table of Contents", componentKey: "toc" },
  { id: 3, label: "Review Engagement Report", componentKey: "compilation", disabled: true },
  { id: 4, label: "Balance Sheet", componentKey: "balance" },
  { id: 5, label: "Statement of Income", componentKey: "income" },
  { id: 6, label: "Statement of Retained Earnings", componentKey: "retained-earnings" },
  { id: 7, label: "Statement of Cash Flows", componentKey: "cashflows" },
  { id: 8, label: "Notes to Financial Statements", componentKey: "notes" },
  { id: 9, label: "Schedule of [Subject]", componentKey: "placeholder" },
];

const CA_CORP_TAX_DOCS: DocItem[] = [
  { id: 1, label: "Cover Page", componentKey: "cover" },
  { id: 2, label: "Table of Contents", componentKey: "toc" },
  { id: 3, label: "Statement of Assets, Liabilities, and Shareholders' Equity — Income Tax Basis", componentKey: "balance" },
  { id: 4, label: "Statement of Income and Retained Earnings — Income Tax Basis", componentKey: "income" },
  { id: 5, label: "Statement of Retained Earnings — Income Tax Basis", componentKey: "retained-earnings-tax" },
  { id: 6, label: "Statement of Cash Flows — Income Tax Basis", componentKey: "cashflows" },
  { id: 7, label: "Notes to Financial Statements — Income Tax Basis", componentKey: "notes" },
  { id: 8, label: "Schedule of [Subject] — Income Tax Basis", componentKey: "placeholder" },
];

// Partnership (Canada)
const CA_PARTNERSHIP_COMPILATION_DOCS: DocItem[] = [
  { id: 1, label: "Cover Page", componentKey: "cover" },
  { id: 2, label: "Table of Contents", componentKey: "toc" },
  { id: 3, label: "Compilation Engagement Report", componentKey: "compilation", disabled: true },
  { id: 4, label: "Balance Sheet", componentKey: "partnership-balance" },
  { id: 5, label: "Statement of Income (or Earnings / Operations)", componentKey: "partnership-income" },
  { id: 6, label: "Statement of Partners' Capital", componentKey: "partners-capital" },
  { id: 7, label: "Statement of Cash Flows", componentKey: "partnership-cashflows" },
  { id: 8, label: "Notes to Financial Statements", componentKey: "partnership-notes" },
  { id: 9, label: "Schedule of [Subject]", componentKey: "placeholder" },
];

const CA_PARTNERSHIP_REVIEW_DOCS: DocItem[] = [
  { id: 1, label: "Cover Page", componentKey: "cover" },
  { id: 2, label: "Table of Contents", componentKey: "toc" },
  { id: 3, label: "Review Engagement Report", componentKey: "compilation", disabled: true },
  { id: 4, label: "Balance Sheet", componentKey: "partnership-balance" },
  { id: 5, label: "Statement of Income", componentKey: "partnership-income" },
  { id: 6, label: "Statement of Partners' Capital", componentKey: "partners-capital" },
  { id: 7, label: "Statement of Cash Flows", componentKey: "partnership-cashflows" },
  { id: 8, label: "Notes to Financial Statements", componentKey: "partnership-notes" },
  { id: 9, label: "Schedule of [Subject]", componentKey: "placeholder" },
];

const CA_PARTNERSHIP_TAX_DOCS: DocItem[] = [
  { id: 1, label: "Cover Page", componentKey: "cover" },
  { id: 2, label: "Table of Contents", componentKey: "toc" },
  { id: 3, label: "Statement of Assets, Liabilities, and Partners' Capital — Income Tax Basis", componentKey: "partnership-tax-balance" },
  { id: 4, label: "Statement of Revenue and Expenses — Income Tax Basis", componentKey: "partnership-tax-income" },
  { id: 5, label: "Statement of Changes in Partners' Capital — Income Tax Basis", componentKey: "partnership-tax-capital" },
  { id: 6, label: "Statement of Cash Flows — Income Tax Basis", componentKey: "partnership-tax-cashflows" },
  { id: 7, label: "Notes to Financial Statements — Income Tax Basis", componentKey: "partnership-tax-notes" },
  { id: 8, label: "Schedule of [Subject] — Income Tax Basis", componentKey: "placeholder" },
];

// LLC Single Member (Canada)
const CA_LLC_SINGLE_COMPILATION_DOCS: DocItem[] = [
  { id: 1, label: "Cover Page", componentKey: "cover" },
  { id: 2, label: "Table of Contents", componentKey: "toc" },
  { id: 3, label: "Compilation Engagement Report", componentKey: "compilation", disabled: true },
  { id: 4, label: "Balance Sheet", componentKey: "balance" },
  { id: 5, label: "Statement of Income", componentKey: "income" },
  { id: 6, label: "Statement of Member's Capital", componentKey: "placeholder" },
  { id: 7, label: "Statement of Cash Flows", componentKey: "cashflows" },
  { id: 8, label: "Notes to Financial Statements", componentKey: "notes" },
  { id: 9, label: "Schedule of [Subject]", componentKey: "placeholder" },
];

const CA_LLC_SINGLE_REVIEW_DOCS: DocItem[] = [
  { id: 1, label: "Cover Page", componentKey: "cover" },
  { id: 2, label: "Table of Contents", componentKey: "toc" },
  { id: 3, label: "Review Engagement Report", componentKey: "compilation", disabled: true },
  { id: 4, label: "Balance Sheet", componentKey: "balance" },
  { id: 5, label: "Statement of Income", componentKey: "income" },
  { id: 6, label: "Statement of Member's Capital", componentKey: "placeholder" },
  { id: 7, label: "Statement of Cash Flows", componentKey: "cashflows" },
  { id: 8, label: "Notes to Financial Statements", componentKey: "notes" },
  { id: 9, label: "Schedule of [Subject]", componentKey: "placeholder" },
];

const CA_LLC_SINGLE_TAX_DOCS: DocItem[] = [
  { id: 1, label: "Cover Page", componentKey: "cover" },
  { id: 2, label: "Table of Contents", componentKey: "toc" },
  { id: 3, label: "Statement of Assets, Liabilities, and Member's Capital — Income Tax Basis", componentKey: "balance" },
  { id: 4, label: "Statement of Revenue and Expenses — Income Tax Basis", componentKey: "income" },
  { id: 5, label: "Statement of Changes in Member's Capital — Income Tax Basis", componentKey: "placeholder" },
  { id: 6, label: "Statement of Cash Flows — Income Tax Basis", componentKey: "cashflows" },
  { id: 7, label: "Notes to Financial Statements — Income Tax Basis", componentKey: "notes" },
  { id: 8, label: "Schedule of [Subject] — Income Tax Basis", componentKey: "placeholder" },
];

// LLC Multiple Members (Canada)
const CA_LLC_MULTI_COMPILATION_DOCS: DocItem[] = [
  { id: 1, label: "Cover Page", componentKey: "cover" },
  { id: 2, label: "Table of Contents", componentKey: "toc" },
  { id: 3, label: "Compilation Engagement Report", componentKey: "compilation", disabled: true },
  { id: 4, label: "Balance Sheet", componentKey: "llc-multi-balance" },
  { id: 5, label: "Statement of Income", componentKey: "llc-multi-income" },
  { id: 6, label: "Statement of Members' Capital", componentKey: "llc-multi-capital" },
  { id: 7, label: "Statement of Cash Flows", componentKey: "llc-multi-cashflows" },
  { id: 8, label: "Notes to Financial Statements", componentKey: "llc-multi-notes" },
  { id: 9, label: "Schedule of [Subject]", componentKey: "placeholder" },
];

const CA_LLC_MULTI_REVIEW_DOCS: DocItem[] = [
  { id: 1, label: "Cover Page", componentKey: "cover" },
  { id: 2, label: "Table of Contents", componentKey: "toc" },
  { id: 3, label: "Review Engagement Report", componentKey: "compilation", disabled: true },
  { id: 4, label: "Balance Sheet", componentKey: "llc-multi-balance" },
  { id: 5, label: "Statement of Income", componentKey: "llc-multi-income" },
  { id: 6, label: "Statement of Members' Capital", componentKey: "llc-multi-capital" },
  { id: 7, label: "Statement of Cash Flows", componentKey: "llc-multi-cashflows" },
  { id: 8, label: "Notes to Financial Statements", componentKey: "llc-multi-notes" },
  { id: 9, label: "Schedule of [Subject]", componentKey: "placeholder" },
];

const CA_LLC_MULTI_TAX_DOCS: DocItem[] = [
  { id: 1, label: "Cover Page", componentKey: "cover" },
  { id: 2, label: "Table of Contents", componentKey: "toc" },
  { id: 3, label: "Statement of Assets, Liabilities, and Members' Capital — Income Tax Basis", componentKey: "llc-multi-tax-balance" },
  { id: 4, label: "Statement of Revenue and Expenses — Income Tax Basis", componentKey: "llc-multi-tax-income" },
  { id: 5, label: "Statement of Changes in Members' Capital — Income Tax Basis", componentKey: "llc-multi-tax-capital" },
  { id: 6, label: "Statement of Cash Flows — Income Tax Basis", componentKey: "llc-multi-tax-cashflows" },
  { id: 7, label: "Notes to Financial Statements — Income Tax Basis", componentKey: "llc-multi-tax-notes" },
  { id: 8, label: "Schedule of [Subject] — Income Tax Basis", componentKey: "placeholder" },
];

// Sole Proprietorship (Canada)
const CA_SOLE_COMPILATION_DOCS: DocItem[] = [
  { id: 1, label: "Cover Page", componentKey: "cover" },
  { id: 2, label: "Table of Contents", componentKey: "toc" },
  { id: 3, label: "Compilation Engagement Report", componentKey: "compilation", disabled: true },
  { id: 4, label: "Balance Sheet (or Statement of Financial Position)", componentKey: "sole-balance" },
  { id: 5, label: "Statement of Revenue and Expenses", componentKey: "sole-income" },
  { id: 6, label: "Statement of Proprietor's Capital", componentKey: "sole-equity" },
  { id: 7, label: "Statement of Cash Flows", componentKey: "sole-cashflows" },
  { id: 8, label: "Notes to Financial Statements", componentKey: "sole-notes" },
  { id: 9, label: "Schedule of [Subject]", componentKey: "placeholder" },
];

const CA_SOLE_REVIEW_DOCS: DocItem[] = [
  { id: 1, label: "Cover Page", componentKey: "cover" },
  { id: 2, label: "Table of Contents", componentKey: "toc" },
  { id: 3, label: "Review Engagement Report", componentKey: "compilation", disabled: true },
  { id: 4, label: "Balance Sheet", componentKey: "sole-balance" },
  { id: 5, label: "Statement of Revenue and Expenses", componentKey: "sole-income" },
  { id: 6, label: "Statement of Proprietor's Capital", componentKey: "sole-equity" },
  { id: 7, label: "Statement of Cash Flows", componentKey: "sole-cashflows" },
  { id: 8, label: "Notes to Financial Statements", componentKey: "sole-notes" },
  { id: 9, label: "Schedule of [Subject]", componentKey: "placeholder" },
];

const CA_SOLE_TAX_DOCS: DocItem[] = [
  { id: 1, label: "Cover Page", componentKey: "cover" },
  { id: 2, label: "Table of Contents", componentKey: "toc" },
  { id: 3, label: "Statement of Assets and Liabilities — Income Tax Basis", componentKey: "sole-tax-balance" },
  { id: 4, label: "Statement of Revenue and Expenses — Income Tax Basis", componentKey: "sole-tax-income" },
  { id: 5, label: "Statement of Proprietor's Capital — Income Tax Basis", componentKey: "sole-tax-capital" },
  { id: 6, label: "Statement of Cash Flows — Income Tax Basis", componentKey: "sole-tax-cashflows" },
  { id: 7, label: "Notes to Financial Statements — Income Tax Basis", componentKey: "sole-tax-notes" },
  { id: 8, label: "Schedule of [Subject] — Income Tax Basis", componentKey: "placeholder" },
];

// Trust (Canada)
const CA_TRUST_COMPILATION_DOCS: DocItem[] = [
  { id: 1, label: "Cover Page", componentKey: "cover" },
  { id: 2, label: "Table of Contents", componentKey: "toc" },
  { id: 3, label: "Compilation Engagement Report", componentKey: "compilation", disabled: true },
  { id: 4, label: "Statement of Trust Assets and Liabilities", componentKey: "trust-balance" },
  { id: 5, label: "Statement of Trust Income and Expenses", componentKey: "trust-income" },
  { id: 6, label: "Statement of Changes in Trust Capital", componentKey: "trust-capital" },
  { id: 7, label: "Statement of Distributions to Beneficiaries", componentKey: "trust-distributions" },
  { id: 8, label: "Statement of Cash Flows", componentKey: "trust-cashflows" },
  { id: 9, label: "Notes to Financial Statements", componentKey: "trust-notes" },
  { id: 10, label: "Schedule of [Subject]", componentKey: "placeholder" },
];

const CA_TRUST_REVIEW_DOCS: DocItem[] = [
  { id: 1, label: "Cover Page", componentKey: "cover" },
  { id: 2, label: "Table of Contents", componentKey: "toc" },
  { id: 3, label: "Review Engagement Report", componentKey: "compilation", disabled: true },
  { id: 4, label: "Statement of Trust Assets and Liabilities", componentKey: "trust-balance" },
  { id: 5, label: "Statement of Trust Income and Expenses", componentKey: "trust-income" },
  { id: 6, label: "Statement of Changes in Trust Capital", componentKey: "trust-capital" },
  { id: 7, label: "Statement of Distributions to Beneficiaries", componentKey: "trust-distributions" },
  { id: 8, label: "Statement of Cash Flows", componentKey: "trust-cashflows" },
  { id: 9, label: "Notes to Financial Statements", componentKey: "trust-notes" },
  { id: 10, label: "Schedule of [Subject]", componentKey: "placeholder" },
];

const CA_TRUST_TAX_DOCS: DocItem[] = [
  { id: 1, label: "Cover Page", componentKey: "cover" },
  { id: 2, label: "Table of Contents", componentKey: "toc" },
  { id: 3, label: "Statement of Trust Assets and Liabilities — Income Tax Basis", componentKey: "trust-tax-balance" },
  { id: 4, label: "Statement of Trust Income and Expenses — Income Tax Basis", componentKey: "trust-tax-income" },
  { id: 5, label: "Statement of Changes in Trust Corpus — Income Tax Basis", componentKey: "trust-tax-corpus" },
  { id: 6, label: "Statement of Distributions to Beneficiaries — Income Tax Basis", componentKey: "trust-tax-distributions" },
  { id: 7, label: "Statement of Cash Flows — Income Tax Basis", componentKey: "trust-tax-cashflows" },
  { id: 8, label: "Notes to Financial Statements — Income Tax Basis", componentKey: "trust-tax-notes" },
  { id: 9, label: "Schedule of [Subject] — Income Tax Basis", componentKey: "placeholder" },
];

type EntityDocsMap = { compilation: DocItem[]; review: DocItem[]; tax: DocItem[] };

const ENTITY_DOCS: Record<string, EntityDocsMap> = {
  "c-corp": { compilation: COMPILATION_DOCS, review: REVIEW_DOCS, tax: TAX_DOCS },
  "s-corp": { compilation: SCORP_COMPILATION_DOCS, review: SCORP_REVIEW_DOCS, tax: SCORP_TAX_DOCS },
  "partnership": { compilation: PARTNERSHIP_COMPILATION_DOCS, review: PARTNERSHIP_REVIEW_DOCS, tax: PARTNERSHIP_TAX_DOCS },
  "llc (single member)": { compilation: LLC_SINGLE_COMPILATION_DOCS, review: LLC_SINGLE_REVIEW_DOCS, tax: LLC_SINGLE_TAX_DOCS },
  "llc (multiple members)": { compilation: LLC_MULTI_COMPILATION_DOCS, review: LLC_MULTI_REVIEW_DOCS, tax: LLC_MULTI_TAX_DOCS },
  "sole proprietorship": { compilation: SOLE_COMPILATION_DOCS, review: SOLE_REVIEW_DOCS, tax: SOLE_TAX_DOCS },
  "trust": { compilation: TRUST_COMPILATION_DOCS, review: TRUST_REVIEW_DOCS, tax: TRUST_TAX_DOCS },
  "corporations": { compilation: COMPILATION_DOCS, review: REVIEW_DOCS, tax: TAX_DOCS },
};

const CA_ENTITY_DOCS: Record<string, EntityDocsMap> = {
  "c-corp": { compilation: CA_CORP_COMPILATION_DOCS, review: CA_CORP_REVIEW_DOCS, tax: CA_CORP_TAX_DOCS },
  "corporations": { compilation: CA_CORP_COMPILATION_DOCS, review: CA_CORP_REVIEW_DOCS, tax: CA_CORP_TAX_DOCS },
  "partnership": { compilation: CA_PARTNERSHIP_COMPILATION_DOCS, review: CA_PARTNERSHIP_REVIEW_DOCS, tax: CA_PARTNERSHIP_TAX_DOCS },
  "llc (single member)": { compilation: CA_LLC_SINGLE_COMPILATION_DOCS, review: CA_LLC_SINGLE_REVIEW_DOCS, tax: CA_LLC_SINGLE_TAX_DOCS },
  "llc (multiple members)": { compilation: CA_LLC_MULTI_COMPILATION_DOCS, review: CA_LLC_MULTI_REVIEW_DOCS, tax: CA_LLC_MULTI_TAX_DOCS },
  "sole proprietorship": { compilation: CA_SOLE_COMPILATION_DOCS, review: CA_SOLE_REVIEW_DOCS, tax: CA_SOLE_TAX_DOCS },
  "trust": { compilation: CA_TRUST_COMPILATION_DOCS, review: CA_TRUST_REVIEW_DOCS, tax: CA_TRUST_TAX_DOCS },
};

function detectEntity(templateName: string): string {
  const lower = templateName.toLowerCase();
  if (lower.includes("llc (single member)") || lower.includes("llc single member")) return "llc (single member)";
  if (lower.includes("llc (multiple members)") || lower.includes("llc multiple members")) return "llc (multiple members)";
  if (lower.includes("sole proprietorship")) return "sole proprietorship";
  if (lower.includes("partnership")) return "partnership";
  if (lower.includes("trust")) return "trust";
  if (lower.includes("s-corp") || lower.includes("s corp") || lower.includes("scorp")) return "s-corp";
  if (lower.includes("corporations")) return "corporations";
  return "c-corp";
}

function getDocsForTemplate(templateName: string | null): DocItem[] {
  if (!templateName) return COMPILATION_DOCS;
  const entity = detectEntity(templateName);
  const lower = templateName.toLowerCase();
  const isCanada = lower.includes("aspe");
  const docsMap = isCanada ? CA_ENTITY_DOCS : ENTITY_DOCS;
  const docs = docsMap[entity] || ENTITY_DOCS[entity] || ENTITY_DOCS["c-corp"];

  if (lower.includes("review")) return docs.review;
  if (lower.includes("income tax basis") || lower.includes("tax basis") || lower.includes("tax")) return docs.tax;
  return docs.compilation;
}

function getTemplateTitleForHeader(templateName: string | null): string {
  if (!templateName) return "Compilation template";
  const entity = detectEntity(templateName);
  const entityLabel: Record<string, string> = {
    "c-corp": "C-Corp",
    "s-corp": "S-Corp",
    "partnership": "Partnership",
    "llc (single member)": "LLC (Single Member)",
    "llc (multiple members)": "LLC (Multiple Members)",
    "sole proprietorship": "Sole Proprietorship",
    "trust": "Trust",
    "corporations": "Corporations",
  };
  const label = entityLabel[entity] || "C-Corp";
  const lower = templateName.toLowerCase();
  if (lower.includes("review")) return `${label} Review template`;
  if (lower.includes("income tax basis") || lower.includes("tax basis") || lower.includes("tax")) return `${label} Tax Basis template`;
  return `${label} Compilation template`;
}

/* Render the actual preview component based on componentKey */
const DocumentPreviewContent = ({
  componentKey,
  label,
  docs,
  templateName,
  isEditMode = false,
  onContentChanged,
}: {
  componentKey: string;
  label: string;
  docs: DocItem[];
  templateName: string | null;
  isEditMode?: boolean;
  onContentChanged?: (hasChanges: boolean) => void;
}) => {
  // Determine template type from templateName
  const getTemplateType = (): "compilation" | "review" | "tax" | null => {
    if (!templateName) return null;
    const lower = templateName.toLowerCase();
    if (lower.includes("review")) return "review";
    if (lower.includes("income tax basis") || lower.includes("tax basis") || lower.includes("tax")) return "tax";
    return "compilation";
  };

  // Keys that should NOT get the editable wrapper (non-financial-statement pages)
  const nonEditableKeys = ["cover", "toc", "compilation", "placeholder"];
  const shouldWrap = isEditMode && !nonEditableKeys.includes(componentKey);

  const content = (() => {
    switch (componentKey) {
    case "cover":
      return <CoverPagePreview key={`cover-${templateName}`} templateType={getTemplateType()} />;
    case "toc":
      return <TemplateTableOfContentsPreview docs={docs} />;
    case "compilation":
      return <CompilationReportPreview />;
    case "balance":
      return <TemplateBalanceSheetPreview isEditMode={isEditMode} />;
    case "ccorp-balance":
      return <TemplateCCorpBalanceSheetPreview isEditMode={isEditMode} />;
    case "ccorp-income":
      return <TemplateCCorpIncomePreview isEditMode={isEditMode} />;
    case "ccorp-retained":
      return <TemplateCCorpRetainedEarningsPreview isEditMode={isEditMode} />;
    case "ccorp-cashflows":
      return <TemplateCCorpCashFlowsPreview isEditMode={isEditMode} />;
    case "ccorp-notes":
      return <TemplateCCorpNotesPreview />;
    case "ccorp-tax-balance":
      return <TemplateCCorpTaxBalanceSheetPreview isEditMode={isEditMode} />;
    case "ccorp-tax-income":
      return <TemplateCCorpTaxIncomePreview isEditMode={isEditMode} />;
    case "ccorp-tax-equity":
      return <TemplateCCorpTaxEquityPreview isEditMode={isEditMode} />;
    case "ccorp-tax-cashflows":
      return <TemplateCCorpTaxCashFlowsPreview isEditMode={isEditMode} />;
    case "ccorp-tax-notes":
      return <TemplateCCorpTaxNotesPreview />;
    case "scorp-balance":
      return <TemplateSCorpBalanceSheetPreview isEditMode={isEditMode} />;
    case "scorp-income":
      return <TemplateSCorpIncomePreview isEditMode={isEditMode} />;
    case "scorp-equity":
      return <TemplateSCorpEquityPreview isEditMode={isEditMode} />;
    case "scorp-cashflows":
      return <TemplateSCorpCashFlowsPreview isEditMode={isEditMode} />;
    case "scorp-notes":
      return <TemplateSCorpNotesPreview />;
    case "scorp-tax-balance":
      return <TemplateSCorpTaxBalanceSheetPreview isEditMode={isEditMode} />;
    case "scorp-tax-income":
      return <TemplateSCorpTaxIncomePreview isEditMode={isEditMode} />;
    case "scorp-tax-equity":
      return <TemplateSCorpTaxEquityPreview isEditMode={isEditMode} />;
    case "scorp-tax-cashflows":
      return <TemplateSCorpTaxCashFlowsPreview isEditMode={isEditMode} />;
    case "scorp-tax-notes":
      return <TemplateSCorpTaxNotesPreview />;
    case "income":
      return <IncomeStatementPreview isEditMode={isEditMode} />;
    case "retained-earnings":
      return <TemplateRetainedEarningsPreview isEditMode={isEditMode} />;
    case "retained-earnings-tax":
      return <TemplateRetainedEarningsTaxPreview isEditMode={isEditMode} />;
    case "partners-capital":
      return <TemplatePartnersCapitalPreview isEditMode={isEditMode} />;
    case "partnership-balance":
      return <TemplatePartnershipBalanceSheetPreview isEditMode={isEditMode} />;
    case "partnership-income":
      return <TemplatePartnershipIncomePreview isEditMode={isEditMode} />;
    case "partnership-cashflows":
      return <TemplatePartnershipCashFlowsPreview isEditMode={isEditMode} />;
    case "partnership-notes":
      return <TemplatePartnershipNotesPreview />;
    case "partnership-tax-balance":
      return <TemplatePartnershipTaxBalanceSheetPreview isEditMode={isEditMode} />;
    case "partnership-tax-income":
      return <TemplatePartnershipTaxIncomePreview isEditMode={isEditMode} />;
    case "partnership-tax-capital":
      return <TemplatePartnershipTaxCapitalPreview isEditMode={isEditMode} />;
    case "partnership-tax-cashflows":
      return <TemplatePartnershipTaxCashFlowsPreview isEditMode={isEditMode} />;
    case "partnership-tax-notes":
      return <TemplatePartnershipTaxNotesPreview />;
    case "llc-single-capital":
      return <TemplateLLCSingleMemberCapitalPreview isEditMode={isEditMode} />;
    case "sole-balance":
      return <TemplateSoleBalanceSheetPreview isEditMode={isEditMode} />;
    case "sole-income":
      return <TemplateSoleIncomePreview isEditMode={isEditMode} />;
    case "sole-equity":
      return <TemplateSoleOwnersEquityPreview isEditMode={isEditMode} />;
    case "sole-cashflows":
      return <TemplateSoleCashFlowsPreview isEditMode={isEditMode} />;
    case "sole-notes":
      return <TemplateSoleNotesPreview />;
    case "sole-tax-balance":
      return <TemplateSoleTaxBalanceSheetPreview isEditMode={isEditMode} />;
    case "sole-tax-income":
      return <TemplateSoleTaxIncomePreview isEditMode={isEditMode} />;
    case "sole-tax-capital":
      return <TemplateSoleTaxCapitalPreview isEditMode={isEditMode} />;
    case "sole-tax-cashflows":
      return <TemplateSoleTaxCashFlowsPreview isEditMode={isEditMode} />;
    case "sole-tax-notes":
      return <TemplateSoleTaxNotesPreview />;
    case "trust-balance":
      return <TemplateTrustBalanceSheetPreview isEditMode={isEditMode} />;
    case "trust-income":
      return <TemplateTrustIncomePreview isEditMode={isEditMode} />;
    case "trust-capital":
      return <TemplateTrustCapitalPreview isEditMode={isEditMode} />;
    case "trust-distributions":
      return <TemplateTrustDistributionsPreview isEditMode={isEditMode} />;
    case "trust-cashflows":
      return <TemplateTrustCashFlowsPreview isEditMode={isEditMode} />;
    case "trust-notes":
      return <TemplateTrustNotesPreview />;
    case "trust-tax-balance":
      return <TemplateTrustTaxBalanceSheetPreview isEditMode={isEditMode} />;
    case "trust-tax-income":
      return <TemplateTrustTaxIncomePreview isEditMode={isEditMode} />;
    case "trust-tax-corpus":
      return <TemplateTrustTaxCorpusPreview isEditMode={isEditMode} />;
    case "trust-tax-distributions":
      return <TemplateTrustTaxDistributionsPreview isEditMode={isEditMode} />;
    case "trust-tax-cashflows":
      return <TemplateTrustTaxCashFlowsPreview isEditMode={isEditMode} />;
    case "trust-tax-notes":
      return <TemplateTrustTaxNotesPreview />;
    case "llc-multi-balance":
      return <TemplateLLCMultiBalanceSheetPreview isEditMode={isEditMode} />;
    case "llc-multi-income":
      return <TemplateLLCMultiIncomePreview isEditMode={isEditMode} />;
    case "llc-multi-capital":
      return <TemplateLLCMultiMembersCapitalPreview isEditMode={isEditMode} />;
    case "llc-multi-cashflows":
      return <TemplateLLCMultiCashFlowsPreview isEditMode={isEditMode} />;
    case "llc-multi-notes":
      return <TemplateLLCMultiNotesPreview />;
    case "llc-multi-tax-balance":
      return <TemplateLLCMultiTaxBalanceSheetPreview isEditMode={isEditMode} />;
    case "llc-multi-tax-income":
      return <TemplateLLCMultiTaxIncomePreview isEditMode={isEditMode} />;
    case "llc-multi-tax-capital":
      return <TemplateLLCMultiTaxCapitalPreview isEditMode={isEditMode} />;
    case "llc-multi-tax-cashflows":
      return <TemplateLLCMultiTaxCashFlowsPreview isEditMode={isEditMode} />;
    case "llc-multi-tax-notes":
      return <TemplateLLCMultiTaxNotesPreview />;
    case "cashflows":
      return <CashFlowsPreview isEditMode={isEditMode} />;
    case "notes":
      return <NotesPreview />;
    default:
      return (
        <div className="flex-1 flex items-center justify-center p-6 bg-muted/30">
          <div
            className="bg-white rounded-sm border border-border flex flex-col items-center justify-center"
            style={{
              width: 842,
              minHeight: 1191,
              boxShadow: "0 4px 24px hsl(220 20% 10% / 0.08), 0 1px 4px hsl(220 20% 10% / 0.04)",
              fontFamily: "'Arial', 'Helvetica', sans-serif",
              position: "relative",
            }}
          >
            <p className="text-muted-foreground text-base">{label}</p>
            <p className="text-muted-foreground/60 text-sm mt-1">Template preview</p>
          </div>
        </div>
      );
  }
  })();

  if (shouldWrap) {
    return (
      <TemplateEditableWrapper isEditMode={isEditMode} onContentChanged={onContentChanged}>
        {content}
      </TemplateEditableWrapper>
    );
  }

  return content;
};

/* Inline Layout Settings panel for edit mode - renders as RHS sidebar, not floating overlay */
const TemplateInlineLayoutSettings = ({ onClose, activeDocKey }: { onClose: () => void; activeDocKey?: string }) => {
  const { settings, applySettings, updatePartnersCapital, partnersCapitalPreviewImpact, setPartnersCapitalPreviewImpact } = useLayoutSettings();
  const pcValidation = validatePartnersCapital(settings.partnersCapital);
  const pcErrors = pcValidation.fieldErrors;
  // (panel knows the active doc via the gating prop already)
  const errorRingClass = "border-destructive focus-visible:ring-destructive/40";
  const [fontStyle, setFontStyle] = useState(settings.fontStyle);
  const [pageMargin, setPageMargin] = useState(settings.pageMargin);
  const [tocEnabled, setTocEnabled] = useState(true);
  const [headerFooterEnabled, setHeaderFooterEnabled] = useState(settings.headerFooterEnabled);
  const [headerScope, setHeaderScope] = useState(settings.headerScope);
  const [footerScope, setFooterScope] = useState(settings.footerScope);
  const [headerStretchToFit, setHeaderStretchToFit] = useState(settings.headerStretchToFit);
  const [footerStretchToFit, setFooterStretchToFit] = useState(settings.footerStretchToFit);
  const [showCurrency, setShowCurrency] = useState(settings.showCurrency);
  const [currencyType, setCurrencyType] = useState(settings.currencyType);
  const [placement, setPlacement] = useState(settings.currencyPlacement);
  const [figureRepresentation, setFigureRepresentation] = useState(settings.figureRepresentation);
  const [compressionValue, setCompressionValue] = useState([settings.compressionValue]);
  const [compressionPages, setCompressionPages] = useState("all");
  const [manualColumns, setManualColumns] = useState(settings.manualColumns);

  // Apply settings live as user changes them
  useEffect(() => {
    applySettings({
      fontStyle,
      pageMargin,
      headerFooterEnabled,
      headerScope,
      footerScope,
      headerStretchToFit,
      footerStretchToFit,
      showCurrency,
      currencyType,
      currencyPlacement: placement,
      figureRepresentation,
      compressionValue: compressionValue[0],
      manualColumns,
      manualColumnsAdded: settings.manualColumnsAdded,
      manualColumnInsertions: settings.manualColumnInsertions,
      boardApproval: settings.boardApproval,
      firmBranding: settings.firmBranding,
      partnersCapital: settings.partnersCapital,
    });
  }, [fontStyle, pageMargin, headerFooterEnabled, headerScope, footerScope, headerStretchToFit, footerStretchToFit, showCurrency, currencyType, placement, figureRepresentation, compressionValue, manualColumns, applySettings, settings.manualColumnsAdded]);

  const SettingRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[14px] text-foreground">{label}</span>
      {children}
    </div>
  );

  const InlineAccordion = ({ title, icon, children, defaultOpen = false }: { title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }) => {
    const [open, setOpen] = useState(defaultOpen);
    return (
      <div className="border-b border-border">
        <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent/50 transition-colors cursor-pointer">
          <div className="flex items-center gap-2">
            {icon}
            <span className="text-[14px] font-semibold text-foreground">{title}</span>
          </div>
          <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={14} className="text-muted-foreground" />
          </motion.div>
        </button>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
              <div className="px-4 pb-3 space-y-3">{children}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 336, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 30 }}
      className="shrink-0 border-l border-border bg-card flex flex-col overflow-hidden"
      style={{ minWidth: 0 }}
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[15px] font-bold text-foreground">Layout Settings</h3>
            <p className="text-[12px] text-muted-foreground mt-0.5">Display data on the page effectively</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-accent transition-colors cursor-pointer">
            <ChevronRight size={16} className="text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Scrollable settings */}
      <div className="flex-1 overflow-y-auto">
        <InlineAccordion title="Page Setup" icon={<FileText size={16} style={{ color: "#1c63a6" }} />} defaultOpen>
          <SettingRow label="Font Style">
            <Select value={fontStyle} onValueChange={setFontStyle}>
              <SelectTrigger className="w-[120px] h-8 text-[13px] rounded-lg"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="arial">Arial</SelectItem>
                <SelectItem value="times">Times New Roman</SelectItem>
                <SelectItem value="calibri">Calibri</SelectItem>
                <SelectItem value="helvetica">Helvetica</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>
          <SettingRow label="Page Margin">
            <Select value={pageMargin} onValueChange={setPageMargin}>
              <SelectTrigger className="w-[120px] h-8 text-[13px] rounded-lg"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="actual">Default</SelectItem>
                <SelectItem value="narrow">Narrow</SelectItem>
                <SelectItem value="wide">Wide</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>
          <SettingRow label="Table of Contents">
            <Switch checked={tocEnabled} onCheckedChange={setTocEnabled} />
          </SettingRow>
          <div className="flex items-start gap-1.5 text-[11px] text-primary">
            <Info size={12} className="shrink-0 mt-0.5" />
            <span>Page numbers are not applicable on Cover Page and Table of Contents</span>
          </div>
        </InlineAccordion>

        <InlineAccordion title="Headers & Footers" icon={<AlignLeft size={16} style={{ color: "#1c63a6" }} />}>
          <SettingRow label="Header & Footer Visibility">
            <Switch checked={headerFooterEnabled} onCheckedChange={setHeaderFooterEnabled} />
          </SettingRow>
          {headerFooterEnabled && (
            <>
              <SettingRow label="Header">
                <Select value={headerScope} onValueChange={setHeaderScope}>
                  <SelectTrigger className="w-[120px] h-8 text-[13px] rounded-lg"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Pages</SelectItem>
                    <SelectItem value="first">First Page Only</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                  </SelectContent>
                </Select>
              </SettingRow>
              <div className="flex items-center gap-2 pl-1">
                <Checkbox
                  id="header-stretch"
                  checked={headerStretchToFit}
                  onCheckedChange={(v) => setHeaderStretchToFit(!!v)}
                  className="rounded-[4px]"
                />
                <label htmlFor="header-stretch" className="text-[13px] text-muted-foreground cursor-pointer select-none">Stretch to fit</label>
              </div>
              <SettingRow label="Footer">
                <Select value={footerScope} onValueChange={setFooterScope}>
                  <SelectTrigger className="w-[120px] h-8 text-[13px] rounded-lg"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Pages</SelectItem>
                    <SelectItem value="first">First Page Only</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                  </SelectContent>
                </Select>
              </SettingRow>
              <div className="flex items-center gap-2 pl-1">
                <Checkbox
                  id="footer-stretch"
                  checked={footerStretchToFit}
                  onCheckedChange={(v) => setFooterStretchToFit(!!v)}
                  className="rounded-[4px]"
                />
                <label htmlFor="footer-stretch" className="text-[13px] text-muted-foreground cursor-pointer select-none">Stretch to fit</label>
              </div>
            </>
          )}
        </InlineAccordion>

        <InlineAccordion title="Amounts Representation" icon={<Info size={16} style={{ color: "#1c63a6" }} />}>
          <SettingRow label="Show Currency">
            <Switch checked={showCurrency} onCheckedChange={setShowCurrency} />
          </SettingRow>
          {showCurrency && (
            <>
              <SettingRow label="Change Symbol">
                <Select value={currencyType} onValueChange={setCurrencyType}>
                  <SelectTrigger className="w-[120px] h-8 text-[13px] rounded-lg"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cad">CAN ($)</SelectItem>
                    <SelectItem value="usd">USD ($)</SelectItem>
                    <SelectItem value="eur">EUR (€)</SelectItem>
                    <SelectItem value="gbp">GBP (£)</SelectItem>
                  </SelectContent>
                </Select>
              </SettingRow>
              <SettingRow label="Symbol Placement">
                <Select value={placement} onValueChange={setPlacement}>
                  <SelectTrigger className="w-[120px] h-8 text-[13px] rounded-lg"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="first-row">First Row</SelectItem>
                    <SelectItem value="all-rows">All Rows</SelectItem>
                    <SelectItem value="totals-only">Totals Only</SelectItem>
                  </SelectContent>
                </Select>
              </SettingRow>
            </>
          )}
          <SettingRow label="Figure Representation">
            <Select value={figureRepresentation} onValueChange={setFigureRepresentation}>
              <SelectTrigger className="w-[120px] h-8 text-[13px] rounded-lg"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="actual">Default</SelectItem>
                <SelectItem value="thousands">In Thousands</SelectItem>
                <SelectItem value="millions">In Millions</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>
        </InlineAccordion>

        <InlineAccordion title="Page Content Compression" icon={<SlidersHorizontal size={16} style={{ color: "#1c63a6" }} />}>
          <div className="space-y-3">
            <Slider
              value={compressionValue}
              onValueChange={setCompressionValue}
              max={100}
              step={1}
              className="w-full"
            />
            <div className="flex items-center justify-between text-muted-foreground">
              <span style={{ fontSize: 11 }}>A</span>
              <span style={{ fontSize: 14 }}>A</span>
              <span style={{ fontSize: 17, fontWeight: 600 }}>A</span>
            </div>
          </div>
          <SettingRow label="Select Pages">
            <Select value={compressionPages} onValueChange={setCompressionPages}>
              <SelectTrigger className="w-[120px] h-8 text-[13px] rounded-lg"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Pages</SelectItem>
                <SelectItem value="current">Current Page</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>
        </InlineAccordion>

        <InlineAccordion title="Manual Columns" icon={<Columns3 size={16} style={{ color: "#1c63a6" }} />}>
          <div className="flex items-start gap-1.5 text-[11px] text-primary mb-1">
            <Info size={12} className="shrink-0 mt-0.5" />
            <span>Use the <strong>+</strong> icon in the preview header to add a manual column. Toggle visibility here.</span>
          </div>
          {([
            { key: "balanceSheet" as const, label: "Balance Sheet" },
            { key: "incomeStatement" as const, label: "Income Statement" },
            { key: "retainedEarnings" as const, label: "Retained Earnings" },
            { key: "cashFlows" as const, label: "Cash Flows" },
          ]).map(({ key, label }) => {
            const isAdded = settings.manualColumnsAdded[key];
            return (
              <div key={key} className="flex items-center justify-between gap-3">
                <span className={`text-[14px] ${isAdded ? "text-foreground" : "text-muted-foreground/50"}`}>{label}</span>
                <div className="flex items-center gap-2">
                  {!isAdded && <span className="text-[10px] text-muted-foreground/40 italic">Not added</span>}
                  <Switch checked={manualColumns[key]} disabled={!isAdded} onCheckedChange={(v) => setManualColumns(prev => ({ ...prev, [key]: !!v }))} />
                </div>
              </div>
            );
          })}
        </InlineAccordion>

        {/* ============================================================
            Template Settings — Statement of Partners' Capital
            Only visible when active doc is the partners' capital statement
        ============================================================ */}
        {activeDocKey === "partners-capital" && (
          <InlineAccordion
            title="Template Settings"
            icon={<Settings2 size={16} style={{ color: "#1c63a6" }} />}
            defaultOpen
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-start gap-1.5 text-[11px] text-primary">
                <Info size={12} className="shrink-0 mt-0.5" />
                <span>Configure the Statement of Partners' Capital. Changes apply live.</span>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        exportPartnersCapitalSettingsPdf(settings.partnersCapital);
                        toast.success("Template Settings PDF exported");
                      } catch (err) {
                        console.error(err);
                        toast.error("Could not export PDF");
                      }
                    }}
                    className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-border bg-background hover:bg-accent text-[11px] font-medium text-foreground cursor-pointer shrink-0"
                    aria-label="Export Template Settings as PDF"
                  >
                    <FileText size={12} className="text-primary" />
                    Export PDF
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left" className="text-[11px] max-w-[220px]">
                  Download a PDF summary of the current Template Settings for {settings.partnersCapital.jurisdiction} · {settings.partnersCapital.entityType}.
                </TooltipContent>
              </Tooltip>
            </div>

            {/* General */}
            <div className="rounded-md border border-border/60">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-border/60 bg-muted/30">
                <FileText size={13} style={{ color: "#1c63a6" }} />
                <span className="text-[13px] font-semibold text-foreground">General</span>
              </div>
              <div className="px-3 py-2.5 space-y-2.5">
                <SettingRow label="Jurisdiction">
                  <Select
                    value={settings.partnersCapital.jurisdiction}
                    onValueChange={(v) => updatePartnersCapital({ jurisdiction: v as "US" | "CA" })}
                  >
                    <SelectTrigger className="w-[120px] h-8 text-[13px] rounded-lg"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CA">Canada (CA)</SelectItem>
                      <SelectItem value="US">United States (US)</SelectItem>
                    </SelectContent>
                  </Select>
                </SettingRow>
                <SettingRow label="Entity Type">
                  <Select
                    value={settings.partnersCapital.entityType}
                    onValueChange={(v) => updatePartnersCapital({ entityType: v as "Partnership" | "LLP" })}
                  >
                    <SelectTrigger className="w-[120px] h-8 text-[13px] rounded-lg"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Partnership">Partnership</SelectItem>
                      <SelectItem value="LLP">LLP</SelectItem>
                    </SelectContent>
                  </Select>
                </SettingRow>
                <SettingRow label="Fiscal Year End">
                  <Input
                    value={settings.partnersCapital.fiscalYearEnd}
                    onChange={(e) => updatePartnersCapital({ fiscalYearEnd: e.target.value })}
                    placeholder="MM-DD"
                    className="w-[120px] h-8 text-[13px] rounded-lg"
                  />
                </SettingRow>
              </div>
            </div>

            {/* Partners */}
            <div className="rounded-md border border-border/60">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-border/60 bg-muted/30">
                <Users size={13} style={{ color: "#1c63a6" }} />
                <span className="text-[13px] font-semibold text-foreground">Partners</span>
              </div>
              <div className="px-3 py-2.5 space-y-2.5">
                <SettingRow label="Partner Count">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => updatePartnersCapital({ partnerCount: Math.max(2, settings.partnersCapital.partnerCount - 1) })}
                      className="h-7 w-7 inline-flex items-center justify-center rounded-md border border-border hover:bg-accent cursor-pointer"
                      aria-label="Decrease partners"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="w-7 text-center text-[13px] font-medium tabular-nums">
                      {settings.partnersCapital.partnerCount}
                    </span>
                    <button
                      type="button"
                      onClick={() => updatePartnersCapital({ partnerCount: Math.min(partnersCapitalLimits.partnerCount.max, settings.partnersCapital.partnerCount + 1) })}
                      className="h-7 w-7 inline-flex items-center justify-center rounded-md border border-border hover:bg-accent cursor-pointer"
                      aria-label="Increase partners"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </SettingRow>

                <div className="space-y-1.5">
                  <span className="text-[12px] font-medium text-muted-foreground">Partner Classes</span>
                  <div className="space-y-1.5">
                    {settings.partnersCapital.partnerClasses.map((cls, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-[12px] text-muted-foreground w-16 shrink-0">
                          Partner {String.fromCharCode(65 + i)}
                        </span>
                        <Input
                          value={cls}
                          onChange={(e) => {
                            const next = [...settings.partnersCapital.partnerClasses];
                            next[i] = e.target.value;
                            updatePartnersCapital({ partnerClasses: next });
                          }}
                          className="h-7 text-[12px] rounded-md flex-1"
                          placeholder="General / Limited / GP"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <SettingRow label="Allocation Method">
                  <Select
                    value={settings.partnersCapital.allocationMethod}
                    onValueChange={(v) => updatePartnersCapital({ allocationMethod: v as "equal" | "ownership" | "custom" })}
                  >
                    <SelectTrigger className="w-[120px] h-8 text-[13px] rounded-lg"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equal">Equal Split</SelectItem>
                      <SelectItem value="ownership">By Ownership %</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </SettingRow>
              </div>
            </div>

            {/* Display */}
            <div className="rounded-md border border-border/60">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-border/60 bg-muted/30">
                <LayoutGrid size={13} style={{ color: "#1c63a6" }} />
                <span className="text-[13px] font-semibold text-foreground">Display</span>
              </div>
              <div className="px-3 py-2.5 space-y-2.5">
                {settings.partnersCapital.entityType === "Partnership" ? (
                  <>
                    <SettingRow label="Layout Mode">
                      <Select
                        value={settings.partnersCapital.layoutMode}
                        onValueChange={(v) =>
                          updatePartnersCapital({
                            layoutMode: v as "auto" | "forceColumns" | "forceRows" | "forceClassSummary",
                          })
                        }
                      >
                        <SelectTrigger className="w-[180px] h-8 text-[13px] rounded-lg"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">Auto</SelectItem>
                          <SelectItem value="forceColumns">Force Individual Columns</SelectItem>
                          <SelectItem value="forceRows">Force Individual Rows</SelectItem>
                          <SelectItem value="forceClassSummary">Force Class Summary</SelectItem>
                        </SelectContent>
                      </Select>
                    </SettingRow>

                    {settings.partnersCapital.layoutMode === "auto" && (
                      <>
                        <SettingRow label="Columns → Rows threshold">
                          <Select
                            value={String(settings.partnersCapital.autoSwitchColumnsToRows)}
                            onValueChange={(v) =>
                              updatePartnersCapital({ autoSwitchColumnsToRows: parseInt(v, 10) })
                            }
                          >
                            <SelectTrigger className="w-[110px] h-8 text-[13px] rounded-lg"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="5">5</SelectItem>
                              <SelectItem value="8">8</SelectItem>
                              <SelectItem value="10">10</SelectItem>
                              <SelectItem value="15">15</SelectItem>
                              <SelectItem value="-1">Custom…</SelectItem>
                            </SelectContent>
                          </Select>
                        </SettingRow>
                        {settings.partnersCapital.autoSwitchColumnsToRows < 0 ||
                        ![5, 8, 10, 15].includes(settings.partnersCapital.autoSwitchColumnsToRows) ? (
                          <div className="flex flex-col items-end gap-1">
                            <Input
                              type="number"
                              min={partnersCapitalLimits.columnsToRows.min}
                              max={partnersCapitalLimits.columnsToRows.max}
                              value={
                                settings.partnersCapital.autoSwitchColumnsToRows < 0
                                  ? ""
                                  : settings.partnersCapital.autoSwitchColumnsToRows
                              }
                              onChange={(e) => {
                                const raw = e.target.value;
                                if (raw === "") {
                                  updatePartnersCapital({ autoSwitchColumnsToRows: -1 });
                                  return;
                                }
                                const n = parseInt(raw, 10);
                                updatePartnersCapital({
                                  autoSwitchColumnsToRows: Number.isFinite(n) ? n : -1,
                                });
                              }}
                              placeholder={`Custom (${partnersCapitalLimits.columnsToRows.min}–${partnersCapitalLimits.columnsToRows.max})`}
                              aria-invalid={!!pcErrors.autoSwitchColumnsToRows}
                              className={`w-[140px] h-8 text-[13px] rounded-lg ${pcErrors.autoSwitchColumnsToRows ? errorRingClass : ""}`}
                            />
                            {pcErrors.autoSwitchColumnsToRows && (
                              <span className="text-[11px] text-destructive font-medium">
                                {pcErrors.autoSwitchColumnsToRows}
                              </span>
                            )}
                          </div>
                        ) : null}

                        <SettingRow label="Rows → Class Summary threshold">
                          <Select
                            value={String(settings.partnersCapital.autoSwitchRowsToClassSummary)}
                            onValueChange={(v) =>
                              updatePartnersCapital({ autoSwitchRowsToClassSummary: parseInt(v, 10) })
                            }
                          >
                            <SelectTrigger className="w-[110px] h-8 text-[13px] rounded-lg"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="25">25</SelectItem>
                              <SelectItem value="50">50</SelectItem>
                              <SelectItem value="75">75</SelectItem>
                              <SelectItem value="100">100</SelectItem>
                              <SelectItem value="-1">Custom…</SelectItem>
                            </SelectContent>
                          </Select>
                        </SettingRow>
                        {settings.partnersCapital.autoSwitchRowsToClassSummary < 0 ||
                        ![25, 50, 75, 100].includes(settings.partnersCapital.autoSwitchRowsToClassSummary) ? (
                          <div className="flex flex-col items-end gap-1">
                            <Input
                              type="number"
                              min={partnersCapitalLimits.rowsToClassSummary.min}
                              max={partnersCapitalLimits.rowsToClassSummary.max}
                              value={
                                settings.partnersCapital.autoSwitchRowsToClassSummary < 0
                                  ? ""
                                  : settings.partnersCapital.autoSwitchRowsToClassSummary
                              }
                              onChange={(e) => {
                                const raw = e.target.value;
                                if (raw === "") {
                                  updatePartnersCapital({ autoSwitchRowsToClassSummary: -1 });
                                  return;
                                }
                                const n = parseInt(raw, 10);
                                updatePartnersCapital({
                                  autoSwitchRowsToClassSummary: Number.isFinite(n) ? n : -1,
                                });
                              }}
                              placeholder={`Custom (${partnersCapitalLimits.rowsToClassSummary.min}–${partnersCapitalLimits.rowsToClassSummary.max})`}
                              aria-invalid={!!pcErrors.autoSwitchRowsToClassSummary}
                              className={`w-[140px] h-8 text-[13px] rounded-lg ${pcErrors.autoSwitchRowsToClassSummary ? errorRingClass : ""}`}
                            />
                            {pcErrors.autoSwitchRowsToClassSummary && (
                              <span className="text-[11px] text-destructive font-medium">
                                {pcErrors.autoSwitchRowsToClassSummary}
                              </span>
                            )}
                          </div>
                        ) : null}
                      </>
                    )}

                    <SettingRow label="Show Interest % row">
                      <Switch
                        checked={settings.partnersCapital.showInterestPercent}
                        onCheckedChange={(v) => updatePartnersCapital({ showInterestPercent: v })}
                      />
                    </SettingRow>

                    <SettingRow label="Show Partner Name">
                      <Select
                        value={settings.partnersCapital.partnerNameMode}
                        onValueChange={(v) =>
                          updatePartnersCapital({
                            partnerNameMode: v as "fullName" | "initials" | "code" | "custom",
                          })
                        }
                      >
                        <SelectTrigger className="w-[140px] h-8 text-[13px] rounded-lg"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fullName">Full Name</SelectItem>
                          <SelectItem value="initials">Initials</SelectItem>
                          <SelectItem value="code">Code</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </SettingRow>
                  </>
                ) : null}

                <SettingRow label="Show Total Column">
                  <Switch
                    checked={settings.partnersCapital.showTotalColumn}
                    onCheckedChange={(v) => updatePartnersCapital({ showTotalColumn: v })}
                  />
                </SettingRow>
                <SettingRow label="Compact Rows">
                  <Switch
                    checked={settings.partnersCapital.compactRows}
                    onCheckedChange={(v) => updatePartnersCapital({ compactRows: v })}
                  />
                </SettingRow>
              </div>
            </div>

            {/* Partner Configuration — Partnership only */}
            {settings.partnersCapital.entityType === "Partnership" && (
              <div className="rounded-md border border-border/60">
                <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border/60 bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Settings2 size={13} style={{ color: "#1c63a6" }} />
                    <span className="text-[13px] font-semibold text-foreground">Partner Configuration</span>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                        {partnersCapitalPreviewImpact ? (
                          <Eye size={12} className="text-primary" />
                        ) : (
                          <EyeOff size={12} className="text-muted-foreground" />
                        )}
                        <span
                          className={`text-[11px] font-medium ${
                            partnersCapitalPreviewImpact ? "text-primary" : "text-muted-foreground"
                          }`}
                        >
                          Preview impact
                        </span>
                        <Switch
                          checked={partnersCapitalPreviewImpact}
                          onCheckedChange={setPartnersCapitalPreviewImpact}
                          className="scale-75 origin-right"
                          aria-label="Toggle preview impact highlights"
                        />
                      </label>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="text-[11px] max-w-[220px]">
                      Highlights regions of the statement driven by Partner Classes, Allocation Method and Deficit Handling — without saving.
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="px-3 py-2.5 space-y-2.5">
                  {!pcValidation.valid && (
                    <div
                      role="alert"
                      className="flex items-start gap-1.5 rounded-md border border-destructive/40 bg-destructive/10 px-2.5 py-1.5"
                    >
                      <Info size={12} className="shrink-0 mt-0.5 text-destructive" />
                      <span className="text-[11px] text-destructive font-medium leading-snug">
                        Fix highlighted fields before saving.
                      </span>
                    </div>
                  )}

                  <div className="flex flex-col gap-1">
                    <SettingRow label="Number of Partners">
                      <Input
                        type="number"
                        min={partnersCapitalLimits.partnerCount.min}
                        max={partnersCapitalLimits.partnerCount.max}
                        value={settings.partnersCapital.partnerCount}
                        onChange={(e) => {
                          const raw = e.target.value;
                          // Allow invalid intermediate values into state so validation can flag them.
                          const n = parseInt(raw, 10);
                          updatePartnersCapital({
                            partnerCount: Number.isFinite(n) ? n : 0,
                          });
                        }}
                        aria-invalid={!!pcErrors.partnerCount}
                        className={`w-[110px] h-8 text-[13px] rounded-lg ${pcErrors.partnerCount ? errorRingClass : ""}`}
                      />
                    </SettingRow>
                    {pcErrors.partnerCount && (
                      <span className="text-[11px] text-destructive font-medium self-end">
                        {pcErrors.partnerCount}
                      </span>
                    )}
                  </div>

                  <SettingRow label="Partner Classes">
                    <Select
                      value={settings.partnersCapital.partnerClassesPreset}
                      onValueChange={(v) => {
                        const preset = v as "single" | "generalLimited" | "custom";
                        const count = settings.partnersCapital.partnerCount;
                        let classes = settings.partnersCapital.partnerClasses;
                        if (preset === "single") {
                          classes = Array(count).fill("General");
                        } else if (preset === "generalLimited") {
                          classes = Array.from({ length: count }, (_, i) =>
                            i % 2 === 0 ? "General" : "Limited",
                          );
                        } else if (preset === "custom") {
                          // Map any non-roster assignments to the first available class.
                          const roster = settings.partnersCapital.customClassLabels;
                          const fallback = roster[0] ?? "General";
                          classes = Array.from({ length: count }, (_, i) => {
                            const cur = settings.partnersCapital.partnerClasses[i];
                            return cur && roster.includes(cur) ? cur : fallback;
                          });
                        }
                        updatePartnersCapital({ partnerClassesPreset: preset, partnerClasses: classes });
                      }}
                    >
                      <SelectTrigger className="w-[160px] h-8 text-[13px] rounded-lg"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Single Class</SelectItem>
                        <SelectItem value="generalLimited">General + Limited</SelectItem>
                        <SelectItem value="custom">Custom Classes</SelectItem>
                      </SelectContent>
                    </Select>
                  </SettingRow>

                  {settings.partnersCapital.partnerClassesPreset === "custom" && (
                    <div className="rounded-md border border-border/60 bg-muted/20 p-2.5 space-y-2.5">
                      {/* Class roster */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[12px] font-medium text-muted-foreground">
                            Class Labels
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const labels = [
                                ...settings.partnersCapital.customClassLabels,
                                `Class ${String.fromCharCode(
                                  65 + settings.partnersCapital.customClassLabels.length,
                                )}`,
                              ];
                              updatePartnersCapital({ customClassLabels: labels });
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-foreground hover:text-primary cursor-pointer"
                          >
                            <Plus size={11} /> Add class
                          </button>
                        </div>
                        <div className="space-y-1.5">
                          {settings.partnersCapital.customClassLabels.map((label, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="text-[11px] text-muted-foreground w-12 shrink-0 tabular-nums">
                                #{idx + 1}
                              </span>
                              <Input
                                value={label}
                                onChange={(e) => {
                                  const oldLabel = label;
                                  const next = [...settings.partnersCapital.customClassLabels];
                                  next[idx] = e.target.value;
                                  // Cascade rename to any partner currently assigned to oldLabel.
                                  const reassigned = settings.partnersCapital.partnerClasses.map(
                                    (c) => (c === oldLabel ? e.target.value : c),
                                  );
                                  updatePartnersCapital({
                                    customClassLabels: next,
                                    partnerClasses: reassigned,
                                  });
                                }}
                                className="h-7 text-[12px] rounded-md flex-1"
                                placeholder="e.g. General / Limited / Class A"
                              />
                              <button
                                type="button"
                                disabled={settings.partnersCapital.customClassLabels.length <= 1}
                                onClick={() => {
                                  const removed = label;
                                  const next = settings.partnersCapital.customClassLabels.filter(
                                    (_, i) => i !== idx,
                                  );
                                  const fallback = next[0] ?? "General";
                                  const reassigned = settings.partnersCapital.partnerClasses.map(
                                    (c) => (c === removed ? fallback : c),
                                  );
                                  updatePartnersCapital({
                                    customClassLabels: next,
                                    partnerClasses: reassigned,
                                  });
                                }}
                                className="h-7 w-7 inline-flex items-center justify-center rounded-md border border-border hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                aria-label="Remove class"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Per-partner class assignment */}
                      <div className="space-y-1.5 border-t border-border/60 pt-2.5">
                        <span className="text-[12px] font-medium text-muted-foreground">
                          Assign Class per Partner
                        </span>
                        <div className="space-y-1.5">
                          {Array.from({
                            length: Math.max(
                              0,
                              Math.min(
                                settings.partnersCapital.partnerCount,
                                settings.partnersCapital.partnerClasses.length,
                              ),
                            ),
                          }).map((_, i) => {
                            const current = settings.partnersCapital.partnerClasses[i] ?? "";
                            const inRoster =
                              settings.partnersCapital.customClassLabels.includes(current);
                            return (
                              <div key={i} className="flex items-center gap-2">
                                <span className="text-[12px] text-muted-foreground w-16 shrink-0">
                                  Partner {String.fromCharCode(65 + i)}
                                </span>
                                <Select
                                  value={inRoster ? current : ""}
                                  onValueChange={(v) => {
                                    const next = [...settings.partnersCapital.partnerClasses];
                                    next[i] = v;
                                    updatePartnersCapital({ partnerClasses: next });
                                  }}
                                >
                                  <SelectTrigger className="h-7 text-[12px] rounded-md flex-1">
                                    <SelectValue placeholder="Select class…" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {settings.partnersCapital.customClassLabels.map((lab, li) => (
                                      <SelectItem key={li} value={lab}>
                                        {lab}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  <SettingRow label="Profit/Loss Allocation">
                    <Select
                      value={settings.partnersCapital.profitLossMethod}
                      onValueChange={(v) =>
                        updatePartnersCapital({
                          profitLossMethod: v as
                            | "proRata"
                            | "fixed"
                            | "customPerPartner"
                            | "perAgreement",
                        })
                      }
                    >
                      <SelectTrigger className="w-[160px] h-8 text-[13px] rounded-lg"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="proRata">Pro-rata %</SelectItem>
                        <SelectItem value="fixed">Fixed amounts</SelectItem>
                        <SelectItem value="customPerPartner">Custom per partner</SelectItem>
                        <SelectItem value="perAgreement">Per agreement</SelectItem>
                      </SelectContent>
                    </Select>
                  </SettingRow>

                  <SettingRow label="Allocation % editable per line">
                    <Switch
                      checked={settings.partnersCapital.allocationEditablePerLine}
                      onCheckedChange={(v) => updatePartnersCapital({ allocationEditablePerLine: v })}
                    />
                  </SettingRow>

                  <SettingRow label="Allow unequal distributions">
                    <Switch
                      checked={settings.partnersCapital.allowUnequalDistributions}
                      onCheckedChange={(v) => updatePartnersCapital({ allowUnequalDistributions: v })}
                    />
                  </SettingRow>

                  <SettingRow label="Deficit account handling">
                    <Select
                      value={settings.partnersCapital.deficitHandling}
                      onValueChange={(v) =>
                        updatePartnersCapital({ deficitHandling: v as "highlight" | "warn" | "block" })
                      }
                    >
                      <SelectTrigger className="w-[140px] h-8 text-[13px] rounded-lg"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="highlight">Highlight</SelectItem>
                        <SelectItem value="warn">Warn</SelectItem>
                        <SelectItem value="block">Block</SelectItem>
                      </SelectContent>
                    </Select>
                  </SettingRow>
                </div>
              </div>
            )}

            {/* Line Items */}
            <div className="rounded-md border border-border/60">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-border/60 bg-muted/30">
                <ListChecks size={13} style={{ color: "#1c63a6" }} />
                <span className="text-[13px] font-semibold text-foreground">Line Items</span>
              </div>
              <div className="px-3 py-2.5 space-y-2.5">
                {(["capitalContributions", "netIncomeAllocation", "drawings", "guaranteedPayments"] as const).map((key) => {
                  const item = settings.partnersCapital.lineItems[key];
                  return (
                    <div key={key} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <Input
                          value={item.label}
                          onChange={(e) =>
                            updatePartnersCapital({
                              lineItems: {
                                ...settings.partnersCapital.lineItems,
                                [key]: { ...item, label: e.target.value },
                              },
                            })
                          }
                          className="h-7 text-[12px] rounded-md flex-1"
                        />
                        <Switch
                          checked={item.visible}
                          onCheckedChange={(v) =>
                            updatePartnersCapital({
                              lineItems: {
                                ...settings.partnersCapital.lineItems,
                                [key]: { ...item, visible: v },
                              },
                            })
                          }
                        />
                      </div>
                    </div>
                  );
                })}

                <div className="border-t border-border pt-2.5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12px] font-medium text-muted-foreground">Custom Rows</span>
                    <button
                      type="button"
                      onClick={() =>
                        updatePartnersCapital({
                          customRows: [
                            ...settings.partnersCapital.customRows,
                            {
                              id: `custom-${Date.now()}`,
                              label: "Custom row",
                              section: "additions",
                            },
                          ],
                        })
                      }
                      className="h-7 px-2 inline-flex items-center gap-1 rounded-md border border-border hover:bg-accent text-[12px] cursor-pointer"
                    >
                      <Plus size={12} /> Add row
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {settings.partnersCapital.customRows.map((row) => (
                      <div key={row.id} className="flex items-center gap-1.5">
                        <Input
                          value={row.label}
                          onChange={(e) =>
                            updatePartnersCapital({
                              customRows: settings.partnersCapital.customRows.map((r) =>
                                r.id === row.id ? { ...r, label: e.target.value } : r,
                              ),
                            })
                          }
                          className="h-7 text-[12px] rounded-md flex-1"
                        />
                        <Select
                          value={row.section}
                          onValueChange={(v) =>
                            updatePartnersCapital({
                              customRows: settings.partnersCapital.customRows.map((r) =>
                                r.id === row.id ? { ...r, section: v as "additions" | "deductions" } : r,
                              ),
                            })
                          }
                        >
                          <SelectTrigger className="w-[100px] h-7 text-[12px] rounded-md"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="additions">Add</SelectItem>
                            <SelectItem value="deductions">Deduct</SelectItem>
                          </SelectContent>
                        </Select>
                        <button
                          type="button"
                          onClick={() =>
                            updatePartnersCapital({
                              customRows: settings.partnersCapital.customRows.filter((r) => r.id !== row.id),
                            })
                          }
                          className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-accent text-muted-foreground cursor-pointer"
                          aria-label="Remove custom row"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Supporting Schedule */}
            <div className="rounded-md border border-border/60">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-border/60 bg-muted/30">
                <Table2 size={13} style={{ color: "#1c63a6" }} />
                <span className="text-[13px] font-semibold text-foreground">Supporting Schedule</span>
              </div>
              <div className="px-3 py-2.5 space-y-2.5">
                <SettingRow label="Auto-generate">
                  <Switch
                    checked={settings.partnersCapital.scheduleAutoGenerate}
                    onCheckedChange={(v) => updatePartnersCapital({ scheduleAutoGenerate: v })}
                  />
                </SettingRow>
                {settings.partnersCapital.scheduleAutoGenerate && (
                  <>
                    <SettingRow label="Grouping">
                      <Select
                        value={settings.partnersCapital.scheduleGrouping}
                        onValueChange={(v) =>
                          updatePartnersCapital({ scheduleGrouping: v as "byPartner" | "byClass" | "byLineItem" })
                        }
                      >
                        <SelectTrigger className="w-[140px] h-8 text-[13px] rounded-lg"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="byPartner">By Partner</SelectItem>
                          <SelectItem value="byClass">By Partner Class</SelectItem>
                          <SelectItem value="byLineItem">By Line Item</SelectItem>
                        </SelectContent>
                      </Select>
                    </SettingRow>
                    <SettingRow label="Pagination">
                      <Switch
                        checked={settings.partnersCapital.schedulePaginate}
                        onCheckedChange={(v) => updatePartnersCapital({ schedulePaginate: v })}
                      />
                    </SettingRow>
                  </>
                )}
              </div>
            </div>
          </InlineAccordion>
        )}

      </div>
    </motion.div>
  );
};

/**
 * Save button for the FS edit toolbar.
 * Lives inside the LayoutSettingsProvider so it can read partners-capital
 * settings and block saving when validation fails. When the active doc is not
 * the partners-capital statement, validation is skipped.
 */
const PartnersCapitalSaveButton = ({
  enabled,
  activeDocKey,
  onRequestSave,
}: {
  enabled: boolean;
  activeDocKey?: string;
  onRequestSave: () => void;
}) => {
  const { settings } = useLayoutSettings();
  const isPC = activeDocKey === "partners-capital";
  const validation = isPC ? validatePartnersCapital(settings.partnersCapital) : null;
  const blocked = !!validation && !validation.valid;
  const canClick = enabled && !blocked;

  const handleClick = () => {
    if (!enabled) return;
    if (blocked && validation) {
      const first = validation.messages[0] || "Fix the highlighted fields before saving.";
      toast.error("Can't save Template Settings", {
        description: first,
      });
      return;
    }
    onRequestSave();
  };

  return (
    <motion.button
      className="h-9 px-3 rounded-[8px] flex items-center gap-1.5 text-sm font-medium overflow-hidden"
      style={{
        background: canClick ? "#1c63a6" : "hsl(220 20% 85%)",
        color: canClick ? "#fff" : "hsl(220 15% 60%)",
        border: "1px solid transparent",
        cursor: canClick ? "pointer" : "not-allowed",
        opacity: canClick ? 1 : 0.7,
        transition: "background 0.2s ease, color 0.2s ease, opacity 0.2s ease",
      }}
      whileHover={canClick ? { background: "#174f87", scale: 1.02 } : {}}
      whileTap={canClick ? { scale: 0.97 } : {}}
      onClick={handleClick}
      title={
        blocked
          ? validation?.messages[0] || "Fix highlighted fields to enable saving"
          : enabled
          ? "Save changes"
          : "No changes to save"
      }
      aria-disabled={!canClick}
    >
      <Save size={16} />
      Save
    </motion.button>
  );
};

interface TemplatePreviewProps {
  selectedTemplate: string | null;
  isMyTemplates?: boolean;
  onCollapseSidebar?: (collapsed: boolean) => void;
  onPublish?: (templateName: string) => void;
  onUnpublish?: (templateName: string) => void;
  isPublished?: boolean;
}

const TemplatePreview = ({ selectedTemplate, isMyTemplates = false, onCollapseSidebar, onPublish, onUnpublish, isPublished = false }: TemplatePreviewProps) => {
  const initialDocs = getDocsForTemplate(selectedTemplate);
  const [docs, setDocs] = useState<DocItem[]>(initialDocs);
  const [activeDoc, setActiveDoc] = useState(1);
  const [navCollapsed, setNavCollapsed] = useState(false);
  const [hoveredDoc, setHoveredDoc] = useState<number | null>(null);
  const [editingDoc, setEditingDoc] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [fsEditMode, setFsEditMode] = useState(false);
  const [fsHasChanges, setFsHasChanges] = useState(false);
  const [fsSaved, setFsSaved] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [showPublishedEditWarning, setShowPublishedEditWarning] = useState(false);
  const [layoutSettingsOpen, setLayoutSettingsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteReplacement, setDeleteReplacement] = useState<string>("");
  const prevEditMode = useRef(false);
  const title = getTemplateTitleForHeader(selectedTemplate);
  const prevTemplate = useRef(selectedTemplate);

  if (selectedTemplate !== prevTemplate.current) {
    prevTemplate.current = selectedTemplate;
    const newDocs = getDocsForTemplate(selectedTemplate);
    setDocs(newDocs);
    setActiveDoc(1);
  }

  const activeDocItem = docs.find((d) => d.id === activeDoc && !d.hidden);

  // Determine if active doc is a financial statement (editable)
  const nonEditableKeys = ["cover", "toc", "compilation", "placeholder"];
  const isFS = activeDocItem ? !nonEditableKeys.includes(activeDocItem.componentKey) && !activeDocItem.disabled : false;
  const isEditMode = fsEditMode && isFS;

  // When entering edit mode, collapse main LHS sidebar, keep FS docs open, open layout settings
  if (isEditMode && !prevEditMode.current) {
    prevEditMode.current = true;
    setNavCollapsed(false); // Keep FS Docs panel open
    setLayoutSettingsOpen(true);
    onCollapseSidebar?.(true); // Collapse main LHS sidebar
  }
  if (!isEditMode && prevEditMode.current) {
    prevEditMode.current = false;
    onCollapseSidebar?.(false); // Restore main LHS sidebar
  }

  const toggleHidden = useCallback((id: number) => {
    setDocs((prev) =>
      prev.map((d) => (d.id === id ? { ...d, hidden: !d.hidden } : d))
    );
  }, []);

  const startEditing = useCallback((doc: DocItem) => {
    setEditingDoc(doc.id);
    setEditValue(doc.label);
  }, []);

  const confirmEdit = useCallback(() => {
    if (editingDoc !== null && editValue.trim()) {
      setDocs((prev) =>
        prev.map((d) => (d.id === editingDoc ? { ...d, label: editValue.trim() } : d))
      );
    }
    setEditingDoc(null);
    setEditValue("");
  }, [editingDoc, editValue]);

  const cancelEdit = useCallback(() => {
    setEditingDoc(null);
    setEditValue("");
  }, []);

  return (
    <LayoutSettingsProvider>
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-muted/30">
        {/* Top header bar */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-border bg-background">
          {isEditMode ? (
            <>
              <div className="flex items-center gap-2">
                <motion.button
                  onClick={() => { setFsEditMode(false); setFsHasChanges(false); setFsSaved(false); setLayoutSettingsOpen(false); }}
                  className="p-1 rounded-[8px] hover:bg-accent transition-colors cursor-pointer"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ArrowLeft size={18} className="text-foreground" />
                </motion.button>
                <h2 className="text-base font-bold text-foreground">Edit {activeDocItem?.label || "Document"}</h2>
                {isPublished ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={{ background: "hsl(142 60% 92%)", color: "hsl(142 60% 30%)", border: "1px solid hsl(142 60% 80%)" }}>
                    <BadgeCheck size={13} />
                    Published
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={{ background: "hsl(220 20% 93%)", color: "hsl(220 15% 45%)", border: "1px solid hsl(220 20% 85%)" }}>
                    <FileText size={13} />
                    Draft
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <motion.button
                  onClick={() => { setFsEditMode(false); setFsHasChanges(false); setFsSaved(false); setLayoutSettingsOpen(false); }}
                  className="h-9 px-3 rounded-[8px] flex items-center gap-1.5 text-sm font-medium cursor-pointer"
                  style={{ color: "hsl(0 72% 51%)", border: "1px solid hsl(0 72% 51% / 0.3)", background: "hsl(0 72% 51% / 0.06)" }}
                  whileHover={{ background: "hsl(0 72% 51% / 0.12)", scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <X size={16} />
                  Cancel
                </motion.button>
                <PartnersCapitalSaveButton
                  enabled={fsHasChanges}
                  activeDocKey={activeDocItem?.componentKey}
                  onRequestSave={() => setShowSaveDialog(true)}
                />
                <motion.button
                  className="h-9 px-3 rounded-[8px] flex items-center gap-1.5 text-sm font-medium overflow-hidden"
                  style={{
                    background: fsSaved && !fsHasChanges ? "hsl(142 60% 40%)" : "hsl(220 20% 85%)",
                    color: fsSaved && !fsHasChanges ? "#fff" : "hsl(220 15% 60%)",
                    border: "1px solid transparent",
                    cursor: fsSaved && !fsHasChanges ? "pointer" : "not-allowed",
                    opacity: fsSaved && !fsHasChanges ? 1 : 0.7,
                    transition: "background 0.2s ease, color 0.2s ease, opacity 0.2s ease",
                  }}
                  whileHover={fsSaved && !fsHasChanges ? { background: "hsl(142 60% 34%)", scale: 1.02 } : {}}
                  whileTap={fsSaved && !fsHasChanges ? { scale: 0.97 } : {}}
                  onClick={() => { if (fsSaved && !fsHasChanges) { setShowPublishDialog(true); } }}
                >
                  <Upload size={16} />
                  Publish
                </motion.button>
                <motion.button
                  onClick={() => setLayoutSettingsOpen(prev => !prev)}
                  className="h-9 px-3 rounded-[8px] flex items-center gap-1.5 text-sm font-medium cursor-pointer border border-border hover:bg-accent transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  title="Layout Settings"
                >
                  <SlidersHorizontal size={16} />
                  Layout
                </motion.button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-foreground">
                  {title}
                </h2>
                {isPublished ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={{ background: "hsl(142 60% 92%)", color: "hsl(142 60% 30%)", border: "1px solid hsl(142 60% 80%)" }}>
                    <BadgeCheck size={13} />
                    Published
                  </span>
                ) : isMyTemplates ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={{ background: "hsl(220 20% 93%)", color: "hsl(220 15% 45%)", border: "1px solid hsl(220 20% 85%)" }}>
                    <FileText size={13} />
                    Draft
                  </span>
                ) : null}
              </div>
              {isMyTemplates ? (
                <div className="flex items-center gap-2">
                  {isPublished && (
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-foreground border border-border rounded-[12px] hover:bg-accent transition-colors"
                      onClick={() => setHistoryOpen(true)}
                      title="Version history"
                    >
                      <History size={14} />
                      History
                    </motion.button>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-foreground border border-border rounded-[12px] hover:bg-accent transition-colors"
                    onClick={() => {
                      if (isPublished) {
                        setShowPublishedEditWarning(true);
                        return;
                      }
                      if (isFS) {
                        setFsEditMode(true);
                      } else {
                        const firstEditable = docs.find(d => !d.hidden && !d.disabled && !nonEditableKeys.includes(d.componentKey));
                        if (firstEditable) {
                          setActiveDoc(firstEditable.id);
                          setFsEditMode(true);
                        }
                      }
                    }}
                    title="Edit template"
                  >
                    <Pencil size={14} />
                    Edit
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-foreground border border-border rounded-[12px] hover:bg-accent transition-colors"
                    onClick={() => {}}
                    title="Duplicate template"
                  >
                    <Copy size={14} />
                    Duplicate
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-destructive border border-destructive/30 rounded-[12px] hover:bg-destructive/10 transition-colors"
                    onClick={() => {
                      if (isPublished) {
                        setDeleteReplacement("");
                        setShowDeleteDialog(true);
                      } else {
                        toast.success(`"${title}" has been deleted`, { duration: 4000 });
                      }
                    }}
                    title="Delete template"
                  >
                    <Trash2 size={14} />
                    Delete
                  </motion.button>
                </div>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white"
                  style={{ borderRadius: 12, backgroundColor: "#1C63A6" }}
                  onClick={() => setCopyModalOpen(true)}
                >
                  <Plus size={16} />
                  My Templates
                </motion.button>
              )}
            </>
          )}
        </div>

        {/* Content area */}
        <div className="flex flex-1 min-h-0 overflow-hidden items-stretch">
          {/* Left Navigator */}
          <AnimatePresence mode="wait" initial={false}>
            {navCollapsed ? (
              <motion.div
                key="collapsed"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 56, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                className="shrink-0 flex flex-col overflow-hidden"
                style={{
                  borderTopRightRadius: 16,
                  borderBottomRightRadius: 16,
                  background: "linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--muted) / 0.3) 100%)",
                  borderRight: "1px solid hsl(var(--border))",
                  boxShadow: "2px 0 12px hsl(var(--foreground) / 0.04)",
                }}
              >
                <div className="flex items-center justify-center pt-4 pb-3">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setNavCollapsed(false)}
                    className="p-1.5 rounded-md hover:bg-accent transition-colors"
                    title="Expand navigator"
                  >
                    <ChevronRight size={16} className="text-muted-foreground" />
                  </motion.button>
                </div>
                <div className="flex flex-col items-center gap-1 px-2 overflow-y-auto flex-1 pb-3">
                  <TooltipProvider delayDuration={200}>
                    {docs.map((doc) => (
                      <Tooltip key={doc.id}>
                        <TooltipTrigger asChild>
                          <motion.button
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => !doc.disabled && !doc.hidden && setActiveDoc(doc.id)}
                            disabled={doc.disabled || doc.hidden}
                            className={`flex items-center justify-center rounded-lg transition-all duration-200 ${
                              doc.hidden
                                ? "opacity-20 cursor-not-allowed"
                                : activeDoc === doc.id
                                ? "bg-primary text-primary-foreground shadow-md"
                                : doc.disabled
                                ? "opacity-40 cursor-not-allowed"
                                : "hover:bg-accent text-muted-foreground hover:text-foreground"
                            }`}
                            style={{ width: 36, height: 36 }}
                          >
                            <span className="text-xs font-bold">{doc.id}</span>
                          </motion.button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="text-xs max-w-[200px]">
                          <p>{doc.label}{doc.hidden ? " (hidden)" : ""}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </TooltipProvider>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="expanded"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 290, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                className="shrink-0 flex flex-col overflow-hidden"
                style={{
                  borderTopRightRadius: 16,
                  borderBottomRightRadius: 16,
                  background: "linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--muted) / 0.15) 100%)",
                  borderRight: "1px solid hsl(var(--border))",
                  boxShadow: "2px 0 16px hsl(var(--foreground) / 0.05)",
                }}
              >
                {/* Header */}
                <div
                  className="flex items-center justify-between px-4 pt-5 pb-4"
                  style={{
                    borderBottom: "1px solid hsl(var(--border) / 0.5)",
                    background: "linear-gradient(135deg, hsl(var(--primary) / 0.04) 0%, transparent 100%)",
                    borderTopRightRadius: 16,
                  }}
                >
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-foreground tracking-tight" style={{ fontSize: 15 }}>
                      Financial Statements Docs
                    </h3>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setNavCollapsed(true)}
                    className="p-1.5 rounded-md hover:bg-accent transition-colors"
                    title="Minimize navigator"
                  >
                    <ChevronLeft size={16} className="text-muted-foreground" />
                  </motion.button>
                </div>

                {/* Doc count */}
                <div className="px-4 pt-3 pb-1">
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                    {docs.filter(d => !d.hidden).length} of {docs.length} documents visible
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto px-2.5 py-1.5">
                  <Reorder.Group
                    axis="y"
                    values={docs}
                    onReorder={setDocs}
                    className="flex flex-col gap-1"
                  >
                    {docs.map((doc) => (
                      <Reorder.Item
                        key={doc.id}
                        value={doc}
                        dragListener={false}
                        className="list-none"
                      >
                        <DocNavItem
                          doc={doc}
                          isActive={activeDoc === doc.id}
                          isHovered={hoveredDoc === doc.id}
                          isEditing={editingDoc === doc.id}
                          editValue={editValue}
                          onEditValueChange={setEditValue}
                          onStartEdit={() => startEditing(doc)}
                          onConfirmEdit={confirmEdit}
                          onCancelEdit={cancelEdit}
                          onSelect={() => !doc.disabled && !doc.hidden && setActiveDoc(doc.id)}
                          onToggleHidden={() => toggleHidden(doc.id)}
                          onMouseEnter={() => setHoveredDoc(doc.id)}
                          onMouseLeave={() => setHoveredDoc(null)}
                          dragControls
                        />
                      </Reorder.Item>
                    ))}
                  </Reorder.Group>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Right Preview Area */}
          <div className="flex-1 overflow-auto min-w-0 template-no-watermark">
            {activeDocItem ? (
              <DocumentPreviewContent
                componentKey={activeDocItem.componentKey}
                label={activeDocItem.label}
                docs={docs}
                templateName={selectedTemplate}
                isEditMode={isEditMode}
                onContentChanged={setFsHasChanges}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center h-full">
                <p className="text-muted-foreground text-sm">Select a visible document</p>
              </div>
            )}
          </div>

          {/* Inline RHS Layout Settings in edit mode */}
          {isEditMode && layoutSettingsOpen && (
            <TemplateInlineLayoutSettings
              onClose={() => setLayoutSettingsOpen(false)}
              activeDocKey={activeDocItem?.componentKey}
            />
          )}
        </div>
      </div>
      <CopyToMyTemplatesModal
        open={copyModalOpen}
        onClose={() => setCopyModalOpen(false)}
        templateName={selectedTemplate || "Template"}
        folders={[
          { code: "COMP", label: "Compilations", children: [
            { code: "COMP-S", label: "Single" },
            { code: "COMP-C", label: "Consolidated" },
          ]},
          { code: "REVW", label: "Review", children: [
            { code: "REVW-S", label: "Single" },
            { code: "REVW-C", label: "Consolidated" },
          ]},
          { code: "TAXF", label: "Tax", children: [
            { code: "TAXF-S", label: "Single" },
            { code: "TAXF-C", label: "Consolidated" },
          ]},
        ]}
        onCopy={(folderPath) => {
          console.log(`Copied "${selectedTemplate}" to folder: ${folderPath}`);
        }}
      />

      {/* Save Confirmation Dialog */}
      <AlertDialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <AlertDialogContent className="rounded-[12px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Save Changes</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to save the changes made to this template? You can continue editing after saving.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-[8px]">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-[8px]"
              style={{ background: "#1c63a6" }}
              onClick={() => { setFsHasChanges(false); setFsSaved(true); }}
            >
              Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Publish Confirmation Dialog */}
      <AlertDialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
        <AlertDialogContent className="rounded-[12px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Publish Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to publish this template? Once published, the changes will be available for use across engagements.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-[8px]">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-[8px]"
              style={{ background: "hsl(142 60% 40%)" }}
              onClick={() => {
                setFsEditMode(false);
                setFsSaved(false);
                setFsHasChanges(false);
                setLayoutSettingsOpen(false);
                if (selectedTemplate) {
                  onPublish?.(selectedTemplate);
                }
                toast.success("Template published successfully", {
                  description: "Your template is now available for use across engagements.",
                  duration: 4000,
                });
              }}
            >
              Publish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Published Edit Warning Dialog */}
      <AlertDialog open={showPublishedEditWarning} onOpenChange={setShowPublishedEditWarning}>
        <AlertDialogContent className="rounded-[12px] max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-amber-700">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
              This Template Is In Use
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm leading-relaxed space-y-2">
              <span className="block">
                This template has been <strong>published</strong> and is currently being used in one or more active engagements. Any changes you make will directly affect those engagements once saved and re-published.
              </span>
              <span className="block">
                Editing will revert this template to <strong>Draft</strong> status until it is published again. During this time, engagements will continue using the last published version.
              </span>
              <span className="block text-muted-foreground text-xs mt-1">
                If you're unsure, consider duplicating this template before making changes.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-[8px]">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-[8px]"
              style={{ background: "hsl(25 95% 53%)", color: "#fff" }}
              onClick={() => {
                // Unpublish: revert to draft
                if (selectedTemplate) {
                  onUnpublish?.(selectedTemplate);
                }
                // Enter edit mode
                if (isFS) {
                  setFsEditMode(true);
                } else {
                  const firstEditable = docs.find(d => !d.hidden && !d.disabled && !nonEditableKeys.includes(d.componentKey));
                  if (firstEditable) {
                    setActiveDoc(firstEditable.id);
                    setFsEditMode(true);
                  }
                }
                toast("Template reverted to Draft", {
                  description: "You can now make changes. Remember to save and re-publish when done.",
                  duration: 4000,
                });
              }}
            >
              Proceed to Edit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Published Template Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="rounded-[12px] max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 size={18} />
              Delete Published Template
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-sm leading-relaxed space-y-3">
                <span className="block">
                  <strong>"{title}"</strong> is currently <strong>published</strong> and is being used in one or more active engagements. Deleting it without a replacement will leave those engagements without a linked financial statement template.
                </span>
                <span className="block">
                  To proceed with the deletion, please select another published template to replace it. All active engagements currently using this template will be automatically reassigned to the replacement.
                </span>
                <div className="pt-1">
                  <label className="block text-xs font-medium text-foreground mb-1.5">
                    Replacement Template
                  </label>
                  <Select value={deleteReplacement} onValueChange={setDeleteReplacement}>
                    <SelectTrigger className="rounded-[8px] w-full">
                      <SelectValue placeholder="Select a published template..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-[8px]">
                      <SelectItem value="GAAP Compilation (C-Corp)">GAAP Compilation (C-Corp)</SelectItem>
                      <SelectItem value="GAAP Review (C-Corp)">GAAP Review (C-Corp)</SelectItem>
                      <SelectItem value="Tax Basis (C-Corp)">Tax Basis (C-Corp)</SelectItem>
                      <SelectItem value="GAAP Compilation (S-Corp)">GAAP Compilation (S-Corp)</SelectItem>
                      <SelectItem value="GAAP Review (S-Corp)">GAAP Review (S-Corp)</SelectItem>
                      <SelectItem value="GAAP Compilation (Partnership)">GAAP Compilation (Partnership)</SelectItem>
                      <SelectItem value="ASPE Compilation (Corporation)">ASPE Compilation (Corporation)</SelectItem>
                      <SelectItem value="ASPE Review (Corporation)">ASPE Review (Corporation)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <span className="block text-muted-foreground text-xs">
                  This action cannot be undone. The selected replacement will take effect immediately across all affected engagements.
                </span>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-[8px]">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-[8px] bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={!deleteReplacement}
              onClick={() => {
                if (selectedTemplate) {
                  onUnpublish?.(selectedTemplate);
                }
                toast.success(`"${title}" deleted and replaced with "${deleteReplacement}"`, {
                  description: `All active engagements have been reassigned to "${deleteReplacement}".`,
                  duration: 5000,
                });
                setShowDeleteDialog(false);
              }}
            >
              Delete & Replace
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Version History Panel */}
      <AnimatePresence>
        {historyOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 32 }}
            className="fixed top-0 right-0 h-full z-50 flex"
            style={{ width: 420 }}
          >
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/20 -z-10" onClick={() => setHistoryOpen(false)} />
            <div className="w-full h-full bg-card border-l border-border shadow-2xl flex flex-col overflow-hidden" style={{ borderTopLeftRadius: 16, borderBottomLeftRadius: 16 }}>
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <History size={18} className="text-primary" />
                  <h3 className="text-base font-bold text-foreground">Version History</h3>
                </div>
                <motion.button
                  onClick={() => setHistoryOpen(false)}
                  className="p-1.5 rounded-[8px] hover:bg-accent transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X size={16} className="text-muted-foreground" />
                </motion.button>
              </div>

              {/* Version List */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
                {[
                  { version: "v3.0", date: "Apr 15, 2026 — 2:34 PM", user: "Sarah Mitchell", isCurrent: true, note: "Updated depreciation schedules and adjusted retained earnings formatting" },
                  { version: "v2.0", date: "Apr 12, 2026 — 11:15 AM", user: "James Thornton", isCurrent: false, note: "Revised revenue recognition notes and added new disclosure sections" },
                  { version: "v1.0", date: "Apr 8, 2026 — 9:02 AM", user: "Sarah Mitchell", isCurrent: false, note: "Initial published version with standard GAAP balance sheet layout" },
                ].map((v, idx) => (
                  <motion.div
                    key={v.version}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.06 }}
                    className="relative rounded-[12px] border transition-all duration-200"
                    style={{
                      borderColor: v.isCurrent ? "hsl(142 60% 70%)" : "hsl(var(--border))",
                      background: v.isCurrent ? "hsl(142 60% 96%)" : "hsl(var(--card))",
                    }}
                  >
                    <div className="px-4 py-3.5">
                      {/* Top row: version + current badge */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-foreground">{v.version}</span>
                          {v.isCurrent && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                              style={{ background: "hsl(142 60% 88%)", color: "hsl(142 60% 28%)" }}>
                              Current
                            </span>
                          )}
                        </div>
                        {!v.isCurrent && (
                          <motion.button
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => {
                              setHistoryOpen(false);
                              toast.success(`Restored to ${v.version}`, {
                                description: `Template reverted to the version from ${v.date}.`,
                                duration: 4000,
                              });
                            }}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] text-xs font-medium border transition-colors"
                            style={{
                              color: "hsl(215 70% 45%)",
                              borderColor: "hsl(215 70% 45% / 0.3)",
                              background: "hsl(215 70% 45% / 0.06)",
                            }}
                          >
                            <RotateCcw size={12} />
                            Restore
                          </motion.button>
                        )}
                      </div>

                      {/* Note */}
                      <p className="text-[13px] text-muted-foreground leading-relaxed mb-2.5">{v.note}</p>

                      {/* User + date */}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <User size={12} />
                          {v.user}
                        </span>
                        <span>•</span>
                        <span>{v.date}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-border">
                <p className="text-xs text-muted-foreground text-center">
                  Showing all published versions of this template
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </LayoutSettingsProvider>
  );
};

/* Individual doc nav item with drag handle + hide/unhide + inline edit */
interface DocNavItemProps {
  doc: DocItem;
  isActive: boolean;
  isHovered: boolean;
  isEditing: boolean;
  editValue: string;
  onEditValueChange: (val: string) => void;
  onStartEdit: () => void;
  onConfirmEdit: () => void;
  onCancelEdit: () => void;
  onSelect: () => void;
  onToggleHidden: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  dragControls?: boolean;
}

const DocNavItem = ({
  doc,
  isActive,
  isHovered,
  isEditing,
  editValue,
  onEditValueChange,
  onStartEdit,
  onConfirmEdit,
  onCancelEdit,
  onSelect,
  onToggleHidden,
  onMouseEnter,
  onMouseLeave,
}: DocNavItemProps) => {
  const dragRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`group flex items-center gap-1.5 pl-1 pr-2 py-2 rounded-lg transition-all duration-150 cursor-pointer select-none ${
        doc.hidden
          ? "opacity-40"
          : isActive
          ? "bg-primary/6 border border-primary/20"
          : "border border-transparent hover:bg-accent/60"
      }`}
      onClick={() => { if (!isEditing) onSelect(); }}
    >
      {/* Drag handle */}
      <div
        ref={dragRef}
        className={`shrink-0 cursor-grab active:cursor-grabbing transition-opacity duration-150 ${
          isHovered && !doc.hidden ? "opacity-60" : "opacity-0"
        }`}
      >
        <GripVertical size={14} className="text-muted-foreground" />
      </div>

      {/* Number badge */}
      <span
        className={`shrink-0 flex items-center justify-center rounded-md text-[11px] font-bold transition-colors ${
          isActive && !doc.hidden
            ? "bg-primary/12 text-primary"
            : "bg-muted/80 text-muted-foreground"
        }`}
        style={{ width: 26, height: 26 }}
      >
        {doc.id}
      </span>

      {/* Label or edit input */}
      {isEditing ? (
        <div className="flex-1 flex items-center gap-1 min-w-0">
          <input
            ref={inputRef}
            autoFocus
            value={editValue}
            onChange={(e) => onEditValueChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onConfirmEdit();
              if (e.key === "Escape") onCancelEdit();
            }}
            className="flex-1 min-w-0 bg-muted/50 border border-border rounded px-1.5 py-0.5 text-foreground outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20"
            style={{ fontSize: 13 }}
            onClick={(e) => e.stopPropagation()}
          />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={(e) => { e.stopPropagation(); onConfirmEdit(); }}
            className="shrink-0 p-0.5 rounded hover:bg-accent text-primary"
          >
            <Check size={13} />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={(e) => { e.stopPropagation(); onCancelEdit(); }}
            className="shrink-0 p-0.5 rounded hover:bg-accent text-muted-foreground"
          >
            <X size={13} />
          </motion.button>
        </div>
      ) : (
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className="flex-1 leading-snug truncate transition-colors text-foreground"
                style={{
                  fontSize: 15,
                  textDecoration: doc.hidden ? "line-through" : undefined,
                  opacity: doc.disabled ? 0.5 : 1,
                  fontWeight: isActive && !doc.hidden ? 500 : 400,
                }}
              >
                {doc.label}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs max-w-[320px] whitespace-normal">
              <p>{doc.label}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Action buttons on hover */}
      {!isEditing && (
        <div className="flex items-center gap-0.5 shrink-0">
          {/* Edit button */}
          <motion.button
            initial={false}
            animate={{ opacity: isHovered && !doc.hidden ? 1 : 0 }}
            transition={{ duration: 0.1 }}
            onClick={(e) => {
              e.stopPropagation();
              onStartEdit();
            }}
            className="p-1 rounded-md hover:bg-accent transition-colors"
            title="Rename statement"
          >
            <Pencil size={12} className="text-muted-foreground" />
          </motion.button>

        </div>
      )}
    </div>
  );
};

export default TemplatePreview;

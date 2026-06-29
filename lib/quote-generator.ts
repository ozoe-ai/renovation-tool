import { WizardState, Quote } from "./types";
import { generateEstimateNo } from "./config";

/**
 * Generate a complete quote from wizard state
 */
export const generateQuote = (state: WizardState): Quote | null => {
  if (!state.customer || state.rooms.length === 0) {
    return null;
  }

  const quote: Quote = {
    customer: state.customer,
    rooms: state.rooms,
    pricing: state.pricing,
    loan: state.loan || undefined,
    meta: {
      createdAt: new Date(),
      estimateNo: generateEstimateNo(),
      version: "1.0",
    },
  };

  return quote;
};

/**
 * Export quote as JSON string
 */
export const exportQuoteAsJSON = (quote: Quote): string => {
  return JSON.stringify(quote, null, 2);
};

/**
 * Convert quote to CSV for spreadsheet export
 */
export const exportQuoteAsCSV = (quote: Quote): string => {
  const rows: string[] = [];

  // Header
  rows.push("見積書");
  rows.push(`見積番号,${quote.meta.estimateNo}`);
  rows.push(`作成日,${quote.meta.createdAt}`);
  rows.push("");

  // Customer info
  rows.push("顧客情報");
  rows.push(`顧客名,${quote.customer.name}${quote.customer.honorific}`);
  rows.push(`案件名,${quote.customer.projectName}`);
  rows.push(`取引区分,${quote.customer.segment}`);
  rows.push(`物件種別,${quote.customer.propertyType}`);
  if (quote.customer.floors) {
    rows.push(`階数,${quote.customer.floors}階建て`);
  }
  if (quote.customer.roomType) {
    rows.push(`間取り,${quote.customer.roomType}`);
  }
  rows.push("");

  // Details
  rows.push("内訳");
  rows.push("部屋,カテゴリ,金額");
  for (const room of quote.rooms) {
    for (const category of room.categories) {
      rows.push(`${room.roomName},${category.categoryName},${category.price}`);
    }
  }
  rows.push("");

  // Pricing
  rows.push("金額計算");
  rows.push(`小計,${quote.pricing.subtotal}`);
  rows.push(`税率,${Math.round(quote.pricing.taxRate * 100)}%`);
  rows.push(`消費税,${quote.pricing.tax}`);
  rows.push(`合計,${quote.pricing.total}`);

  if (quote.loan) {
    rows.push("");
    rows.push("ローン試算");
    rows.push(`借入金,${quote.loan.principal}`);
    rows.push(`頭金,${quote.loan.downPayment}`);
    rows.push(`年利率,${quote.loan.annualRate}%`);
    rows.push(`返済年数,${quote.loan.years}年`);
    rows.push(`月返済額,${quote.loan.monthlyPayment}`);
    rows.push(`総返済額,${quote.loan.totalPayment}`);
    rows.push(`総利息,${quote.loan.totalInterest}`);
  }

  return rows.join("\n");
};

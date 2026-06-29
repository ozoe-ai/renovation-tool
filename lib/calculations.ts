import { Room, Pricing, Loan, TAX_RATE, PRICE_RATES } from ".";
import { TAX_RATE as CONFIG_TAX_RATE, PRICE_RATES as CONFIG_PRICE_RATES } from "./config";

/**
 * Calculate the subtotal from all rooms and categories
 */
export const calculateSubtotal = (rooms: Room[]): number => {
  return rooms.reduce((total, room) => {
    const roomTotal = room.categories.reduce((categoryTotal, category) => {
      return categoryTotal + category.price;
    }, 0);
    return total + roomTotal;
  }, 0);
};

/**
 * Calculate pricing with rate, discount, and tax
 */
export const calculatePricing = (
  subtotal: number,
  rateType: "TOC" | "TOB" = "TOC",
  discountAmount: number = 0
): Pricing => {
  const rateValue = CONFIG_PRICE_RATES[rateType];
  const ratedSubtotal = subtotal * rateValue;
  const afterDiscount = Math.max(0, ratedSubtotal - discountAmount);
  const tax = Math.round(afterDiscount * CONFIG_TAX_RATE);
  const total = afterDiscount + tax;

  return {
    rateType,
    rateValue,
    discountAmount,
    taxRate: CONFIG_TAX_RATE,
    subtotal: Math.round(afterDiscount),
    tax,
    total,
  };
};

/**
 * Calculate loan payments using equal installment method
 */
export const calculateLoan = (
  principal: number,
  downPayment: number = 0,
  annualRate: number = 3.0,
  years: number = 20
): Loan => {
  const loanAmount = principal - downPayment;
  const monthlyRate = annualRate / 100 / 12;
  const numberOfPayments = years * 12;

  // Calculate monthly payment using formula: P * [r(1+r)^n] / [(1+r)^n - 1]
  const numerator = monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments);
  const denominator = Math.pow(1 + monthlyRate, numberOfPayments) - 1;
  const monthlyPayment = Math.round((loanAmount * numerator) / denominator);

  const totalPayment = monthlyPayment * numberOfPayments;
  const totalInterest = totalPayment - loanAmount;

  return {
    principal,
    downPayment,
    annualRate,
    years,
    monthlyPayment,
    totalPayment,
    totalInterest,
  };
};

/**
 * Format currency for display
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Format number as Japanese locale
 */
export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat("ja-JP").format(value);
};

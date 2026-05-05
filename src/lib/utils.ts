import { clsx, type ClassValue } from "clsx";
import { formatInTimeZone } from "date-fns-tz";
import { twMerge } from "tailwind-merge";

import { envConfig } from "@/lib/env/config";
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatCurrency(amountInPaise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountInPaise / 100);
}

export function toPaise(value: number | string) {
  const numericValue = typeof value === "string" ? Number(value) : value;
  return Math.round(numericValue * 100);
}

export function fromPaise(value: number) {
  return value / 100;
}

export function formatISTDate(
  value: Date | string,
  format = "dd MMM yyyy, hh:mm a"
) {
  const date = typeof value === "string" ? new Date(value) : value;
  return formatInTimeZone(date, envConfig.app.timezone, format);
}

export function buildRunningNumber(sequence: number, digits = 4) {
  return String(sequence).padStart(digits, "0");
}

export function buildBillNumber(
  shopCode: string,
  date = new Date(),
  sequence = 1
) {
  return `${shopCode}-${date.getUTCFullYear()}-${buildRunningNumber(sequence)}`;
}

export function buildPurchaseOrderNumber(
  shopCode: string,
  date = new Date(),
  sequence = 1
) {
  return `PO-${shopCode}-${date.getUTCFullYear()}-${buildRunningNumber(
    sequence
  )}`;
}

export function safeJsonParse<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function assertNonNullable<T>(
  value: T,
  message = "Expected value to be defined"
): NonNullable<T> {
  if (value == null) {
    throw new Error(message);
  }

  return value as NonNullable<T>;
}


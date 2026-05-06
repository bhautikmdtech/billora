import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPaise(paise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(paise / 100);
}

export function parsePaise(rupees: number) {
  return Math.round(rupees * 100);
}

const IST_TZ = "Asia/Kolkata";

export function formatDate(date: Date | string | number, formatStr = "dd MMM yyyy, hh:mm a") {
  const d = new Date(date);
  const zonedDate = toZonedTime(d, IST_TZ);
  return format(zonedDate, formatStr);
}

export function formatDateShort(date: Date | string | number) {
  return formatDate(date, "dd MMM yyyy");
}

export function generateSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^\w ]+/g, "")
    .replace(/ +/g, "-");
}

export function generateToken() {
  return crypto.randomUUID();
}

export function truncate(str: string, len: number) {
  if (str.length <= len) return str;
  return str.slice(0, len) + "...";
}

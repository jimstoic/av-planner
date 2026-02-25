import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Recursively parses strings that look like dates into Date objects.
 */
export function recursiveDateParse(obj: any): any {
  if (typeof obj === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(obj)) {
    return new Date(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(recursiveDateParse);
  }
  if (typeof obj === 'object' && obj !== null) {
    const result: any = {};
    for (const key in obj) {
      result[key] = recursiveDateParse(obj[key]);
    }
    return result;
  }
  return obj;
}

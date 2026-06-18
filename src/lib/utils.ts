/* General utility functions (exposes cn) */
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merges multiple class names into a single string
 * @param inputs - Array of class names
 * @returns Merged class names
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Extracts the clean UUID from a composite ID string (e.g. proj_UUID_DATE)
 * @param id - The potentially composite ID
 * @returns The clean UUID
 */
export function extractUUID(id: string): string {
  if (id.startsWith('proj_')) {
    const parts = id.split('_')
    if (parts.length >= 2) {
      return parts[1]
    }
  }
  return id
}

// Add any other utility functions here

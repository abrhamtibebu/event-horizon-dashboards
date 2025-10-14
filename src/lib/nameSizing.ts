/**
 * Utility functions for dynamic name sizing on badges
 */

export interface NameSizingOptions {
  maxWidth: number; // Maximum width available for the name
  baseFontSize: number; // Base font size for normal names
  minFontSize: number; // Minimum font size for very long names
  maxFontSize: number; // Maximum font size for short names
}

export const DEFAULT_NAME_SIZING_OPTIONS: NameSizingOptions = {
  maxWidth: 360, // Badge width minus padding
  baseFontSize: 36, // Base font size
  minFontSize: 20, // Minimum font size for very long names
  maxFontSize: 40, // Maximum font size for short names
};

/**
 * Calculate optimal font size based on name length
 * Ensures the first name fits on one line
 */
export function calculateNameFontSize(
  fullName: string,
  options: NameSizingOptions = DEFAULT_NAME_SIZING_OPTIONS
): number {
  if (!fullName || fullName.trim() === '') {
    return options.baseFontSize;
  }

  // Extract first name only
  const firstName = fullName.trim().split(' ')[0];
  const firstNameLength = firstName.length;

  // Calculate font size based on first name length
  let fontSize = options.baseFontSize;

  if (firstNameLength <= 4) {
    // Short names - can be larger
    fontSize = Math.min(options.maxFontSize, options.baseFontSize + 4);
  } else if (firstNameLength <= 8) {
    // Medium names - use base size
    fontSize = options.baseFontSize;
  } else if (firstNameLength <= 12) {
    // Long names - reduce size
    fontSize = Math.max(options.minFontSize, options.baseFontSize - 4);
  } else if (firstNameLength <= 16) {
    // Very long names - reduce more
    fontSize = Math.max(options.minFontSize, options.baseFontSize - 8);
  } else {
    // Extremely long names - use minimum size
    fontSize = options.minFontSize;
  }

  return fontSize;
}

/**
 * Calculate font size for company name based on length
 */
export function calculateCompanyFontSize(
  company: string,
  options: { baseFontSize: number; minFontSize: number; maxFontSize: number } = {
    baseFontSize: 20,
    minFontSize: 14,
    maxFontSize: 24
  }
): number {
  if (!company || company.trim() === '') {
    return options.baseFontSize;
  }

  const companyLength = company.length;
  let fontSize = options.baseFontSize;

  if (companyLength <= 10) {
    fontSize = Math.min(options.maxFontSize, options.baseFontSize + 4);
  } else if (companyLength <= 20) {
    fontSize = options.baseFontSize;
  } else if (companyLength <= 30) {
    fontSize = Math.max(options.minFontSize, options.baseFontSize - 2);
  } else {
    fontSize = options.minFontSize;
  }

  return fontSize;
}

/**
 * Calculate font size for job title based on length
 */
export function calculateJobTitleFontSize(
  jobTitle: string,
  options: { baseFontSize: number; minFontSize: number; maxFontSize: number } = {
    baseFontSize: 18,
    minFontSize: 12,
    maxFontSize: 22
  }
): number {
  if (!jobTitle || jobTitle.trim() === '') {
    return options.baseFontSize;
  }

  const jobTitleLength = jobTitle.length;
  let fontSize = options.baseFontSize;

  if (jobTitleLength <= 15) {
    fontSize = Math.min(options.maxFontSize, options.baseFontSize + 4);
  } else if (jobTitleLength <= 25) {
    fontSize = options.baseFontSize;
  } else if (jobTitleLength <= 35) {
    fontSize = Math.max(options.minFontSize, options.baseFontSize - 2);
  } else {
    fontSize = options.minFontSize;
  }

  return fontSize;
}

/**
 * Get responsive font size for any text based on length
 */
export function getResponsiveFontSize(
  text: string,
  baseFontSize: number,
  minFontSize: number = baseFontSize * 0.6,
  maxFontSize: number = baseFontSize * 1.2
): number {
  if (!text || text.trim() === '') {
    return baseFontSize;
  }

  const textLength = text.length;
  let fontSize = baseFontSize;

  if (textLength <= 10) {
    fontSize = Math.min(maxFontSize, baseFontSize + 4);
  } else if (textLength <= 20) {
    fontSize = baseFontSize;
  } else if (textLength <= 30) {
    fontSize = Math.max(minFontSize, baseFontSize - 2);
  } else if (textLength <= 40) {
    fontSize = Math.max(minFontSize, baseFontSize - 4);
  } else {
    fontSize = minFontSize;
  }

  return fontSize;
}

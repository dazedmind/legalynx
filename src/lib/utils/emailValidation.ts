// Trusted email domain list
const TRUSTED_EMAIL_DOMAINS = [
  // Major providers
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'yahoo.co.uk',
  'yahoo.fr',
  'yahoo.de',
  'yahoo.co.jp',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'msn.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'aol.com',
  'protonmail.com',
  'proton.me',
  'zoho.com',
  'yandex.com',
  'mail.com',
  'gmx.com',
  'gmx.net',

  // Business/Enterprise
  'microsoft.com',
  'apple.com',
  'ibm.com',
  'oracle.com',

  // Educational
  'edu',
  'ac.uk',
  'edu.au',
  'edu.ph',

  // Common country-specific domains
  'fastmail.com',
  'fastmail.fm',
  'hushmail.com',
  'tutanota.com',
  'tutanota.de',
  'posteo.de',
  'mailfence.com',
];

// Known temporary/disposable email domains
const DISPOSABLE_EMAIL_DOMAINS = [
  'tempmail.com',
  'throwaway.email',
  'guerrillamail.com',
  'mailinator.com',
  '10minutemail.com',
  'temp-mail.org',
  'getnada.com',
  'maildrop.cc',
  'trashmail.com',
  'fakeinbox.com',
  'sharklasers.com',
  'guerrillamail.info',
  'grr.la',
  'guerrillamail.biz',
  'guerrillamail.de',
  'spam4.me',
  'mailnesia.com',
  'tempinbox.com',
  'yopmail.com',
  'emailondeck.com',
  'discard.email',
  'mvrht.com',
  'mozej.com',
  'mytemp.email',
  'tempmail.net',
  'throwawaymail.com',
];

/**
 * Validates email format
 */
export function isValidEmailFormat(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Checks if email domain is from a trusted provider
 */
export function isTrustedEmailDomain(email: string): boolean {
  if (!isValidEmailFormat(email)) {
    return false;
  }

  const domain = email.toLowerCase().split('@')[1];

  // Check exact match
  if (TRUSTED_EMAIL_DOMAINS.includes(domain)) {
    return true;
  }

  // Check if it ends with trusted educational domains
  if (domain.endsWith('.edu') || domain.endsWith('.ac.uk') || domain.endsWith('.edu.au') || domain.endsWith('.edu.ph')) {
    return true;
  }

  return false;
}

/**
 * Checks if email is from a disposable/temporary email service
 */
export function isDisposableEmail(email: string): boolean {
  if (!isValidEmailFormat(email)) {
    return false;
  }

  const domain = email.toLowerCase().split('@')[1];
  return DISPOSABLE_EMAIL_DOMAINS.includes(domain);
}

/**
 * Comprehensive email validation
 * Returns an object with validation status and error message if invalid
 */
export function validateEmail(email: string): { isValid: boolean; error?: string } {
  if (!email || email.trim() === '') {
    return { isValid: false, error: 'Email address is required.' };
  }

  if (!isValidEmailFormat(email)) {
    return { isValid: false, error: 'Please enter a valid email address.' };
  }

  if (isDisposableEmail(email)) {
    return { isValid: false, error: 'Temporary or disposable email addresses are not allowed.' };
  }

  if (!isTrustedEmailDomain(email)) {
    return { isValid: false, error: 'Please use an email from a trusted provider (Gmail, Yahoo, Outlook, etc.).' };
  }

  return { isValid: true };
}

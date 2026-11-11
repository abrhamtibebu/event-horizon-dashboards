/** Ethiopian mobile numbers: +2519…, 09…, or a 9-digit number starting with 9 or 7. */
const ETHIOPIAN_MOBILE = /^(0[97]\d{8}|\+251[97]\d{8}|[97]\d{8})$/;

export function isEthiopianMobilePhone(value: string): boolean {
  const clean = value.replace(/[\s\-()]/g, '');
  return ETHIOPIAN_MOBILE.test(clean);
}

export const ETHIOPIAN_PHONE_MESSAGE = 'Enter a number like +251 911 234 567, 0911234567, or 911234567.';

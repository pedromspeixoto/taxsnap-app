/**
 * Maps country codes to ISO 2-letter codes for flag display
 */
const countryCodeMap: { [key: string]: string } = {
  '840': 'US', // United States
  '372': 'IE', // Ireland
  '442': 'LU', // Luxembourg
  '124': 'CA', // Canada
  '528': 'NL', // Netherlands
  '276': 'DE', // Germany
  '620': 'PT', // Portugal
  '826': 'GB', // United Kingdom
  '250': 'FR', // France
  '380': 'IT', // Italy
  '724': 'ES', // Spain
  '756': 'CH', // Switzerland
}

/**
 * Maps country codes to readable country names
 */
const countryNameMap: { [key: string]: string } = {
  '840': 'USA',
  '372': 'Ireland',
  '442': 'Luxembourg',
  '124': 'Canada',
  '528': 'Netherlands',
  '276': 'Germany',
  '620': 'Portugal',
  '826': 'United Kingdom',
  '250': 'France',
  '380': 'Italy',
  '724': 'Spain',
  '756': 'Switzerland',
}

/**
 * Returns the flag URL for a given country code
 * @param countryCode - The numeric country code (e.g., '840' for US)
 * @returns URL to the country flag image
 */
export function getCountryFlag(countryCode: string): string {
  const isoCode = countryCodeMap[countryCode] || countryCode
  return `https://flagcdn.com/w20/${isoCode.toLowerCase()}.png`
}

/**
 * Returns the readable country name for a given country code
 * @param countryCode - The numeric country code (e.g., '840' for US)
 * @returns The readable country name
 */
export function getCountryName(countryCode: string): string {
  return countryNameMap[countryCode] || countryCode
} 
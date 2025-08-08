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
  '036': 'AU', // Australia
  '554': 'NZ', // New Zealand
  '752': 'SE', // Sweden
  '578': 'NO', // Norway
  '208': 'DK', // Denmark
  '246': 'FI', // Finland
  '040': 'AT', // Austria
  '056': 'BE', // Belgium
  '203': 'CZ', // Czech Republic
  '348': 'HU', // Hungary
  '616': 'PL', // Poland
  '643': 'RU', // Russia
  '156': 'CN', // China
  '392': 'JP', // Japan
  '410': 'KR', // South Korea
  '356': 'IN', // India
  '076': 'BR', // Brazil
  '484': 'MX', // Mexico
  '032': 'AR', // Argentina
  '152': 'CL', // Chile
  '170': 'CO', // Colombia
  '604': 'PE', // Peru
  '710': 'ZA', // South Africa
  '818': 'EG', // Egypt
  '512': 'OM', // Oman
  '784': 'AE', // United Arab Emirates
  '682': 'SA', // Saudi Arabia
  '376': 'IL', // Israel
  '792': 'TR', // Turkey
  '702': 'SG', // Singapore
  '344': 'HK', // Hong Kong
  '158': 'TW', // Taiwan
  '764': 'TH', // Thailand
  '704': 'VN', // Vietnam
  '458': 'MY', // Malaysia
  '360': 'ID', // Indonesia
  '608': 'PH', // Philippines
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
  '036': 'Australia',
  '554': 'New Zealand',
  '752': 'Sweden',
  '578': 'Norway',
  '208': 'Denmark',
  '246': 'Finland',
  '040': 'Austria',
  '056': 'Belgium',
  '203': 'Czech Republic',
  '348': 'Hungary',
  '616': 'Poland',
  '643': 'Russia',
  '156': 'China',
  '392': 'Japan',
  '410': 'South Korea',
  '356': 'India',
  '076': 'Brazil',
  '484': 'Mexico',
  '032': 'Argentina',
  '152': 'Chile',
  '170': 'Colombia',
  '604': 'Peru',
  '710': 'South Africa',
  '818': 'Egypt',
  '512': 'Oman',
  '784': 'United Arab Emirates',
  '682': 'Saudi Arabia',
  '376': 'Israel',
  '792': 'Turkey',
  '702': 'Singapore',
  '344': 'Hong Kong',
  '158': 'Taiwan',
  '764': 'Thailand',
  '704': 'Vietnam',
  '458': 'Malaysia',
  '360': 'Indonesia',
  '608': 'Philippines',
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
// Auto-detect user's region and return appropriate language/locale
export interface RegionInfo {
  locale: string;
  language: string;
  country: string;
  currency: string;
  timezone: string;
}

export const getSupportedRegions = (): Record<string, RegionInfo> => ({
  'en-US': {
    locale: 'en-US',
    language: 'English',
    country: 'United States',
    currency: 'USD',
    timezone: 'America/New_York'
  },
  'en-GB': {
    locale: 'en-GB',
    language: 'English',
    country: 'United Kingdom',
    currency: 'GBP',
    timezone: 'Europe/London'
  },
  'fr-FR': {
    locale: 'fr-FR',
    language: 'Français',
    country: 'France',
    currency: 'EUR',
    timezone: 'Europe/Paris'
  },
  'es-ES': {
    locale: 'es-ES',
    language: 'Español',
    country: 'Spain',
    currency: 'EUR',
    timezone: 'Europe/Madrid'
  },
  'ar-SA': {
    locale: 'ar-SA',
    language: 'العربية',
    country: 'Saudi Arabia',
    currency: 'SAR',
    timezone: 'Asia/Riyadh'
  },
  'ar-AE': {
    locale: 'ar-AE',
    language: 'العربية',
    country: 'UAE',
    currency: 'AED',
    timezone: 'Asia/Dubai'
  }
});

export const detectUserRegion = async (): Promise<RegionInfo> => {
  const supportedRegions = getSupportedRegions();
  
  try {
    // Method 1: Try to get timezone and browser locale
    const browserLocale = navigator.language || navigator.languages?.[0] || 'en-US';
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Method 2: Try IP-based geolocation (fallback)
    let countryCode = 'US';
    try {
      const response = await fetch('https://ipapi.co/country_code/');
      if (response.ok) {
        countryCode = await response.text();
      }
    } catch (error) {
      console.log('IP geolocation failed, using browser locale');
    }
    
    // Map country code to supported locales
    const countryLocaleMap: Record<string, string> = {
      'US': 'en-US',
      'GB': 'en-GB',
      'FR': 'fr-FR',
      'ES': 'es-ES',
      'SA': 'ar-SA',
      'AE': 'ar-AE',
      'BH': 'ar-SA',
      'KW': 'ar-SA',
      'QA': 'ar-SA',
      'OM': 'ar-SA'
    };
    
    // Determine best locale
    let detectedLocale = browserLocale;
    
    // If we have a country code, try to match it
    if (countryCode && countryLocaleMap[countryCode]) {
      detectedLocale = countryLocaleMap[countryCode];
    }
    
    // Check if detected locale is supported
    if (supportedRegions[detectedLocale]) {
      return supportedRegions[detectedLocale];
    }
    
    // Check for partial matches (language only)
    const languageOnly = detectedLocale.split('-')[0];
    const partialMatch = Object.values(supportedRegions).find(
      region => region.locale.startsWith(languageOnly)
    );
    
    if (partialMatch) {
      return partialMatch;
    }
    
    // Default to English US
    return supportedRegions['en-US'];
    
  } catch (error) {
    console.error('Region detection failed:', error);
    return supportedRegions['en-US'];
  }
};

export const formatCurrency = (amount: number, locale: string): string => {
  const regionInfo = getSupportedRegions()[locale];
  if (!regionInfo) return `$${amount.toFixed(2)}`;
  
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: regionInfo.currency
    }).format(amount);
  } catch (error) {
    return `$${amount.toFixed(2)}`;
  }
};

export const formatDate = (date: Date, locale: string): string => {
  try {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  } catch (error) {
    return date.toLocaleDateString();
  }
}; 
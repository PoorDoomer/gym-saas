'use client';

import { useState, useEffect } from 'react';
import { detectUserRegion, RegionInfo, getSupportedRegions } from '@/lib/utils/regionDetector';

export interface UseRegionDetectionReturn {
  region: RegionInfo | null;
  isLoading: boolean;
  error: string | null;
  changeRegion: (locale: string) => void;
  supportedRegions: Record<string, RegionInfo>;
  formatCurrency: (amount: number) => string;
  formatDate: (date: Date) => string;
}

export const useRegionDetection = (): UseRegionDetectionReturn => {
  const [region, setRegion] = useState<RegionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supportedRegions = getSupportedRegions();

  useEffect(() => {
    const detectRegion = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Check if user has previously selected a region
        const savedRegion = localStorage.getItem('user-region');
        if (savedRegion && supportedRegions[savedRegion]) {
          setRegion(supportedRegions[savedRegion]);
          setIsLoading(false);
          return;
        }
        
        // Auto-detect region
        const detectedRegion = await detectUserRegion();
        setRegion(detectedRegion);
        
        // Save to localStorage for future visits
        localStorage.setItem('user-region', detectedRegion.locale);
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to detect region';
        setError(errorMessage);
        console.error('Region detection error:', err);
        
        // Fallback to English US
        const fallback = supportedRegions['en-US'];
        setRegion(fallback);
        localStorage.setItem('user-region', fallback.locale);
        
      } finally {
        setIsLoading(false);
      }
    };

    detectRegion();
  }, []);

  const changeRegion = (locale: string) => {
    if (supportedRegions[locale]) {
      setRegion(supportedRegions[locale]);
      localStorage.setItem('user-region', locale);
    }
  };

  const formatCurrency = (amount: number): string => {
    if (!region) return `$${amount.toFixed(2)}`;
    
    try {
      return new Intl.NumberFormat(region.locale, {
        style: 'currency',
        currency: region.currency
      }).format(amount);
    } catch (error) {
      return `$${amount.toFixed(2)}`;
    }
  };

  const formatDate = (date: Date): string => {
    if (!region) return date.toLocaleDateString();
    
    try {
      return new Intl.DateTimeFormat(region.locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(date);
    } catch (error) {
      return date.toLocaleDateString();
    }
  };

  return {
    region,
    isLoading,
    error,
    changeRegion,
    supportedRegions,
    formatCurrency,
    formatDate
  };
}; 
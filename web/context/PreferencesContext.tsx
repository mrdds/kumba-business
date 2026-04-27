'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import '../i18n';
import { useTranslation } from 'react-i18next';

export type Language = 'fr' | 'en';
export type Currency = 'XOF' | 'EUR' | 'USD' | 'CNY';

interface PreferencesContextType {
    language: Language;
    currency: Currency;
    setLanguage: (lang: Language) => void;
    setCurrency: (curr: Currency) => void;
    formatCurrency: (amount: number, forceCurrency?: Currency) => string;
}

const defaultContext: PreferencesContextType = {
    language: 'fr',
    setLanguage: () => { },
    currency: 'XOF',
    setCurrency: () => { },
    formatCurrency: (amount) => `${amount} FCFA`,
};

const PreferencesContext = createContext<PreferencesContextType>(defaultContext);

// Mock exchange rates using base FCFA (XOF) for demonstration
// 1 EUR = 655.957 XOF
// 1 USD = ~600 XOF
// 1 CNY = ~83 XOF
const EXCHANGE_RATES: Record<Currency, number> = {
    'XOF': 1,
    'EUR': 655.957,
    'USD': 600.0,
    'CNY': 83.0,
};

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { i18n } = useTranslation();
    
    const [languageState, setLanguageState] = useState<Language>(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('app_language');
            return (stored === 'fr' || stored === 'en') ? (stored as Language) : 'fr';
        }
        return 'fr';
    });

    const [currencyState, setCurrencyState] = useState<Currency>(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('app_currency');
            return ['XOF', 'EUR', 'USD', 'CNY'].includes(stored || '') ? (stored as Currency) : 'XOF';
        }
        return 'XOF';
    });

    // Load from local storage on mount (mostly for side effects like i18n)
    useEffect(() => {
        i18n.changeLanguage(languageState);
    }, [i18n, languageState]);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('app_language', lang);
        i18n.changeLanguage(lang);
    };

    const setCurrency = (curr: Currency) => {
        setCurrencyState(curr);
        localStorage.setItem('app_currency', curr);
    };

    const formatCurrency = (amount: number, baseCurrency: string = 'XOF') => {
        // We assume incoming base balances are mostly in XOF for standard calculation.
        // If the balance is actually coming as USD, we would adjust logic. 
        // For demonstration, we'll convert the amount assuming it is given in XOF base.
        
        // Find equivalent in XOF first (if amount is passed in something other than XOF)
        let amountInXof = amount;
        if (baseCurrency !== 'XOF') {
             // In a real app, baseCurrency would be defined by the tenant's actual DB currency
             amountInXof = amount * (EXCHANGE_RATES[baseCurrency as Currency] || 1);
        }

        // Convert to target user currency
        const rate = EXCHANGE_RATES[currencyState] || 1;
        const converted = amountInXof / rate;

        try {
            return new Intl.NumberFormat(languageState === 'fr' ? 'fr-FR' : 'en-US', {
                style: 'currency',
                currency: currencyState,
            }).format(converted);
        } catch {
            return `${currencyState} ${converted.toFixed(2)}`;
        }
    };

    return (
        <PreferencesContext.Provider value={{ 
            language: languageState, 
            setLanguage, 
            currency: currencyState, 
            setCurrency, 
            formatCurrency 
        }}>
            {children}
        </PreferencesContext.Provider>
    );
};

export const usePreferences = () => useContext(PreferencesContext);

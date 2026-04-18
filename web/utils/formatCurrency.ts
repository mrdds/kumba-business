export const formatCurrency = (amount: number | string, currencyCode: string = 'USD'): string => {
    // Handle invalid amounts and ensure number type
    const num = Number(amount);
    const safeAmount = isNaN(num) ? 0 : num;

    switch (currencyCode) {
        case 'EUR':
            return `€${safeAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        case 'GBP':
            return `£${safeAmount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        case 'XOF':
            // CFA displayed with 2 decimals as requested
            return `${safeAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} CFA`;
        case 'USD':
        default:
            return `$${safeAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
};

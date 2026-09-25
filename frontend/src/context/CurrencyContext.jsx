import { createContext, useContext, useState, useCallback } from 'react';

const CurrencyContext = createContext(null);

export function CurrencyProvider({ children }) {
  const [currency, setCurrency] = useState(
    () => localStorage.getItem('currency') || 'USD'
  );
  const [rate, setRate] = useState(
    () => parseFloat(localStorage.getItem('usd_to_birr') || '57')
  );

  const switchCurrency = useCallback((cur) => {
    setCurrency(cur);
    localStorage.setItem('currency', cur);
  }, []);

  const updateRate = useCallback((r) => {
    setRate(parseFloat(r) || 57);
    localStorage.setItem('usd_to_birr', String(r));
  }, []);

  const formatPrice = useCallback((usdPrice) => {
    if (currency === 'ETB') {
      return `${(usdPrice * rate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Birr`;
    }
    return `$${parseFloat(usdPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, [currency, rate]);

  const symbol = currency === 'ETB' ? 'Birr' : '$';

  return (
    <CurrencyContext.Provider value={{ currency, rate, symbol, formatPrice, switchCurrency, updateRate }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used inside CurrencyProvider');
  return ctx;
}

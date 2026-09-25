import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/axios';
import { useCurrency } from './CurrencyContext';

const SettingsContext = createContext({});

export default function SettingsProvider({ children }) {
  const [settings, setSettings] = useState({});
  const { updateRate } = useCurrency();

  useEffect(() => {
    api.get('/settings')
      .then(res => {
        const s = res.data.settings || {};
        setSettings(s);
        // Sync exchange rate into CurrencyContext
        if (s.usd_to_birr) updateRate(s.usd_to_birr);
      })
      .catch(() => {});
  }, [updateRate]);

  return (
    <SettingsContext.Provider value={settings}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}

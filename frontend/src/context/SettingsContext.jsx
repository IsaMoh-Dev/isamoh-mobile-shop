import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api from '../api/axios';
import { useCurrency } from './CurrencyContext';

const SettingsContext = createContext({});
const RefreshContext  = createContext(() => {});

export default function SettingsProvider({ children }) {
  const [settings, setSettings] = useState({});
  const { updateRate } = useCurrency();

  const load = useCallback(() => {
    api.get('/settings')
      .then(res => {
        const s = res.data.settings || {};
        setSettings(s);
        // Sync exchange rate into CurrencyContext
        if (s.usd_to_birr) updateRate(s.usd_to_birr);
      })
      .catch(() => {});
  }, [updateRate]);

  useEffect(() => { load(); }, [load]);

  return (
    <RefreshContext.Provider value={load}>
      <SettingsContext.Provider value={settings}>
        {children}
      </SettingsContext.Provider>
    </RefreshContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}

/** Call this after mutating a setting to re-fetch and update all consumers. */
export function useRefreshSettings() {
  return useContext(RefreshContext);
}

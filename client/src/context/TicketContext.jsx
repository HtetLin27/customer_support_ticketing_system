import { createContext, useContext, useState, useCallback } from 'react';

const TicketContext = createContext(null);

export const TicketProvider = ({ children }) => {
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    search: '',
    page: 1,
    limit: 20,
  });

  // Update one filter at a time — always reset to page 1
  const updateFilter = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({ status: '', priority: '', search: '', page: 1, limit: 20 });
  }, []);

  const setPage = useCallback((page) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  return (
    <TicketContext.Provider
      value={{
        filters,
        updateFilter,
        resetFilters,
        setPage,
      }}
    >
      {children}
    </TicketContext.Provider>
  );
};

export const useTicketContext = () => {
  const ctx = useContext(TicketContext);
  if (!ctx) throw new Error('useTicketContext must be used inside TicketProvider');
  return ctx;
};

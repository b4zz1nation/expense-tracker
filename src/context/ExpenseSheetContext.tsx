import { createContext, useContext, useMemo, useState, type PropsWithChildren } from 'react';

type ExpenseSheetContextValue = {
  sheetOpen: boolean;
  setSheetOpen: (open: boolean) => void;
};

const ExpenseSheetContext = createContext<ExpenseSheetContextValue | null>(null);

export function ExpenseSheetProvider({ children }: PropsWithChildren) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const value = useMemo(() => ({ sheetOpen, setSheetOpen }), [sheetOpen]);

  return <ExpenseSheetContext.Provider value={value}>{children}</ExpenseSheetContext.Provider>;
}

export function useExpenseSheet() {
  const context = useContext(ExpenseSheetContext);

  if (!context) {
    throw new Error('useExpenseSheet must be used within an ExpenseSheetProvider.');
  }

  return context;
}

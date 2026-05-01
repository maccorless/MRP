"use client";

import { createContext, useContext, useState } from "react";

type PrpEditContextValue = {
  isDraft: boolean;
  language: string;
  section: string;
  setIsDraft: (v: boolean) => void;
  setLanguage: (v: string) => void;
};

const PrpEditContext = createContext<PrpEditContextValue | null>(null);

export function PrpEditProvider({
  children,
  section,
  defaultLanguage = "EN",
}: {
  children: React.ReactNode;
  section: string;
  defaultLanguage?: string;
}) {
  const [isDraft, setIsDraft] = useState(false);
  const [language, setLanguage] = useState(defaultLanguage);

  return (
    <PrpEditContext.Provider value={{ isDraft, language, section, setIsDraft, setLanguage }}>
      {children}
    </PrpEditContext.Provider>
  );
}

export function usePrpEdit(): PrpEditContextValue {
  const ctx = useContext(PrpEditContext);
  if (!ctx) throw new Error("usePrpEdit must be used inside PrpEditProvider");
  return ctx;
}

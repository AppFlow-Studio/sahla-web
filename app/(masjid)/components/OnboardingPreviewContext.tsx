"use client";

import { createContext, useContext, useState, useCallback } from "react";

/** A Discover "Program" category card as shown in the app preview. */
export type PreviewCategory = {
  title: string;
  bgColor: string | null;
  imageUrl: string | null;
};

/** A program row as shown in the app preview's Programs list. */
export type PreviewProgram = {
  name: string;
  /** Stored 24h "HH:mm" time, or null. */
  time: string | null;
  /** Titles of the categories this program is sorted into. */
  categoryTitles: string[];
};

type PreviewState = {
  appName: string;
  brandColor: string;
  accentColor: string;
  logoUrl: string | null;
  programCategories: PreviewCategory[];
  programs: PreviewProgram[];
};

type PreviewContextValue = PreviewState & {
  updatePreview: (partial: Partial<PreviewState>) => void;
};

const PreviewContext = createContext<PreviewContextValue>({
  appName: "Your Masjid",
  brandColor: "#0A261E",
  accentColor: "#B8922A",
  logoUrl: null,
  programCategories: [],
  programs: [],
  updatePreview: () => {},
});

export function usePreview() {
  return useContext(PreviewContext);
}

export default function OnboardingPreviewProvider({
  children,
  initial,
}: {
  children: React.ReactNode;
  initial: PreviewState;
}) {
  const [state, setState] = useState<PreviewState>(initial);

  const updatePreview = useCallback((partial: Partial<PreviewState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  return (
    <PreviewContext.Provider value={{ ...state, updatePreview }}>
      {children}
    </PreviewContext.Provider>
  );
}

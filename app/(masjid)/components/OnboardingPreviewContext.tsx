"use client";

import { createContext, useContext, useState, useCallback } from "react";

type PreviewState = {
  appName: string;
  brandColor: string;
  accentColor: string;
  logoUrl: string | null;
};

type PreviewContextValue = PreviewState & {
  updatePreview: (partial: Partial<PreviewState>) => void;
};

const PreviewContext = createContext<PreviewContextValue>({
  appName: "Your Masjid",
  brandColor: "#0A261E",
  accentColor: "#B8922A",
  logoUrl: null,
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

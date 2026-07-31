import { createContext, useContext, useState, ReactNode } from "react";
import { translations, LangKey, TranslationKey } from "@/lib/translations";

interface LanguageContextType {
  lang: LangKey;
  setLang: (lang: LangKey) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLang] = useState<LangKey>("en");

  const t = (key: TranslationKey): string => {
    return (translations[lang] as Record<string, string>)[key] ?? (translations.en as Record<string, string>)[key] ?? key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
};

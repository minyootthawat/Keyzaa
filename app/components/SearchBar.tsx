"use client";

import { useState, useEffect, useRef, useId } from "react";
import { useLanguage } from "@/app/context/LanguageContext";

export default function SearchBar({ suggestions, onSelect }: { suggestions: string[]; onSelect: (value: string) => void }) {
  const [query, setQuery] = useState("");
  const [showList, setShowList] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef<number | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const comboboxId = useId();
  const listId = `${comboboxId}-listbox`;
  const { t } = useLanguage();

  const hasQuery = query.trim().length > 0;
  const showSuggestions = showList && hasQuery;
  const hasSuggestions = suggestions.length > 0;
  const activeOptionId =
    activeIndex >= 0 && activeIndex < suggestions.length ? `${comboboxId}-option-${activeIndex}` : undefined;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setShowList(val.trim().length > 0);
    setActiveIndex(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      onSelect(val);
    }, 300);
  };

  const handleSelect = (value: string) => {
    setQuery(value);
    setShowList(false);
    setActiveIndex(-1);
    onSelect(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!hasSuggestions) return;
      setActiveIndex((prev) => (prev + 1) % suggestions.length);
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!hasSuggestions) return;
      setActiveIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
      return;
    }

    if (e.key === "Enter") {
      if (activeIndex < 0 || activeIndex >= suggestions.length) return;
      e.preventDefault();
      handleSelect(suggestions[activeIndex]);
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      setShowList(false);
      setActiveIndex(-1);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setShowList(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div ref={rootRef} id="search-bar" className="relative w-full">
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2">
          <svg className="pointer-events-none h-5 w-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </div>
        <input
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showSuggestions}
          aria-controls={listId}
          aria-activedescendant={activeOptionId}
          placeholder={t("common_searchLong")}
          aria-label={t("common_searchAria")}
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowList(query.trim().length > 0)}
          className="w-full rounded-2xl border border-white/[0.06] bg-bg-elevated/50 backdrop-blur-md py-3.5 pl-12 pr-4 text-sm font-medium text-text-main placeholder:text-text-muted/60 transition-all focus:border-brand-primary/40 focus:bg-bg-elevated/70 focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
        />
      </div>
      {showSuggestions ? (
        <ul id={listId} role="listbox" className="glass-panel absolute z-10 mt-2 max-h-64 w-full overflow-y-auto rounded-2xl border border-white/[0.08]">
          {hasSuggestions ? (
            suggestions.map((s, i) => (
              <li
                key={`${s}-${i}`}
                id={`${comboboxId}-option-${i}`}
                role="option"
                aria-selected={activeIndex === i}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(s);
                }}
                className={`cursor-pointer border-b border-white/[0.04] px-4 py-3 text-sm transition-colors first:rounded-t-2xl last:rounded-b-2xl last:border-0 ${
                  activeIndex === i ? "bg-brand-primary/10 text-text-main" : "text-text-subtle hover:bg-bg-elevated/50 hover:text-text-main"
                }`}
              >
                {s}
              </li>
            ))
          ) : (
            <li className="px-4 py-3 text-sm text-text-muted">{t("common_noSearchResults")}</li>
          )}
        </ul>
      ) : null}
    </div>
  );
}
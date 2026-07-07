"use client";

import * as React from "react";
import { Languages } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { supportedAppLocales, useI18n, type AppLocale } from "@/lib/i18n";

type Props = {
  disabled?: boolean;
  triggerClassName?: string;
  showIcon?: boolean;
};

export function LanguageSelect({ disabled, triggerClassName, showIcon = true }: Props) {
  const {
    locale,
    setLocale,
    localeShortLabels,
    localeLabels,
    messages: m,
  } = useI18n();

  return (
    <Select
      value={locale}
      onValueChange={(value) => setLocale(value as AppLocale)}
      disabled={disabled}
    >
      <SelectTrigger
        className={cn("h-8 text-xs", triggerClassName)}
        title={m.language.title}
        aria-label={m.language.aria}
      >
        {showIcon && <Languages className="h-3.5 w-3.5" />}
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {supportedAppLocales().map((appLocale) => (
          <SelectItem key={appLocale} value={appLocale}>
            <span className="font-medium">{localeShortLabels[appLocale]}</span>
            <span className="ml-2 text-muted-foreground">{localeLabels[appLocale]}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

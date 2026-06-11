"use client";

import { useMemo, useState } from "react";

const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
const arabicDigits = "٠١٢٣٤٥٦٧٨٩";

function toLatinDigits(value: string) {
  return value.replace(/[۰-۹٠-٩]/g, (digit) => {
    const persianIndex = persianDigits.indexOf(digit);
    if (persianIndex >= 0) return String(persianIndex);

    const arabicIndex = arabicDigits.indexOf(digit);
    return arabicIndex >= 0 ? String(arabicIndex) : digit;
  });
}

function onlyDigits(value: string) {
  return toLatinDigits(value).replace(/\D/g, "");
}

function formatPrice(value: string) {
  if (!value) return "";
  return Number(value).toLocaleString("fa-IR");
}

type PriceAmountInputProps = {
  className: string;
  defaultValue?: number;
  placeholder?: string;
  form?: string;
};

export function PriceAmountInput({ className, defaultValue, placeholder, form }: PriceAmountInputProps) {
  const initialValue = typeof defaultValue === "number" && Number.isFinite(defaultValue) ? String(defaultValue) : "";
  const [rawValue, setRawValue] = useState(initialValue);
  const displayValue = useMemo(() => formatPrice(rawValue), [rawValue]);

  return (
    <>
      <input type="hidden" name="priceAmount" value={rawValue || "0"} form={form} />
      <input
        form={form}
        value={displayValue}
        inputMode="numeric"
        dir="ltr"
        placeholder={placeholder}
        className={`${className} text-left tabular-nums`}
        onChange={(event) => setRawValue(onlyDigits(event.target.value))}
      />
    </>
  );
}

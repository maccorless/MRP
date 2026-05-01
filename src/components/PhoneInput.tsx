"use client";

import { useState } from "react";
import { AsYouType } from "libphonenumber-js";

function formatAsYouType(value: string): string {
  const ayt = new AsYouType();
  let formatted = "";
  for (const ch of value) {
    formatted = ayt.input(ch);
  }
  return formatted || value;
}

export function PhoneInput({
  id,
  name,
  required,
  defaultValue,
  placeholder,
  className,
  "data-tab": dataTab,
}: {
  id: string;
  name: string;
  required?: boolean;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
  "data-tab"?: number | string;
}) {
  const [value, setValue] = useState(() => formatAsYouType(defaultValue ?? ""));

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setValue(formatAsYouType(e.target.value));
  }

  return (
    <input
      id={id}
      name={name}
      type="tel"
      required={required}
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
      data-tab={dataTab}
      autoComplete="tel"
    />
  );
}

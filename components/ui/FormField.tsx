"use client";

import { InputHTMLAttributes, SelectHTMLAttributes } from "react";

// ========================================
// FORM FIELD - Input de formulário
// ========================================
// 3 variantes:
// 1. text - Input de texto padrão
// 2. select - Dropdown com opções
// 3. readonly - Campo somente leitura com ícone de cadeado

// ========================================
// TEXT INPUT
// ========================================
interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function FormField({
  label,
  error,
  id,
  className = "",
  ...props
}: FormFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={id}
        className="text-sm font-medium text-gray-300"
      >
        {label}
      </label>
      <input
        id={id}
        className={`
          w-full px-4 py-3.5 rounded-lg
          border border-border-subtle bg-surface-input
          text-white placeholder-gray-400
          focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
          transition-all
          ${error ? "border-error" : ""}
          ${className}
        `}
        {...props}
      />
      {error && (
        <span className="text-xs text-error">{error}</span>
      )}
    </div>
  );
}

// ========================================
// SELECT
// ========================================
interface FormSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: { value: string; label: string }[];
  error?: string;
}

export function FormSelect({
  label,
  options,
  error,
  id,
  className = "",
  ...props
}: FormSelectProps) {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={id}
        className="text-sm font-medium text-gray-300"
      >
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          className={`
            w-full px-4 py-3.5 rounded-lg
            border border-border-subtle bg-surface-input
            text-white
            focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
            appearance-none cursor-pointer
            transition-all
            ${error ? "border-error" : ""}
            ${className}
          `}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400">
          <span className="material-symbols-outlined">expand_more</span>
        </span>
      </div>
      {error && (
        <span className="text-xs text-error">{error}</span>
      )}
    </div>
  );
}

// ========================================
// READONLY FIELD
// ========================================
interface FormReadonlyProps {
  label: string;
  value: string;
}

export function FormReadonly({ label, value }: FormReadonlyProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-gray-400 uppercase tracking-wider ml-1">
        {label}
      </label>
      <div className="flex items-center w-full px-4 h-12 rounded-lg bg-surface-input border border-transparent">
        <input
          className="bg-transparent border-none w-full text-white focus:ring-0 p-0 text-base font-medium"
          readOnly
          type="text"
          value={value}
        />
        <span className="material-symbols-outlined text-gray-400 text-[18px]">
          lock
        </span>
      </div>
    </div>
  );
}

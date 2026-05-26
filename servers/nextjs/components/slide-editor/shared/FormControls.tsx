import type { ReactNode } from "react";
import { styles } from "../editorStyles";
import { withHash, withoutHash } from "../editorUtils";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={styles.field}>
      <span>{label}</span>
      {children}
    </label>
  );
}

export function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label}>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={styles.input}
      />
    </Field>
  );
}

export function NumberField({
  label,
  value,
  min = 0,
  max = 99,
  step = 0.05,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  return (
    <Field label={label}>
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        style={styles.input}
      />
    </Field>
  );
}

export function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label}>
      <input
        type="color"
        value={withHash(value)}
        onChange={(event) => onChange(withoutHash(event.target.value))}
        style={styles.colorInput}
      />
    </Field>
  );
}

export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Array<{ label: string; value: T }>;
  onChange: (value: T) => void;
}) {
  return (
    <Field label={label}>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        style={styles.input}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function TextareaField({
  label,
  rows = 4,
  value,
  onChange,
}: {
  label: string;
  rows?: number;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label}>
      <textarea
        value={value}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        style={styles.textarea}
      />
    </Field>
  );
}

export function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label style={styles.checkLabel}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      {label}
    </label>
  );
}

export function EditorButton({
  children,
  disabled = false,
  onClick,
  title,
  variant = "secondary",
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick: () => void;
  title?: string;
  variant?: "primary" | "secondary";
}) {
  const baseStyle =
    variant === "primary" ? styles.primaryButton : styles.secondaryButton;

  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      style={{
        ...baseStyle,
        opacity: disabled ? 0.55 : 1,
        cursor: disabled ? "not-allowed" : baseStyle.cursor,
      }}
    >
      {children}
    </button>
  );
}

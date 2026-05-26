import { editorTheme, styles } from "../editorStyles";

export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: Array<[T, string]>;
  onChange: (value: T) => void;
}) {
  return (
    <div style={styles.segmented}>
      {options.map(([id, label]) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          style={{
            ...styles.segment,
            background: id === value ? editorTheme.primary : "transparent",
            color: id === value ? "#FFFFFF" : editorTheme.textSoft,
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

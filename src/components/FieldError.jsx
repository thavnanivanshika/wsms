/** Renders a red validation message under a form field. Renders nothing when msg is falsy. */
export default function FieldError({ msg }) {
  if (!msg) return null;
  return (
    <span style={{
      color: 'var(--danger)',
      fontSize: 12,
      fontWeight: 500,
      marginTop: 2,
      lineHeight: 1.4,
      display: 'block',
    }}>
      {msg}
    </span>
  );
}

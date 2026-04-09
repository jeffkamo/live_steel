/** Three-dot column grip; visibility and width are driven by {@link ReorderGripWithMenu}. */
export function ReorderGripIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 7 16"
      fill="currentColor"
      className={['reorder-grip-icon', className].filter(Boolean).join(' ')}
      aria-hidden
    >
      <circle cx="3.5" cy="3" r="1.5" />
      <circle cx="3.5" cy="8" r="1.5" />
      <circle cx="3.5" cy="13" r="1.5" />
    </svg>
  )
}

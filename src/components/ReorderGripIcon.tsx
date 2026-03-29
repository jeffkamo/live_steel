/** Six-dot reorder grip; use on a parent with `group` for `group-hover:*` icon tint. */
export function ReorderGripIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M5 3a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM5 8a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM14 3a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM14 8a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM14 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
    </svg>
  )
}

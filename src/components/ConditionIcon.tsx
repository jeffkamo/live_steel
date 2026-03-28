import type { ReactNode } from 'react'
import type { ConditionState } from '../types'

/** Stroke glyphs aligned with Lucide icon shapes (lucide.dev, ISC). */
function conditionIconSvg(className: string | undefined, children: ReactNode) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.875}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {children}
    </svg>
  )
}

export function ConditionIcon({ label, className }: { label: string; className?: string }) {
  switch (label) {
    case 'Bleeding':
      return conditionIconSvg(
        className,
        <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" />,
      )
    case 'Dazed':
      return conditionIconSvg(
        className,
        <>
          <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
          <path d="M20 3v4" />
          <path d="M22 5h-4" />
          <path d="M4 17v2" />
          <path d="M5 18H3" />
        </>,
      )
    case 'Frightened':
      return conditionIconSvg(
        className,
        <>
          <path d="M9 10h.01" />
          <path d="M15 10h.01" />
          <path d="M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z" />
        </>,
      )
    case 'Grabbed':
      return conditionIconSvg(
        className,
        <>
          <path d="M18 11.5V9a2 2 0 0 0-2-2a2 2 0 0 0-2 2v1.4" />
          <path d="M14 10V8a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2" />
          <path d="M10 9.9V9a2 2 0 0 0-2-2a2 2 0 0 0-2 2v5" />
          <path d="M6 14a2 2 0 0 0-2-2a2 2 0 0 0-2 2" />
          <path d="M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-4a8 8 0 0 1-8-8 2 2 0 1 1 4 0" />
        </>,
      )
    case 'Judged':
      return conditionIconSvg(
        className,
        <>
          <path d="m14.5 12.5-8 8a2.119 2.119 0 1 1-3-3l8-8" />
          <path d="m16 16 6-6" />
          <path d="m8 8 6-6" />
          <path d="m9 7 8 8" />
          <path d="m21 11-8-8" />
        </>,
      )
    case 'Marked':
      return conditionIconSvg(
        className,
        <>
          <circle cx="12" cy="12" r="10" />
          <line x1="22" x2="18" y1="12" y2="12" />
          <line x1="6" x2="2" y1="12" y2="12" />
          <line x1="12" x2="12" y1="6" y2="2" />
          <line x1="12" x2="12" y1="22" y2="18" />
        </>,
      )
    case 'Prone':
      return conditionIconSvg(
        className,
        <>
          <path d="M2 4v16" />
          <path d="M2 8h18a2 2 0 0 1 2 2v10" />
          <path d="M2 17h20" />
          <path d="M6 8v9" />
        </>,
      )
    case 'Restrained':
      return conditionIconSvg(
        className,
        <>
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </>,
      )
    case 'Slowed':
      return conditionIconSvg(
        className,
        <>
          <path d="M2 13a6 6 0 1 0 12 0 4 4 0 1 0-8 0 2 2 0 0 0 4 0" />
          <circle cx="10" cy="13" r="8" />
          <path d="M2 21h12c4.4 0 8-3.6 8-8V7a2 2 0 1 0-4 0v6" />
          <path d="M18 3 19.1 5.2" />
          <path d="M22 3 20.9 5.2" />
        </>,
      )
    case 'Surprised':
      return conditionIconSvg(
        className,
        <>
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
        </>,
      )
    case 'Taunted':
      return conditionIconSvg(
        className,
        <>
          <circle cx="12" cy="12" r="10" />
          <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
          <path d="M7.5 8 10 9" />
          <path d="m14 9 2.5-1" />
          <path d="M9 10h.01" />
          <path d="M15 10h.01" />
        </>,
      )
    case 'Weakened':
      return conditionIconSvg(
        className,
        <>
          <polyline points="22 17 13.5 8.5 8.5 13.5 2 7" />
          <polyline points="16 17 22 17 22 11" />
        </>,
      )
    default:
      return null
  }
}

export const conditionIconHoverOutline =
  'motion-reduce:transition-none outline outline-2 outline-transparent outline-offset-0 transition-[outline-color,outline-offset,z-index] duration-150 hover:z-[1] hover:outline-amber-500/70 hover:outline-offset-0'

export function conditionIconShellClass(isActive: boolean, state: ConditionState | null): string {
  const base =
    'flex size-[1.625rem] shrink-0 items-center justify-center rounded-full border transition-[opacity,colors,box-shadow,outline-color] motion-reduce:transition-none'
  if (!isActive) {
    return `${base} border-zinc-600/45 text-zinc-300 opacity-[0.58]`
  }
  if (state === 'neutral') {
    return `${base} border-zinc-600/80 bg-zinc-800/90 text-zinc-100 opacity-100`
  }
  if (state === 'se') {
    return `${base} border-purple-500/75 bg-purple-500/15 text-purple-100 opacity-100 ring-1 ring-purple-500/45`
  }
  return `${base} border-amber-500/75 bg-amber-500/15 text-amber-100 opacity-100 ring-1 ring-amber-500/45`
}

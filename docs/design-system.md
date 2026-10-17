# Aquatechy design system

Light interface for the company app. New screens should use these tokens and components instead of one-off cards, bars, and tables.

This pass styles the authenticated shell (sidebar, header, page canvas) and the dashboard. Login, the client portal, and inner pages keep their current layouts. The font is set on `body`, so every page inherits it.

## Principles

- One canvas color behind the page, white surfaces on top of it.
- Hairline borders and a very light lift. Do not add heavy shadows.
- Logo blue is the only accent. Success, warning, and danger are for status.
- Reuse the components in `src/components/design`. Do not rebuild a rounded white card by hand.
- Leave the existing Tailwind `blue` and `gray` scales unchanged. Unmigrated pages still use them.
- Leave the shared shadcn `Button` default variant unchanged. Pass `accentButtonClassName` when a new screen needs the accent button.

## Color

Tokens are CSS variables in `src/app/globals.css` and Tailwind colors in `tailwind.config.ts`.

| Token                                         | Hex         | Use                                          |
| --------------------------------------------- | ----------- | -------------------------------------------- |
| `canvas`                                      | `#F3F6F8`   | Page background                              |
| `surface`                                     | `#FFFFFF`   | Cards, sidebar, header                       |
| `ink`                                         | `#122033`   | Primary text                                 |
| `ink-muted`                                   | `#5E7084`   | Secondary text, empty track labels           |
| `line`                                        | `#E4EBEF`   | Borders and dividers                         |
| `accent`                                      | `#364D9D`   | Active nav, icons, primary actions in new UI |
| `accent-soft`                                 | `#DCE1F5`   | Active nav wash, icon chips                  |
| `success`                                     | `#15803D`   | Done, on time, healthy                       |
| `warning`                                     | `#A16207`   | Skipped, due soon, caution                   |
| `danger`                                      | `#B91C1C`   | Overdue, errors                              |
| `success-soft`, `warning-soft`, `danger-soft` | light tints | Badge backgrounds                            |

Examples: `bg-canvas`, `bg-surface`, `text-ink`, `text-ink-muted`, `border-line`, `bg-accent`, `bg-accent-soft`, `text-success`.

## Type

Plus Jakarta Sans, loaded in `src/app/layout.tsx` with `next/font/google`. One family for the whole app.

- Page title: `text-xl font-semibold text-ink`
- Surface title: `text-base font-semibold text-ink`
- Body and table cells: `text-sm text-ink`
- Supporting copy: `text-sm text-ink-muted`
- Badges: `text-xs font-medium`

Numbers use tabular figures (`font-feature-settings: 'tnum' 1` on `body`, or the `tabular-nums` class).

## Shape, space, elevation

- Surfaces: `rounded-xl` (12px), `border border-line`, `bg-surface`, `shadow-lift`
- Controls and icon chips: `rounded-lg` (8px)
- Nav items and badges: `rounded-lg` for nav, `rounded-full` for badges
- Page canvas padding: `px-4 py-5` and `lg:px-8 lg:py-6`, applied by the authenticated shell
- Space between dashboard sections: `gap-6`
- Elevation: `shadow-lift` is `0 1px 2px rgba(18, 32, 51, 0.04)`

## Components

Import from `@/components/design`.

### Surface

The box for every page. Optional icon, title, description, header action, and body.

```tsx
<Surface
  title="Today's route progress"
  icon={Users}
  action={<Button className={accentButtonClassName}>Services</Button>}
>
  {children}
</Surface>
```

### EmptyState

Short title and one supporting line, centered inside a surface or panel.

### StatusBadge

`tone` is `success`, `warning`, `danger`, or `neutral`. Use it for counts and overdue states, not for decoration.

### DataPanel

A `Surface` plus a table built on `src/components/ui/table.tsx`. Use it for hand-built lists (the dashboard). Existing TanStack `DataTable*` screens stay as they are until those pages are migrated.

```tsx
<DataPanel
  title="Recent pending issues"
  icon={AlertCircle}
  columns={columns}
  rows={issues}
  getRowKey={(issue) => issue.id}
  emptyTitle="No pending issues yet"
  emptyDescription="Issues will appear here as your team reports them during service visits."
/>
```

`onRowClick` makes a row keyboard-activatable.

### SplitBar

Stacked horizontal bar for done, skipped, and open counts. SVG, colored with the status tokens.

### HorizontalBarChart

Labeled rows with a value and a bar. Values are relative to `max` (default 100), so percentages map directly. Optional `detail` slot for a badge or secondary text. SVG bars, same tokens.

```tsx
<HorizontalBarChart items={[{ id: '1', label: 'Alex', value: 92, valueLabel: '92%', tone: 'success' }]} />
```

Later pages should use `SplitBar` and `HorizontalBarChart` instead of new one-off bars.

### accentButtonClassName

Class string for the accent button. Apply it on the existing `Button`:

```tsx
import { accentButtonClassName } from '@/components/design';

<Button className={accentButtonClassName}>Save</Button>;
```

## Shell

Authenticated pages render inside `AuthenticatedShell`.

- Sidebar is 248px, white, with a hairline divider. The blue wordmark stays the current `logoHor.png`.
- Nav items are pills. The active item uses `bg-accent-soft` and `text-accent`.
- Header is white on desktop and mobile. The mobile menu uses the same light sidebar.
- The old inner bordered wrapper is gone. The shell paints `bg-canvas` and the padding above.

Do not wrap a page in a second full-page card. Put content in `Surface` blocks.

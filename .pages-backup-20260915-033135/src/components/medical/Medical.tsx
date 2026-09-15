/* -------------------------------------------------------------------------
 * Medical.tsx — the LTR islands inside the RTL application.
 * -------------------------------------------------------------------------
 * The rule this file exists to enforce:
 *
 *   The page stays dir="rtl". Clinical notation does not.
 *
 * Nothing here changes the direction of the document, a layout, or a screen.
 * Each component wraps exactly the run of characters that must be read
 * left-to-right — a signed power, an axis, a drug name, an OD/OS chart — and
 * leaves every Arabic label around it in the page direction.
 *
 * Why `dir="ltr"` and not just `text-align`: alignment moves the glyphs but
 * does not change bidi resolution, so '-2.75' still reorders to '2.75-'.
 * Only an LTR embedding fixes the sign. `unicode-bidi: isolate` (in
 * global.css) additionally stops each value from leaking its direction into
 * the surrounding sentence.
 * ---------------------------------------------------------------------- */

import type { ReactNode } from 'react';

/**
 * A single clinical value: a power, an axis, a PD, a date, an identifier.
 * Use for anything where a sign or digit order carries meaning.
 */
export function MedValue({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span dir="ltr" className={`med-value ${className}`.trim()}>
      {children}
    </span>
  );
}

/**
 * Latin clinical text: drug names, device names, abbreviations, file names.
 * Same isolation, but left-aligned as running text rather than tabular.
 */
export function MedText({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span dir="ltr" className={`med-text ${className}`.trim()}>
      {children}
    </span>
  );
}

/**
 * A block-level LTR region — used for the refraction chart, where the whole
 * table must read left-to-right so that:
 *
 *   - OD is the first (leftmost) row/column, OS the second
 *   - SPH → CYL → AXIS → ADD → PD reads in the conventional order
 *
 * Arabic headings belong OUTSIDE this container, not inside it.
 */
export function MedBlock({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div dir="ltr" className={`med-block ${className}`.trim()}>
      {children}
    </div>
  );
}

/**
 * An input for a clinical number. dir="ltr" and inputMode are set here once
 * so no call site can forget them: a bare <input> in an RTL form puts the
 * caret on the wrong side and lets a typed '-' jump to the end of the value.
 */
export function MedInput(
  props: React.InputHTMLAttributes<HTMLInputElement> & { label?: string },
) {
  const { label, className = '', ...rest } = props;
  return (
    <input
      {...rest}
      dir="ltr"
      inputMode="decimal"
      aria-label={label}
      className={`med-input ${className}`.trim()}
    />
  );
}

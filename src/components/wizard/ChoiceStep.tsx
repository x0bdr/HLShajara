"use client";

/**
 * ChoiceStep — the SCAFFOLD choice archetype (Plan 28-05, WIZ-02).
 *
 * An accessible auto-advancing radiogroup proving the choice interaction pattern
 * end-to-end before the real card sets land in Phase 29. It renders two
 * placeholder `.choice-card`s as a `role="radiogroup"` of `role="radio"` cards
 * with `aria-checked`, roving tabindex, Arrow-key selection, and Enter/Space/
 * pointer confirm. On confirm it calls `onConfirm(value)`; the PARENT
 * (`WizardClient`) owns the auto-advance delay + the reduced-motion gate — this
 * component only signals the confirmed value and applies the `.selected` /
 * brass-check visual.
 *
 * Returning to this step with a prior form value pre-selects + focuses the
 * matching card (UI-SPEC §2.3.4). It renders NO Next button — choice steps
 * advance automatically (UI-SPEC §2.2). Visuals are Plan 28-02 CSS classes only
 * (`.choice-grid`/`.choice-card`/`.selected`/`.body`/`.title`/`.desc`/`.check`);
 * no inline color, no `dangerouslySetInnerHTML`.
 *
 * S1-S4: the two cards are NEUTRAL placeholders — the demonstrated branch choice
 * is the entityType individual-vs-entity toggle, never any banned targeting
 * category (the S1-S4 register the design review rejects).
 */

import { useEffect, useRef, type KeyboardEvent } from "react";

interface ChoiceOption {
  /** The value committed to the form on confirm. */
  readonly value: string;
  /** Resolved (already-translated) card title. */
  readonly title: string;
  /** Optional resolved description. */
  readonly desc?: string;
}

interface ChoiceStepProps {
  /** Id of the step heading the radiogroup is labelled by (from WizardPanel's h2). */
  labelledBy: string;
  /** The placeholder option set (two cards for the scaffold). */
  options: ReadonlyArray<ChoiceOption>;
  /** The currently-selected value (the prior form value on Back-return). */
  value: string;
  /** Called when a card is confirmed (Enter/Space/pointer). Parent auto-advances. */
  onConfirm: (value: string) => void;
}

export function ChoiceStep({ labelledBy, options, value, onConfirm }: ChoiceStepProps) {
  // The card whose value matches the current form value is the "active" (roving
  // tabindex=0) card; if none matches yet, the first card is the tab stop.
  const activeIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );

  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);

  // On Back-return with a prior selection, focus the matching card so keyboard
  // + screen-reader users land on their previous choice (UI-SPEC §2.3.4). Only
  // fires when there is an actual prior value (avoids stealing focus from the
  // heading on a fresh first render).
  useEffect(() => {
    if (value) cardRefs.current[activeIndex]?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Arrow keys move the roving tab stop (focus) WITHOUT confirming/advancing —
  // confirm is an explicit Enter/Space/pointer so a stray arrow can never skip a
  // step. Visual selection (`.selected` + `aria-checked`) derives purely from the
  // parent-owned `value`; until Enter/Space commits, arrow movement only changes
  // which card is focused, and the focused card is announced via `aria-checked`.
  function move(delta: number) {
    const next = (activeIndex + delta + options.length) % options.length;
    cardRefs.current[next]?.focus();
  }

  function handleKey(e: KeyboardEvent<HTMLDivElement>, option: ChoiceOption) {
    switch (e.key) {
      case "ArrowDown":
      case "ArrowRight":
        e.preventDefault();
        move(1);
        break;
      case "ArrowUp":
      case "ArrowLeft":
        e.preventDefault();
        move(-1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        onConfirm(option.value);
        break;
      default:
        break;
    }
  }

  return (
    <div className="choice-grid" role="radiogroup" aria-labelledby={labelledBy}>
      {options.map((option, i) => {
        const checked = option.value === value;
        const isActive = i === activeIndex;
        return (
          <div
            key={option.value}
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
            className={`choice-card${checked ? " selected" : ""}`}
            role="radio"
            aria-checked={checked}
            // Roving tabindex: only the active card is a tab stop (0); the rest
            // are -1 and reached via Arrow keys (UI-SPEC §5 radiogroup pattern).
            tabIndex={isActive ? 0 : -1}
            onKeyDown={(e) => handleKey(e, option)}
            onPointerUp={() => onConfirm(option.value)}
          >
            <span className="body">
              <span className="title">{option.title}</span>
              {option.desc ? <span className="desc">{option.desc}</span> : null}
            </span>
            {/* The one sanctioned brass use in the wizard — visible only when
                .selected (CSS fades it in). aria-hidden: decorative. */}
            <span className="check" aria-hidden="true">
              ✓
            </span>
          </div>
        );
      })}
    </div>
  );
}

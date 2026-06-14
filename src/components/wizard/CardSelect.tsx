"use client";

/**
 * CardSelect — reusable card grid for single or multi selection.
 *
 * Each card shows an icon, title, and optional description. Supports:
 *  - mode="single"  → radio-like, one selected value
 *  - mode="multi"   → checkbox-like, array of selected values
 *
 * Keyboard: Arrow keys move focus, Enter/Space or click toggles.
 */

import { useEffect, useRef, type KeyboardEvent, type ReactNode } from "react";

export interface CardOption {
  value: string;
  title: string;
  description?: string;
  icon?: ReactNode;
}

interface CardSelectProps {
  ariaLabel: string;
  options: ReadonlyArray<CardOption>;
  mode: "single" | "multi";
  selected: string | string[];
  onChange: (value: string, selected: boolean) => void;
}

export function CardSelect({
  ariaLabel,
  options,
  mode,
  selected,
  onChange,
}: CardSelectProps) {
  const selectedSet = new Set(Array.isArray(selected) ? selected : selected ? [selected] : []);
  const activeIndex = Math.max(
    0,
    options.findIndex((o) => selectedSet.has(o.value)),
  );

  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    if (selectedSet.size > 0) cardRefs.current[activeIndex]?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function move(delta: number) {
    const next = (activeIndex + delta + options.length) % options.length;
    cardRefs.current[next]?.focus();
  }

  function toggle(option: CardOption) {
    const currentlySelected = selectedSet.has(option.value);
    if (mode === "single") {
      if (!currentlySelected) onChange(option.value, true);
    } else {
      onChange(option.value, !currentlySelected);
    }
  }

  function handleKey(e: KeyboardEvent<HTMLDivElement>, option: CardOption) {
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
        toggle(option);
        break;
      default:
        break;
    }
  }

  return (
    <div
      className="choice-grid"
      role={mode === "single" ? "radiogroup" : "group"}
      aria-label={ariaLabel}
    >
      {options.map((option, i) => {
        const checked = selectedSet.has(option.value);
        const isActive = i === activeIndex;
        return (
          <div
            key={option.value}
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
            className={`choice-card${checked ? " selected" : ""}`}
            role={mode === "single" ? "radio" : "checkbox"}
            aria-checked={checked}
            tabIndex={isActive ? 0 : -1}
            onKeyDown={(e) => handleKey(e, option)}
            onPointerUp={() => toggle(option)}
          >
            {option.icon ? (
              <span className="card-icon" aria-hidden="true">
                {option.icon}
              </span>
            ) : null}
            <span className="body">
              <span className="title">{option.title}</span>
              {option.description ? (
                <span className="desc">{option.description}</span>
              ) : null}
            </span>
            <span className="check" aria-hidden="true">
              ✓
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default CardSelect;

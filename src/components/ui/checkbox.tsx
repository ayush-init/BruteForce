"use client";

import * as React from "react";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  indeterminate?: boolean;
  size?: "sm" | "md";
  stopPropagation?: boolean;
}

/**
 * Checkbox — the admin UI's selection control.
 *
 * Built on a visually-hidden native <input> so the browser handles the a11y
 * tree, keyboard activation, and form participation. The painted square is a
 * separate <span> that reacts to a data-state attribute we set imperatively,
 * which sidesteps the limitation that peer-checked styles can't influence
 * the icon's transform/opacity in the same conditional. Indeterminate is
 * set on the input ref directly (React doesn't expose it as a prop).
 *
 * stopPropagation defaults to true because this control is almost always
 * rendered inside a clickable row — without it, ticking the box would also
 * trigger the row's onClick (navigation), which is never what you want.
 */
export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox(
    {
      className,
      indeterminate,
      checked,
      disabled,
      size = "md",
      stopPropagation = true,
      onClick,
      ...props
    },
    ref
  ) {
    const internalRef = React.useRef<HTMLInputElement>(null);

    React.useImperativeHandle(
      ref,
      () => internalRef.current as HTMLInputElement
    );

    React.useEffect(() => {
      if (internalRef.current) {
        internalRef.current.indeterminate = !!indeterminate;
      }
    }, [indeterminate]);

    const state: "checked" | "indeterminate" | "unchecked" = indeterminate
      ? "indeterminate"
      : checked
        ? "checked"
        : "unchecked";

    const boxSize = size === "sm" ? "w-4 h-4" : "w-[18px] h-[18px]";
    const iconSize = size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5";

    return (
      <label
        data-slot="checkbox-root"
        data-state={state}
        data-disabled={disabled || undefined}
        onClick={(e) => {
          if (stopPropagation) e.stopPropagation();
          onClick?.(e as unknown as React.MouseEvent<HTMLInputElement>);
        }}
        className={cn(
          "group/checkbox relative inline-flex items-center justify-center align-middle cursor-pointer select-none",
          "data-[disabled]:cursor-not-allowed",
          className
        )}
      >
        <input
          ref={internalRef}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          className="peer sr-only"
          {...props}
        />

        <span
          aria-hidden
          data-state={state}
          className={cn(
            // Base box
            "relative grid place-items-center rounded-[6px] border group ",
            "transition-[background-color,border-color,box-shadow,transform] duration-150 ease-out",
            boxSize,
            // Resting border + subtle inner sheen so the box reads "interactive"
            " border-2 border-border shadow-[inset_0_0.5px_0_0_rgba(255,255,255,0.04)]",
            // Hover (unchecked → primary tint)
            "group-hover/checkbox:border-primary/60 group-hover/checkbox:bg-primary/5",
            // Focus ring follows the native input via peer-*
            "peer-focus-visible:ring-2 peer-focus-visible:ring-primary/50 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background",
            // Checked / Indeterminate (solid primary with soft glow)
            "data-[state=checked]:border-primary data-[state=checked]:bg-primary",
            "data-[state=checked]:shadow-[0_4px_12px_-4px_var(--primary),inset_0_0.5px_0_0_rgba(255,255,255,0.25)]",
            "data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary",
            "data-[state=indeterminate]:shadow-[0_4px_12px_-4px_var(--primary),inset_0_0.5px_0_0_rgba(255,255,255,0.25)]",
            // Active press
            "group-active/checkbox:scale-[0.92]",
            // Disabled
            "peer-disabled:opacity-40 peer-disabled:group-hover/checkbox:border-border/70 peer-disabled:group-hover/checkbox:bg-background/60 peer-disabled:group-active/checkbox:scale-100"
          )}
        >
          <Check
            aria-hidden
            strokeWidth={3.5}
            className={cn(
              "absolute text-primary-foreground transition-all duration-150 ease-out",
              iconSize,
              state === "checked"
                ? "opacity-100 scale-100 rotate-0"
                : "opacity-0 scale-50 -rotate-45"
            )}
          />
          <Minus
            aria-hidden
            strokeWidth={3.5}
            className={cn(
              "absolute text-primary-foreground transition-all duration-150 ease-out",
              iconSize,
              state === "indeterminate"
                ? "opacity-100 scale-100"
                : "opacity-0 scale-50"
            )}
          />
        </span>
      </label>
    );
  }
);

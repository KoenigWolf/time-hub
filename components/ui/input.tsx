import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * InputProps
 * 標準input属性に加え、拡張のためのclassNameやtypeを受け取れる
 * @property data-testid テスト用ID
 */
export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  className?: string;
  type?: React.HTMLInputTypeAttribute;
  "data-testid"?: string;
};

/**
 * Inputコンポーネント
 *
 * - 型安全: InputPropsで明示
 * - 責務分離: プレゼンテーションに特化
 * - アクセシビリティ: aria-invalid対応
 * - テスト容易性: data-testidを付与
 */
export const Input = React.memo(
  React.forwardRef<HTMLInputElement, InputProps>(function InputBase(
    { className, type = "text", "aria-invalid": ariaInvalid, "data-testid": dataTestId, ...props },
    ref
  ) {
    // aria-invalidは正規の値のみ許容
    const ariaInvalidValue =
      typeof ariaInvalid === "boolean"
        ? ariaInvalid
          ? "true"
          : undefined
        : typeof ariaInvalid === "string"
        ? ariaInvalid
        : undefined;

    return (
      <input
        ref={ref}
        type={type}
        data-slot="input"
        data-testid={dataTestId || "input"}
        aria-invalid={ariaInvalidValue}
        className={cn(
          "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
          "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
          className
        )}
        {...props}
      />
    );
  })
);

Input.displayName = "Input";

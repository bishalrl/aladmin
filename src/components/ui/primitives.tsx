import Link from "next/link";
import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <Card>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </Card>
  );
}

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
}) {
  const styles = {
    primary: "bg-teal-700 text-white hover:bg-teal-600",
    secondary: "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50",
    danger: "bg-red-700 text-white hover:bg-red-600",
    ghost: "text-slate-600 hover:bg-slate-100",
  }[variant];
  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg px-3.5 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${styles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input(
  props: React.InputHTMLAttributes<HTMLInputElement> & { label?: string },
) {
  const { label, className = "", id, ...rest } = props;
  return (
    <label className="block text-sm">
      {label ? <span className="mb-1.5 block text-slate-600">{label}</span> : null}
      <input
        id={id}
        className={`w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-teal-700/30 focus:ring-2 ${className}`}
        {...rest}
      />
    </label>
  );
}

export function TextArea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string },
) {
  const { label, className = "", ...rest } = props;
  return (
    <label className="block text-sm">
      {label ? <span className="mb-1.5 block text-slate-600">{label}</span> : null}
      <textarea
        className={`w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-teal-700/30 focus:ring-2 ${className}`}
        {...rest}
      />
    </label>
  );
}

export function Select(
  props: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string },
) {
  const { label, className = "", children, ...rest } = props;
  return (
    <label className="block text-sm">
      {label ? <span className="mb-1.5 block text-slate-600">{label}</span> : null}
      <select
        className={`w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-teal-700/30 focus:ring-2 ${className}`}
        {...rest}
      >
        {children}
      </select>
    </label>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
      <p className="font-medium text-slate-800">{title}</p>
      {description ? (
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      ) : null}
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger";
}) {
  const styles = {
    neutral: "bg-slate-100 text-slate-700",
    success: "bg-teal-50 text-teal-800",
    warning: "bg-amber-50 text-amber-800",
    danger: "bg-red-50 text-red-700",
  }[tone];
  return (
    <span
      className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${styles}`}
    >
      {children}
    </span>
  );
}

export function BreadcrumbLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className="text-teal-700 hover:underline">
      {children}
    </Link>
  );
}

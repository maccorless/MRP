import {
  AlertTriangle,
  Info,
  Download,
  Upload,
  ChevronDown,
  ChevronUp,
  Check,
  type LucideProps,
} from "lucide-react";

const ICONS = {
  warning: AlertTriangle,
  info: Info,
  download: Download,
  upload: Upload,
  "chevron-down": ChevronDown,
  "chevron-up": ChevronUp,
  check: Check,
} as const;

export type IconName = keyof typeof ICONS;

type Props = Omit<LucideProps, "ref"> & {
  name: IconName;
  label?: string;
};

export function Icon({ name, label, className, ...rest }: Props) {
  const Component = ICONS[name];
  const a11y = label
    ? { role: "img" as const, "aria-label": label }
    : { "aria-hidden": true as const };
  return (
    <Component
      className={className ?? "w-4 h-4"}
      strokeWidth={2}
      {...a11y}
      {...rest}
    />
  );
}

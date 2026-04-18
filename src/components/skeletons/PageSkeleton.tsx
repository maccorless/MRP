type Props = {
  titleWidth?: string;
  maxWidth?: string;
  children?: React.ReactNode;
};

export function PageSkeleton({
  titleWidth = "w-48",
  maxWidth = "max-w-5xl",
  children,
}: Props) {
  return (
    <div className={`p-6 ${maxWidth} mx-auto animate-pulse`}>
      <div className={`h-7 bg-gray-200 rounded ${titleWidth} mb-6`} />
      {children}
    </div>
  );
}

type SectionContainerProps = {
  children: React.ReactNode;
  className?: string;
};

export default function SectionContainer({ children, className = "" }: SectionContainerProps) {
  return <section className={`section-container ${className}`}>{children}</section>;
}

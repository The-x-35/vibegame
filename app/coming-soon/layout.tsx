export default function ComingSoonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 bg-gradient-to-b from-[#000000] to-[#1C0C5A]">
      {children}
    </div>
  );
} 
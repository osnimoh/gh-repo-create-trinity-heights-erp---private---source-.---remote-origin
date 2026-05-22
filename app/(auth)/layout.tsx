export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="bg-cream flex min-h-full flex-col items-center justify-center px-4 py-12">
      <main className="border-navy/10 w-full max-w-sm rounded-xl border bg-white p-8 shadow-sm">
        {children}
      </main>
      <footer className="text-muted mt-8 text-center text-sm">
        <p className="text-navy font-serif">
          Trinity Heights Senior High School
        </p>
        <p className="text-gold mt-1 tracking-wide">
          Knowledge. Character. Country.
        </p>
      </footer>
    </div>
  );
}


export default function ShareLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background min-h-screen">
      <main className="flex flex-col items-center justify-center min-h-screen p-4">
        {children}
      </main>
    </div>
  );
}

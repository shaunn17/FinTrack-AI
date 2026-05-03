export default function PageWrapper({ children }) {
  return (
    <main className="md:ml-60 min-h-screen pb-20 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-fade-in">
        {children}
      </div>
    </main>
  );
}

import TestPlanner from "@/components/TestPlanner";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-200 to-slate-100 px-6 py-12 font-sans text-slate-900 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-6xl">
        <TestPlanner />
      </div>
    </main>
  );
}

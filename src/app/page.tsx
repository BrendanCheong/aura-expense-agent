import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold">Aura Expense Agent</h1>
      <p className="mt-4 text-lg text-gray-500">
        Zero-touch financial intelligence system
      </p>
      <div className="mt-8 flex gap-4">
        <Link
          href="/login"
          className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
        >
          Sign In
        </Link>
        <Link
          href="/dashboard"
          className="rounded-lg border bg-white px-6 py-3 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
        >
          Dashboard
        </Link>
      </div>
    </main>
  );
}

import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-between">
      {/* Navbar */}
      <header className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="bg-amber-500 text-slate-950 font-black px-3 py-1 rounded text-xl tracking-wider">
            DONMAC
          </div>
          <span className="font-bold text-lg hidden sm:inline text-slate-300">DATA HUB</span>
        </div>
        <div className="flex space-x-4">
          <Link href="/login" className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition">
            Login
          </Link>
          <Link href="/register" className="bg-amber-500 text-slate-950 px-4 py-2 text-sm font-bold rounded hover:bg-amber-400 transition">
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-grow flex flex-col items-center justify-center text-center px-4 max-w-4xl mx-auto py-12">
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-6">
          Affordable Data Bundles <br />
          <span className="text-amber-500">Automated & Instant</span>
        </h1>
        <p className="text-lg sm:text-xl text-slate-400 mb-8 max-w-2xl">
          Instantly top up your wallet and buy MTN, Telecel, and AirtelTigo packages with high-speed delivery. Track your purchases, submit claims, and manage your telecom needs smoothly.
        </p>

        {/* Brand logos/colors simulation */}
        <div className="flex flex-wrap justify-center gap-6 mb-12">
          <div className="flex items-center space-x-2 bg-slate-800 border border-slate-700 px-4 py-2 rounded-lg">
            <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
            <span className="font-bold text-sm text-yellow-400">MTN Ghana</span>
          </div>
          <div className="flex items-center space-x-2 bg-slate-800 border border-slate-700 px-4 py-2 rounded-lg">
            <span className="w-3 h-3 rounded-full bg-red-600"></span>
            <span className="font-bold text-sm text-red-500">Telecel</span>
          </div>
          <div className="flex items-center space-x-2 bg-slate-800 border border-slate-700 px-4 py-2 rounded-lg">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
            <span className="font-bold text-sm text-blue-400">AirtelTigo</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-md">
          <Link href="/register" className="bg-amber-500 text-slate-950 px-8 py-3 rounded-lg font-bold text-lg hover:bg-amber-400 transition text-center shadow-lg shadow-amber-500/20">
            Create Free Account
          </Link>
          <Link href="/login" className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-3 rounded-lg font-bold text-lg transition text-center border border-slate-700">
            Access Dashboard
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 text-center text-sm text-slate-500">
        &copy; {new Date().getFullYear()} Donmac Data Hub. All rights reserved. Ghana's Premier Telecom Partner.
      </footer>
    </div>
  );
}

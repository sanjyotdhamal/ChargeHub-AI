import Link from "next/link";
import { Zap } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="w-full flex items-center justify-between px-8 py-4 bg-forest/60 backdrop-blur-md border-b border-apple/20 sticky top-0 z-50">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2">
        <Zap className="text-apple" size={24} />
        <span className="text-xl font-bold text-sage">
          ChargeHub <span className="text-apple">AI</span>
        </span>
      </Link>

      {/* Nav links */}
      <div className="hidden md:flex items-center gap-8 text-sage/90">
        <Link href="/" className="hover:text-apple transition-colors">Home</Link>
        <Link href="/discover" className="hover:text-apple transition-colors">Discover</Link>
        <Link href="/wallet" className="hover:text-apple transition-colors">Wallet</Link>
        <Link href="/history" className="hover:text-apple transition-colors">History</Link>
      </div>

      {/* Login button */}
      <button className="bg-apple text-forest font-semibold px-5 py-2 rounded-full hover:opacity-90 transition-opacity">
        Login
      </button>
    </nav>
  );
}
import { Separator } from "@/components/ui/separator";

export function Footer() {
  return (
    <footer className="w-full bg-blue-800 text-white">
      <div className="container mx-auto px-4 py-10">
        {/* Top separator line */}
        <Separator className="bg-white/20 mb-6" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Left Side */}
          <div className="text-center md:text-left">
            <h3 className="text-lg font-semibold">Liver Disease Awareness</h3>
            <p className="text-sm text-white/70 mt-2">
              Dedicated to improving liver health through education and care.
            </p>
          </div>

          {/* Right Side - Links */}
          <div className="flex flex-wrap justify-center md:justify-end gap-4 text-sm font-medium">
            <a href="/" className="hover:underline">
              Home
            </a>
            <a href="/about" className="hover:underline">
              About Us
            </a>
            <a href="/donation" className="hover:underline">
              Donate
            </a>
            <a href="/subscribe" className="hover:underline">
              Subscribe
            </a>
          </div>
        </div>

        {/* Bottom section */}
        <div className="mt-8 text-center text-xs text-white/50">
          © {new Date().getFullYear()} Liver Awareness Org. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

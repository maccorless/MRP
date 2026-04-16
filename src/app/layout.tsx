import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Press Registration Portal",
  description: "LA 2028 Olympic Games — Press Accreditation",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-2 focus:bg-white focus:text-[#0057A8] focus:underline"
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}

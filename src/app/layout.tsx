import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Media Registration Portal",
  description: "LA 2028 Olympic Games — Expression of Interest",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

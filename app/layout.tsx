import type { Metadata } from "next";
import { Lilita_One } from "next/font/google";
import "./globals.css";

// Used for the gem count (see .gem-count in globals.css)
const lilitaOne = Lilita_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-lilita-one",
});

export const metadata: Metadata = {
  title: "Shop",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={lilitaOne.variable}>
      <body>{children}</body>
    </html>
  );
}

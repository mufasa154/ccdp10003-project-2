import type { Metadata } from "next";
import MainMenuMusic from "./components/MainMenuMusic";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shop",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        <MainMenuMusic />
        {children}
      </body>
    </html>
  );
}

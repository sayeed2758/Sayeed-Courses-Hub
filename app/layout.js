import "./globals.css";
import { AuthProvider } from "./providers";

export const metadata = {
  title: "Sayeed Courses Hub — Find Your Next Skill",
  description: "Find your next skill.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body><AuthProvider>{children}</AuthProvider></body>
    </html>
  );
}

import "./globals.css";

export const metadata = {
  title: "EZEE VISION COURSE HUB",
  description: "Premium course learning hub",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

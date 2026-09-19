import "./globals.css";

export const metadata = {
  title: "Sayeed Courses Hub",
  description: "Premium course learning hub",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

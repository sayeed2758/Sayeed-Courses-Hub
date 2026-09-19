import "./globals.css";
import { AuthProvider } from "./providers";

export const metadata = {
  title: "Sayeed Courses Hub",
  description: "Premium course learning hub",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

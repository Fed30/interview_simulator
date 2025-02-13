import { Inter } from "next/font/google";
import "./globals.css";
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css'; 
import { AuthProvider } from './context/AuthContext';
import { LoadingProvider } from './context/LoadingContext';
import Spinner from './components/spinner';
import Header from './components/header';

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Interview Simulator",
  description: "Interview Simulator",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        <LoadingProvider>
          <AuthProvider>
              <Header />
            <main>
              {children} 
            </main>
            <Spinner />
            <ToastContainer position="bottom-center" autoClose={3000} hideProgressBar={true} />
          </AuthProvider>
        </LoadingProvider>
      </body>
    </html>
  );
}

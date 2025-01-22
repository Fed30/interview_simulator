import { Inter } from "next/font/google";
import "./globals.css";
import Header from './components/header';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; 
import { AuthProvider } from './context/AuthContext';
import { LoadingProvider } from './context/LoadingContext';
import Spinner from './components/spinner';

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Interview Simulator",
  description: "Interview Simulator",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} antialiased`} // Apply the correct class for the selected font
      >
        <LoadingProvider>
          <AuthProvider>
            <Header />
            {children}
            <Spinner />
            <ToastContainer position="bottom-center" autoClose={5000} hideProgressBar={true} />
          </AuthProvider>
        </LoadingProvider>
      </body>
    </html>
  );
}

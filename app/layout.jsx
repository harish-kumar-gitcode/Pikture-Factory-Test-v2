import { Playfair_Display, Poppins } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/components/ui/Toast';

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-playfair',
  display: 'swap',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata = {
  title: 'Pikture Factory — Premium Photography & Films',
  description:
    'Pikture Factory is a managed visual production studio for weddings, corporate, maternity and portrait storytelling.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${playfair.variable} ${poppins.variable}`}>
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}

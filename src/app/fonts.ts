import { Inter } from 'next/font/google';

// Configuração da fonte Inter
export const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  weight: ['400', '500', '600', '700'],
  style: ['normal'],
  preload: true,
});

import { Inter, JetBrains_Mono } from 'next/font/google';

// Configuração da fonte Inter
export const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
  weight: ['400', '500', '600', '700'],
  style: ['normal'],
  preload: true,
});

// Configuração da fonte JetBrains Mono para código
export const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  preload: true,
});

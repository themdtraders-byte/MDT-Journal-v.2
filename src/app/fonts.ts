
'use client';

import { Inter, Roboto_Mono, PT_Sans, Source_Code_Pro, Lato, Montserrat, Roboto } from 'next/font/google';

export const inter = Inter({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-body',
});

export const robotoMono = Roboto_Mono({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-code',
});


// Keep others for fallback or future use
export const ptSans = PT_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-pt-sans',
  weight: ['400', '700'],
});

export const sourceCodePro = Source_Code_Pro({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-source-code-pro',
  weight: ['400', '700'],
});

export const roboto = Roboto({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-roboto',
    weight: ['400', '700'],
});

export const lato = Lato({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-lato',
    weight: ['400', '700'],
});

export const montserrat = Montserrat({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-montserrat',
    weight: ['400', '700'],
});

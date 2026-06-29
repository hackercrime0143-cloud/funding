import './globals.css';

export const metadata = {
  title: 'FastPay - High Yield Secure FinTech Ecosystem',
  description: 'FastPay offers banking-grade secure deposits, unique peer transaction references, investment schemes, and a two-tier referral system.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#0b0c10" />
      </head>
      <body>
        <div className="app-container">
          {children}
        </div>
      </body>
    </html>
  );
}

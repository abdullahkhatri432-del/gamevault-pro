import './globals.css';

export const metadata = {
  title: 'GameVault Pro',
  description: 'A modern game account marketplace with reviews and secure orders.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

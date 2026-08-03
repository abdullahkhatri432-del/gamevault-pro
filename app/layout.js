import './globals.css';

export const metadata = {
  title: 'GameVault Pro',
  description: 'Buy GTA 5 money, level boosts, and upgrades with secure checkout.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

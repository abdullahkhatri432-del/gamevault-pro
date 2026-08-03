import Link from 'next/link';

export const metadata = {
  title: 'Safety & Privacy — GameVault Pro',
  description: 'How GameVault Pro protects your account details, handles payments, and keeps your orders safe.',
};

const sections = [
  {
    title: 'Your account details are encrypted',
    body: `When you place an order, your launcher and Rockstar sign-in details are encrypted with strong, modern encryption before they are saved. They are only ever decrypted when we need to deliver your order — and only by the people running the store. We never store passwords in plain text, and we never use your account for anything other than what you ordered.`,
  },
  {
    title: 'Payments are handled by Razorpay',
    body: `We do not see or store your card number, UPI ID, or banking details. All payments happen inside Razorpay's secure checkout. We only receive confirmation that your payment succeeded, so we can process your order.`,
  },
  {
    title: 'Sign in with Google only',
    body: `We do not keep local passwords on our site. You sign in with your Google account so we can identify your orders and send you updates. Google handles the authentication — we never see your Google password.`,
  },
  {
    title: 'What we store and why',
    body: `We store your name, email, your order, and the encrypted account details needed to complete that order. That data stays in our secure database and is never sold or shared with third parties. Coupon usage is tracked only to enforce promo limits.`,
  },
  {
    title: 'Your guarantees',
    body: `If your order is not delivered, we fix it or refund you. The service is discreet — we never post about your purchases anywhere public. And support is available any time if you have questions before, during, or after delivery.`,
  },
  {
    title: 'Tips for extra safety',
    body: `You can use a temporary password when placing an order and change it right after delivery. Make sure your Rockstar account has email access so you can verify changes. If anything looks off, contact us immediately and we will help you secure your account.`,
  },
];

export default function SafetyPage() {
  return (
    <main className="admin-shell">
      <section className="admin-card safety-page">
        <span className="eyebrow">Trust & transparency</span>
        <h1>Safety & privacy</h1>
        <p className="safety-lead">
          Selling your Rockstar access can feel scary — so we built our service around protecting you.
          Here is exactly how we keep your account and money safe.
        </p>
        <div className="safety-list">
          {sections.map((section) => (
            <article key={section.title}>
              <h2>{section.title}</h2>
              <p>{section.body}</p>
            </article>
          ))}
        </div>
        <div className="safety-footer">
          <p>Questions? Open an order and leave a note, or ask in the reviews.</p>
          <Link className="primary-btn" href="/">Back to the store</Link>
        </div>
      </section>
    </main>
  );
}

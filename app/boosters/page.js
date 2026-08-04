'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const GAMES = [
  { id: 'gta5', name: 'GTA V', icon: '🚗' },
  { id: 'valorant', name: 'Valorant', icon: '🔫' },
  { id: 'fortnite', name: 'Fortnite', icon: '🏗️' },
  { id: 'forza', name: 'Forza Horizon', icon: '🏎️' },
  { id: 'other', name: 'Other Games', icon: '🎮' },
];

const LAUNCHERS = {
  gta5: ['Steam', 'Epic Games', 'Rockstar Launcher'],
  valorant: ['Riot Client'],
  fortnite: ['Epic Games'],
  forza: ['Xbox App', 'Steam'],
  other: ['Steam', 'Epic Games', 'Other'],
};

const PLATFORMS = ['PC', 'PlayStation', 'Xbox', 'Nintendo Switch'];
const SERVICE_TYPES = ['Account Recovery', 'In-Game Carry', 'Premade Accounts', 'Rank Boosting'];

export default function BoosterOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '',
    whatsapp: '',
    discordTag: '',
    idDocumentUrl: '',
    selfieUrl: '',
    socialProof: '',
    upiId: '',
    bankDetails: '',
    cryptoWallet: '',
    supportedGames: [],
    supportedLaunchers: [],
    supportedPlatforms: [],
    supportedServiceTypes: [],
  });
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState('');

  const updateForm = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field, item) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter((i) => i !== item)
        : [...prev[field], item],
    }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setStatus('');

    try {
      const response = await fetch('/api/boosters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (response.ok) {
        setStatus('success');
        setTimeout(() => router.push('/'), 3000);
      } else {
        setStatus(result.message || 'Failed to submit application.');
      }
    } catch (error) {
      setStatus('An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    { id: 1, title: 'Personal Details', icon: '👤' },
    { id: 2, title: 'Identity Verification', icon: '🪪' },
    { id: 3, title: 'Gamer Profile', icon: '🎮' },
    { id: 4, title: 'Payment Details', icon: '💳' },
    { id: 5, title: 'Capabilities', icon: '⚡' },
    { id: 6, title: 'Review & Submit', icon: '✅' },
  ];

  return (
    <main className="min-h-screen bg-[#09090B] text-white p-6">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <a href="/" className="text-2xl font-bold text-[#7C3AED]">GameVault <span className="text-white">Pro</span></a>
          <h1 className="text-3xl font-bold mt-4">Booster Onboarding</h1>
          <p className="text-[#9CA3AF] mt-2">Join our network of verified gaming service providers</p>
        </header>

        <div className="flex justify-center mb-8">
          {steps.map((s) => (
            <div key={s.id} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                  step >= s.id ? 'bg-[#7C3AED] text-white' : 'bg-[#27272A] text-[#9CA3AF]'
                }`}
              >
                {s.icon}
              </div>
              {s.id < steps.length && <div className={`w-12 h-1 ${step > s.id ? 'bg-[#7C3AED]' : 'bg-[#27272A]'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-[#18181B] border border-[#374151] rounded-xl p-8">
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-6">Personal Details</h2>
              <label className="block">
                <span className="text-sm text-[#9CA3AF]">Full Legal Name *</span>
                <input value={formData.fullName} onChange={(e) => updateForm('fullName', e.target.value)} className="w-full px-4 py-3 bg-[#27272A] border border-[#374151] rounded-lg text-white mt-1" placeholder="John Doe" />
              </label>
              <label className="block">
                <span className="text-sm text-[#9CA3AF]">WhatsApp Number *</span>
                <input value={formData.whatsapp} onChange={(e) => updateForm('whatsapp', e.target.value)} className="w-full px-4 py-3 bg-[#27272A] border border-[#374151] rounded-lg text-white mt-1" placeholder="+91 98765 43210" />
              </label>
              <label className="block">
                <span className="text-sm text-[#9CA3AF]">Discord Tag *</span>
                <input value={formData.discordTag} onChange={(e) => updateForm('discordTag', e.target.value)} className="w-full px-4 py-3 bg-[#27272A] border border-[#374151] rounded-lg text-white mt-1" placeholder="username#1234" />
              </label>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-6">Identity Verification (KYC)</h2>
              <div className="bg-[#F59E0B20] border border-[#F59E0B50] rounded-lg p-4 mb-4">
                <p className="text-[#F59E0B] text-sm">Government-issued photo ID required (Aadhaar / PAN / Driver's License)</p>
              </div>
              <label className="block">
                <span className="text-sm text-[#9CA3AF]">ID Document URL</span>
                <input value={formData.idDocumentUrl} onChange={(e) => updateForm('idDocumentUrl', e.target.value)} className="w-full px-4 py-3 bg-[#27272A] border border-[#374151] rounded-lg text-white mt-1" placeholder="https://example.com/id-document.jpg" />
              </label>
              <label className="block">
                <span className="text-sm text-[#9CA3AF]">Selfie Verification URL</span>
                <input value={formData.selfieUrl} onChange={(e) => updateForm('selfieUrl', e.target.value)} className="w-full px-4 py-3 bg-[#27272A] border border-[#374151] rounded-lg text-white mt-1" placeholder="https://example.com/selfie.jpg" />
              </label>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-6">Gamer Identity & Social Proof</h2>
              <label className="block">
                <span className="text-sm text-[#9CA3AF]">Existing Store Profiles / Vouches</span>
                <textarea value={formData.socialProof} onChange={(e) => updateForm('socialProof', e.target.value)} className="w-full px-4 py-3 bg-[#27272A] border border-[#374151] rounded-lg text-white mt-1 h-32" placeholder="Links to G2G, Eldorado, or other profiles with screenshots" />
              </label>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-6">Payment Details</h2>
              <label className="block">
                <span className="text-sm text-[#9CA3AF]">UPI ID</span>
                <input value={formData.upiId} onChange={(e) => updateForm('upiId', e.target.value)} className="w-full px-4 py-3 bg-[#27272A] border border-[#374151] rounded-lg text-white mt-1" placeholder="username@upi" />
              </label>
              <label className="block">
                <span className="text-sm text-[#9CA3AF]">Bank Details</span>
                <input value={formData.bankDetails} onChange={(e) => updateForm('bankDetails', e.target.value)} className="w-full px-4 py-3 bg-[#27272A] border border-[#374151] rounded-lg text-white mt-1" placeholder="Account number, IFSC, Bank name" />
              </label>
              <label className="block">
                <span className="text-sm text-[#9CA3AF]">Crypto Wallet Address</span>
                <input value={formData.cryptoWallet} onChange={(e) => updateForm('cryptoWallet', e.target.value)} className="w-full px-4 py-3 bg-[#27272A] border border-[#374151] rounded-lg text-white mt-1" placeholder="USDT/BTC wallet address" />
              </label>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-6">Capability Checklist</h2>

              <div>
                <h3 className="text-lg font-semibold mb-3">Supported Games</h3>
                <div className="flex flex-wrap gap-2">
                  {GAMES.map((game) => (
                    <button key={game.id} type="button" className={`px-4 py-2 rounded-lg border transition-colors ${formData.supportedGames.includes(game.id) ? 'bg-[#7C3AED] border-[#7C3AED]' : 'bg-[#27272A] border-[#374151]'}`} onClick={() => toggleArrayItem('supportedGames', game.id)}>
                      {game.icon} {game.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Supported Launchers</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.values(LAUNCHERS).flat().filter((v, i, a) => a.indexOf(v) === i).map((launcher) => (
                    <button key={launcher} type="button" className={`px-4 py-2 rounded-lg border transition-colors ${formData.supportedLaunchers.includes(launcher) ? 'bg-[#7C3AED] border-[#7C3AED]' : 'bg-[#27272A] border-[#374151]'}`} onClick={() => toggleArrayItem('supportedLaunchers', launcher)}>
                      {launcher}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Supported Platforms</h3>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.map((platform) => (
                    <button key={platform} type="button" className={`px-4 py-2 rounded-lg border transition-colors ${formData.supportedPlatforms.includes(platform) ? 'bg-[#7C3AED] border-[#7C3AED]' : 'bg-[#27272A] border-[#374151]'}`} onClick={() => toggleArrayItem('supportedPlatforms', platform)}>
                      {platform}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Supported Service Types</h3>
                <div className="flex flex-wrap gap-2">
                  {SERVICE_TYPES.map((type) => (
                    <button key={type} type="button" className={`px-4 py-2 rounded-lg border transition-colors ${formData.supportedServiceTypes.includes(type) ? 'bg-[#7C3AED] border-[#7C3AED]' : 'bg-[#27272A] border-[#374151]'}`} onClick={() => toggleArrayItem('supportedServiceTypes', type)}>
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-6">Review & Submit</h2>
              <div className="bg-[#27272A] rounded-lg p-6 space-y-4">
                <div><span className="text-[#9CA3AF]">Name:</span> {formData.fullName}</div>
                <div><span className="text-[#9CA3AF]">WhatsApp:</span> {formData.whatsapp}</div>
                <div><span className="text-[#9CA3AF]">Discord:</span> {formData.discordTag}</div>
                <div><span className="text-[#9CA3AF]">Games:</span> {formData.supportedGames.join(', ') || 'None selected'}</div>
                <div><span className="text-[#9CA3AF]">Launchers:</span> {formData.supportedLaunchers.join(', ') || 'None selected'}</div>
                <div><span className="text-[#9CA3AF]">Platforms:</span> {formData.supportedPlatforms.join(', ') || 'None selected'}</div>
                <div><span className="text-[#9CA3AF]">Services:</span> {formData.supportedServiceTypes.join(', ') || 'None selected'}</div>
              </div>

              <div className="bg-[#F59E0B20] border border-[#F59E0B50] rounded-lg p-4">
                <h3 className="text-[#F59E0B] font-semibold mb-2">Mandatory Booster SLAs</h3>
                <ul className="text-sm text-[#9CA3AF] space-y-2">
                  <li>• 7-14 day escrow hold on all payouts</li>
                  <li>• Strict anti-ban policy compliance required</li>
                  <li>• Immediate suspension for unsafe methods</li>
                  <li>• Security deposit may be required</li>
                </ul>
              </div>

              {status === 'success' ? (
                <div className="bg-[#10B98120] border border-[#10B98150] rounded-lg p-4 text-center">
                  <p className="text-[#10B981] text-lg font-semibold">Application submitted successfully!</p>
                  <p className="text-[#9CA3AF] text-sm mt-2">Redirecting to homepage...</p>
                </div>
              ) : (
                <button className="primary-btn full" onClick={handleSubmit} disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </button>
              )}
              {status && status !== 'success' && <p className="text-[#EF4444] text-sm">{status}</p>}
            </div>
          )}

          <div className="flex justify-between mt-8">
            {step > 1 && (
              <button className="secondary-btn" onClick={() => setStep(step - 1)}>Previous</button>
            )}
            {step < 6 && (
              <button className="primary-btn ml-auto" onClick={() => setStep(step + 1)}>Next</button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

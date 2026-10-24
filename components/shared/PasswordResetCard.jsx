'use client';

import { useState } from 'react';
import { KeyRound, MailCheck } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export default function PasswordResetCard({ role, email }) {
  const [busy, setBusy] = useState(false);
  const showToast = useToast();

  async function resetPassword() {
    if (busy || !email) return;
    const confirmed = window.confirm('Generate a new password and send it to your registered email address? Your current password will stop working immediately.');
    if (!confirmed) return;
    setBusy(true);
    try {
      const res = await fetch('/api/auth/password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to reset password.');
      showToast('A new password has been sent to your email.', 'success');
    } catch (error) {
      showToast(error.message || 'Unable to reset password.', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel border-gold/20 bg-gradient-to-br from-white to-[#FCFAF5]">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gold/10 text-gold flex items-center justify-center shrink-0">
          <KeyRound size={18} />
        </div>
        <div>
          <h3 className="text-lg font-head">Forgot your password?</h3>
          <p className="text-sm text-secondary mt-1 leading-6">Generate a fresh password and have it sent to your registered email. Your current password will be replaced.</p>
        </div>
      </div>
      <div className="mt-4 rounded-xl bg-bglight border border-border px-3.5 py-3 flex items-center gap-2 text-xs text-secondary">
        <MailCheck size={14} className="text-gold shrink-0" />
        <span>It will be sent to <b className="text-primary">{email}</b></span>
      </div>
      <button type="button" onClick={resetPassword} disabled={busy || !email} className="btn btn-outline mt-4 disabled:opacity-60">
        <KeyRound size={14} /> {busy ? 'Sending new password…' : 'Reset password & email me'}
      </button>
    </div>
  );
}

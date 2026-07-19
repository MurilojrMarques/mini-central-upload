import { useEffect, useState } from 'react';
import { useDraft } from '../context/DraftContext';
import { listProfiles } from '../api/client';
import type { ProfileView } from '../types';

export function StepConnection() {
  const { draft, updatePayload, setStep } = useDraft();
  const [profiles, setProfiles] = useState<ProfileView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listProfiles()
      .then(setProfiles)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const selectedProfile = profiles.find((p) => p.id === draft.payload.profileId);
  const selectedAccount = selectedProfile?.accounts.find(
    (a) => a.actId === draft.payload.accountId,
  );

  // Trocar de perfil limpa app/conta/página/pixel — eles pertencem ao perfil anterior.
  const handleProfile = (profileId: string) => {
    updatePayload({
      profileId,
      appId: undefined,
      accountId: undefined,
      pageId: undefined,
      pixelId: undefined,
    });
  };

  // Trocar de conta limpa página/pixel — são ativos da conta anterior.
  const handleAccount = (accountId: string) => {
    updatePayload({ accountId, pageId: undefined, pixelId: undefined });
  };

  const canProceed = draft.payload.profileId && draft.payload.appId && draft.payload.accountId;

  if (loading) return <p className="text-gray-500">Carregando perfis…</p>;
  if (error)
    return (
      <div className="text-red-600">
        {error} — confira se o backend está no ar e se o seed rodou.
      </div>
    );

  return (
    <div className="space-y-6">
      <section>
        <label className="block text-sm font-medium text-gray-700 mb-2">Perfil de acesso</label>
        <div className="grid gap-3 sm:grid-cols-2">
          {profiles.map((p) => (
            <button
              key={p.id}
              onClick={() => handleProfile(p.id)}
              className={`text-left border rounded-lg p-4 transition ${
                draft.payload.profileId === p.id
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium text-gray-900">{p.name}</div>
              <div className="text-xs text-gray-500 mt-1">Proxy: {p.proxyMasked}</div>
              <div className="text-xs text-gray-500">
                {p.apps.length} app(s) · {p.accounts.length} conta(s)
              </div>
            </button>
          ))}
        </div>
      </section>

      {selectedProfile && (
        <section>
          <label className="block text-sm font-medium text-gray-700 mb-2">Aplicativo</label>
          <select
            className="border rounded-lg px-3 py-2 w-full"
            value={draft.payload.appId ?? ''}
            onChange={(e) => updatePayload({ appId: e.target.value })}
          >
            <option value="">Selecione…</option>
            {selectedProfile.apps.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} (token {a.tokenMasked})
              </option>
            ))}
          </select>
        </section>
      )}

      {selectedProfile && (
        <section>
          <label className="block text-sm font-medium text-gray-700 mb-2">Conta de anúncios</label>
          <select
            className="border rounded-lg px-3 py-2 w-full"
            value={draft.payload.accountId ?? ''}
            onChange={(e) => handleAccount(e.target.value)}
          >
            <option value="">Selecione…</option>
            {selectedProfile.accounts.map((a) => (
              <option key={a.id} value={a.actId}>
                {a.actId}
              </option>
            ))}
          </select>
          {selectedAccount && (
            <p className="text-xs text-gray-500 mt-1">
              Ativos: {selectedAccount.pages.length} página(s), {selectedAccount.pixels.length} pixel(s)
            </p>
          )}
        </section>
      )}

      <div className="flex justify-end pt-4 border-t">
        <button
          disabled={!canProceed}
          onClick={() => setStep(1)}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Continuar
        </button>
      </div>
    </div>
  );
}
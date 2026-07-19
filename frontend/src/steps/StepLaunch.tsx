import { useEffect, useState } from 'react';
import { useDraft } from '../context/DraftContext';
import { listProfiles, uploadVideo } from '../api/client';
import type { ProfileView } from '../types';

export function StepLaunch() {
  const { draft, updatePayload, setStep } = useDraft();
  const { payload } = draft;

  const [profiles, setProfiles] = useState<ProfileView[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    listProfiles().then(setProfiles).catch(() => { });
  }, []);

  const account = profiles
    .find((p) => p.id === payload.profileId)
    ?.accounts.find((a) => a.actId === payload.accountId);

  const handleUpload = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const { mediaId, name } = await uploadVideo(file);
      // Guardamos só o identificador e o nome — nunca o arquivo (sobrevive ao F5).
      updatePayload({ mediaId, mediaName: name });
    } catch (e) {
      setUploadError((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Vídeo */}
      <section>
        <label className="block text-sm font-medium text-gray-700 mb-2">Vídeo (.mp4)</label>

        <label
          htmlFor="video-input"
          className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg p-6 cursor-pointer transition ${payload.mediaId
              ? 'border-green-400 bg-green-50'
              : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
            }`}
        >
          <input
            id="video-input"
            type="file"
            accept="video/mp4"
            onChange={(e) => handleUpload(e.target.files?.[0])}
            className="hidden"
          />

          {uploading ? (
            <span className="text-sm text-blue-600">Enviando…</span>
          ) : payload.mediaId ? (
            <>
              <span className="text-2xl">✓</span>
              <span className="text-sm text-green-700 font-medium">{payload.mediaName}</span>
              <span className="text-xs text-gray-500">
                Recebido pelo servidor · id: {payload.mediaId}
              </span>
              <span className="text-xs text-blue-600 underline">Trocar vídeo</span>
            </>
          ) : (
            <>
              <span className="text-3xl text-gray-400">⬆</span>
              <span className="text-sm text-gray-700 font-medium">
                Clique para selecionar um vídeo .mp4
              </span>
              <span className="text-xs text-gray-400">O arquivo é enviado ao servidor</span>
            </>
          )}
        </label>

        {uploadError && <p className="text-sm text-red-600 mt-2">{uploadError}</p>}
      </section>

      {/* Campanha + conjuntos */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Nome da campanha</label>
          <input
            className="border rounded-lg px-3 py-2 w-full"
            value={payload.campaignName ?? ''}
            onChange={(e) => updatePayload({ campaignName: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Conjuntos de anúncios</label>
          <input
            type="number"
            min={1}
            className="border rounded-lg px-3 py-2 w-full"
            value={payload.adSetCount ?? ''}
            onChange={(e) => updatePayload({ adSetCount: Number(e.target.value) || undefined })}
          />
        </div>
      </div>

      {/* Orçamento */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Orçamento diário (R$)</label>
        <input
          type="number"
          min={1}
          className="border rounded-lg px-3 py-2 w-full"
          value={payload.budget ?? ''}
          onChange={(e) => updatePayload({ budget: Number(e.target.value) || undefined })}
        />
      </div>

      {/* Página + pixel (ativos da conta selecionada) */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Página</label>
          <select
            className="border rounded-lg px-3 py-2 w-full"
            value={payload.pageId ?? ''}
            onChange={(e) => updatePayload({ pageId: e.target.value })}
          >
            <option value="">Selecione…</option>
            {account?.pages.map((pg) => (
              <option key={pg.id} value={pg.id}>{pg.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Pixel</label>
          <select
            className="border rounded-lg px-3 py-2 w-full"
            value={payload.pixelId ?? ''}
            onChange={(e) => updatePayload({ pixelId: e.target.value })}
          >
            <option value="">Selecione…</option>
            {account?.pixels.map((px) => (
              <option key={px.id} value={px.id}>{px.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Link + tracking */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Link de destino</label>
        <input
          className="border rounded-lg px-3 py-2 w-full"
          placeholder="https://…"
          value={payload.link ?? ''}
          onChange={(e) => updatePayload({ link: e.target.value })}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Parâmetros de rastreamento
        </label>
        <input
          className="border rounded-lg px-3 py-2 w-full"
          placeholder="utm_source=facebook&utm_campaign=teste"
          value={payload.tracking ?? ''}
          onChange={(e) => updatePayload({ tracking: e.target.value })}
        />
      </div>

      {/* Resumo — o operador confere antes de qualquer objeto existir na Meta */}
      <section className="bg-gray-50 border rounded-lg p-4 text-sm">
        <h3 className="font-medium text-gray-900 mb-2">Resumo da leva</h3>
        <ul className="space-y-1 text-gray-700">
          <li>
            <strong>1 campanha</strong> · {payload.adSetCount ?? 0} conjunto(s) ·{' '}
            {payload.adSetCount ?? 0} anúncio(s)
          </li>
          <li>Perfil: {payload.profileId ?? '—'} · App: {payload.appId ?? '—'} · Conta: {payload.accountId ?? '—'}</li>
          <li>Vídeo: {payload.mediaName ?? '—'}</li>
          <li>Orçamento diário: R$ {payload.budget ?? '—'}</li>
          <li>Página: {account?.pages.find((p) => p.id === payload.pageId)?.name ?? '—'} · Pixel: {account?.pixels.find((p) => p.id === payload.pixelId)?.name ?? '—'}</li>
          <li>Link: {payload.link ?? '—'}</li>
          <li>Tracking: {payload.tracking || '(vazio)'}</li>
        </ul>
        <p className="text-xs text-gray-500 mt-2">Tudo será criado como PAUSED.</p>
      </section>

      <div className="flex justify-between pt-4 border-t">
        <button onClick={() => setStep(0)} className="text-gray-600 px-4 py-2">
          Voltar
        </button>
        <button
          onClick={() => setStep(2)}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg font-medium"
        >
          Conferir antes de subir
        </button>
      </div>
    </div>
  );
}
import { useState } from 'react';
import { createProfile } from '../api/client';

interface Props {
  onClose: () => void;
  onCreated: () => void; // recarrega a lista de perfis
}

export function CreateProfileModal({ onClose, onCreated }: Props) {
  const [name, setName] = useState('');
  const [proxy, setProxy] = useState('');
  const [apps, setApps] = useState([{ name: '', token: '' }]);
  const [actId, setActId] = useState('');
  const [pages, setPages] = useState(['']);
  const [pixels, setPixels] = useState(['']);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateApp = (i: number, field: 'name' | 'token', value: string) =>
    setApps((a) => a.map((app, idx) => (idx === i ? { ...app, [field]: value } : app)));

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);
    try {
      await createProfile({
        name,
        proxy,
        apps,
        accounts: [
          {
            actId,
            pages: pages.filter((p) => p.trim()).map((name) => ({ name })),
            pixels: pixels.filter((p) => p.trim()).map((name) => ({ name })),
          },
        ],
      });
      onCreated();
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Novo perfil</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome do perfil</label>
          <input className="border rounded-lg px-3 py-2 w-full" value={name}
            onChange={(e) => setName(e.target.value)} placeholder="Perfil Delta" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Proxy</label>
          <input className="border rounded-lg px-3 py-2 w-full" value={proxy}
            onChange={(e) => setProxy(e.target.value)} placeholder="proxy-delta.test:8004" />
        </div>

        {/* Apps — pelo menos um, com opção de adicionar */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium text-gray-700">Aplicativos</label>
            <button type="button" onClick={() => setApps((a) => [...a, { name: '', token: '' }])}
              className="text-xs text-blue-600 hover:underline">+ adicionar app</button>
          </div>
          <div className="space-y-2">
            {apps.map((app, i) => (
              <div key={i} className="flex gap-2">
                <input className="border rounded-lg px-3 py-2 flex-1" placeholder="Nome do app"
                  value={app.name} onChange={(e) => updateApp(i, 'name', e.target.value)} />
                <input className="border rounded-lg px-3 py-2 flex-1" placeholder="Token"
                  value={app.token} onChange={(e) => updateApp(i, 'token', e.target.value)} />
                {apps.length > 1 && (
                  <button type="button" onClick={() => setApps((a) => a.filter((_, idx) => idx !== i))}
                    className="text-red-500 px-2">×</button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Conta única, com páginas e pixels */}
        <div className="border-t pt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Conta de anúncios (actId)</label>
          <input className="border rounded-lg px-3 py-2 w-full mb-3" value={actId}
            onChange={(e) => setActId(e.target.value)} placeholder="act_4001" />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">Páginas</span>
                <button type="button" onClick={() => setPages((p) => [...p, ''])}
                  className="text-xs text-blue-600 hover:underline">+</button>
              </div>
              {pages.map((pg, i) => (
                <input key={i} className="border rounded-lg px-2 py-1.5 w-full mb-1 text-sm"
                  placeholder="Nome da página" value={pg}
                  onChange={(e) => setPages((p) => p.map((v, idx) => (idx === i ? e.target.value : v)))} />
              ))}
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">Pixels</span>
                <button type="button" onClick={() => setPixels((p) => [...p, ''])}
                  className="text-xs text-blue-600 hover:underline">+</button>
              </div>
              {pixels.map((px, i) => (
                <input key={i} className="border rounded-lg px-2 py-1.5 w-full mb-1 text-sm"
                  placeholder="Nome do pixel" value={px}
                  onChange={(e) => setPixels((p) => p.map((v, idx) => (idx === i ? e.target.value : v)))} />
              ))}
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-2">{error}</p>}

        <div className="flex justify-end gap-2 border-t pt-4">
          <button onClick={onClose} className="px-4 py-2 text-gray-600">Cancelar</button>
          <button onClick={handleSubmit} disabled={saving}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg font-medium disabled:bg-gray-300">
            {saving ? 'Salvando…' : 'Criar perfil'}
          </button>
        </div>
      </div>
    </div>
  );
}
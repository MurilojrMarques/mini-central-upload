import { DraftProvider, useDraft } from './context/DraftContext';
import { StepConnection } from './steps/StepConnection';
import { StepLaunch } from './steps/StepLaunch';
import { StepPreflight } from './steps/StepPreflight';

const STEPS = ['Conexão', 'Montar a leva', 'Pré-voo e envio'];

function Wizard() {
  const { draft, setStep } = useDraft();

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Central de Upload de Anúncios</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure a leva, confira o pré-voo e simule o envio.
        </p>
      </header>

      <ol className="flex items-center gap-2 mb-8 text-sm">
        {STEPS.map((label, i) => {
          const isCurrent = i === draft.step;
          const isVisited = i < draft.step;
          const clickable = isVisited; // só volta para passos já visitados
          return (
            <li key={label} className="flex items-center gap-2">
              <button
                type="button"
                disabled={!clickable && !isCurrent}
                onClick={() => clickable && setStep(i)}
                className={`flex items-center gap-2 ${clickable ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <span
                  className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                    isCurrent
                      ? 'bg-blue-600 text-white'
                      : isVisited
                        ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                        : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {i + 1}
                </span>
                <span
                  className={
                    isCurrent
                      ? 'text-gray-900 font-medium'
                      : isVisited
                        ? 'text-blue-700 hover:underline'
                        : 'text-gray-400'
                  }
                >
                  {label}
                </span>
              </button>
              {i < STEPS.length - 1 && <span className="text-gray-300 mx-1">→</span>}
            </li>
          );
        })}
      </ol>

      {draft.step === 0 && <StepConnection />}
      {draft.step === 1 && <StepLaunch />}
      {draft.step === 2 && <StepPreflight />}
    </div>
  );
}

export default function App() {
  return (
    <DraftProvider>
      <Wizard />
    </DraftProvider>
  );
}
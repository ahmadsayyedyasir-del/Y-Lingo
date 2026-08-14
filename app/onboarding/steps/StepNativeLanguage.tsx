'use client';

interface StepNativeLanguageProps {
  formData: {
    native_language: string;
    learning_language: string;
    level: string;
    learning_style: string;
    daily_goal: number;
  };
  updateFormData: (data: Partial<StepNativeLanguageProps['formData']>) => void;
  onNext: () => void;
}

const languages = [
  { value: 'ur', label: 'Urdu' },
  { value: 'en', label: 'English' },
  { value: 'ar', label: 'Arabic' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'hi', label: 'Hindi' },
  { value: 'tr', label: 'Turkish' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ru', label: 'Russian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'it', label: 'Italian' },
  { value: 'nl', label: 'Dutch' },
  { value: 'ko', label: 'Korean' },
];

export default function StepNativeLanguage({ formData, updateFormData, onNext }: StepNativeLanguageProps) {
  const handleSelect = (value: string) => {
    updateFormData({ native_language: value });
    setTimeout(onNext, 300);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">What is your native language? 🌍</h2>
      <p className="text-gray-400 mb-6">Select your mother tongue</p>

      <div className="grid grid-cols-2 gap-3">
        {languages.map((lang) => (
          <button
            key={lang.value}
            onClick={() => handleSelect(lang.value)}
            className={`px-4 py-3 rounded-lg border text-center transition ${
              formData.native_language === lang.value
                ? 'border-blue-500 bg-blue-500/20 text-white'
                : 'border-gray-700 text-gray-300 hover:border-gray-500'
            }`}
          >
            {lang.label}
          </button>
        ))}
      </div>
    </div>
  );
}
'use client';

interface StepLearningLanguageProps {
  formData: {
    native_language: string;
    learning_language: string;
    level: string;
    learning_style: string;
    daily_goal: number;
  };
  updateFormData: (data: Partial<StepLearningLanguageProps['formData']>) => void;
  onNext: () => void;
}

const languages = [
  { value: 'en', label: 'English' },
  { value: 'ur', label: 'Urdu' },
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

export default function StepLearningLanguage({ formData, updateFormData, onNext }: StepLearningLanguageProps) {
  const handleSelect = (value: string) => {
    updateFormData({ learning_language: value });
    setTimeout(onNext, 300);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">What language do you want to learn? 🎯</h2>
      <p className="text-gray-400 mb-6">Choose the language you want to practice</p>

      <div className="grid grid-cols-2 gap-3">
        {languages.map((lang) => (
          <button
            key={lang.value}
            onClick={() => handleSelect(lang.value)}
            className={`px-4 py-3 rounded-lg border text-center transition ${
              formData.learning_language === lang.value
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
'use client';

interface StepLevelProps {
  formData: {
    native_language: string;
    learning_language: string;
    level: string;
    learning_style: string;
    daily_goal: number;
  };
  updateFormData: (data: Partial<StepLevelProps['formData']>) => void;
  onNext: () => void;
}

const levels = [
  { value: 'beginner', label: 'Beginner', description: 'New to the language' },
  { value: 'intermediate', label: 'Intermediate', description: 'Can hold basic conversations' },
  { value: 'advanced', label: 'Advanced', description: 'Confident in speaking' },
];

export default function StepLevel({ formData, updateFormData, onNext }: StepLevelProps) {
  const handleSelect = (value: string) => {
    updateFormData({ level: value });
    setTimeout(onNext, 300);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">What is your current level? 📊</h2>
      <p className="text-gray-400 mb-6">This helps us personalize your learning</p>

      <div className="space-y-3">
        {levels.map((level) => (
          <button
            key={level.value}
            onClick={() => handleSelect(level.value)}
            className={`w-full px-4 py-4 rounded-lg border text-left transition ${
              formData.level === level.value
                ? 'border-blue-500 bg-blue-500/20'
                : 'border-gray-700 hover:border-gray-500'
            }`}
          >
            <div className="font-medium text-white">{level.label}</div>
            <div className="text-sm text-gray-400">{level.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
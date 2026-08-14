'use client';

interface StepLearningStyleProps {
  formData: {
    native_language: string;
    learning_language: string;
    level: string;
    learning_style: string;
    daily_goal: number;
  };
  updateFormData: (data: Partial<StepLearningStyleProps['formData']>) => void;
  onNext: () => void;
}

const styles = [
  { 
    value: 'conversation-first', 
    label: '💬 Conversation First', 
    description: 'Learn by speaking naturally with AI' 
  },
  { 
    value: 'structured', 
    label: '📚 Structured Learning', 
    description: 'Step-by-step lessons and exercises' 
  },
  { 
    value: 'mixed', 
    label: '🔄 Mixed', 
    description: 'A balanced combination of both' 
  },
];

export default function StepLearningStyle({ formData, updateFormData, onNext }: StepLearningStyleProps) {
  const handleSelect = (value: string) => {
    updateFormData({ learning_style: value });
    setTimeout(onNext, 300);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">How do you prefer to learn? 🎓</h2>
      <p className="text-gray-400 mb-6">Choose your learning style</p>

      <div className="space-y-3">
        {styles.map((style) => (
          <button
            key={style.value}
            onClick={() => handleSelect(style.value)}
            className={`w-full px-4 py-4 rounded-lg border text-left transition ${
              formData.learning_style === style.value
                ? 'border-blue-500 bg-blue-500/20'
                : 'border-gray-700 hover:border-gray-500'
            }`}
          >
            <div className="font-medium text-white">{style.label}</div>
            <div className="text-sm text-gray-400">{style.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
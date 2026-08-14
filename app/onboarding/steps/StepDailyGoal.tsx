'use client';

interface StepDailyGoalProps {
  formData: {
    native_language: string;
    learning_language: string;
    level: string;
    learning_style: string;
    daily_goal: number;
  };
  updateFormData: (data: Partial<StepDailyGoalProps['formData']>) => void;
  onNext: () => void;
}

const goals = [5, 10, 15, 20, 30, 45, 60];

export default function StepDailyGoal({ formData, updateFormData, onNext }: StepDailyGoalProps) {
  const handleSelect = (value: number) => {
    updateFormData({ daily_goal: value });
    setTimeout(onNext, 300);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">What is your daily goal? 🎯</h2>
      <p className="text-gray-400 mb-6">How many minutes do you want to practice each day?</p>

      <div className="grid grid-cols-3 gap-3">
        {goals.map((goal) => (
          <button
            key={goal}
            onClick={() => handleSelect(goal)}
            className={`px-4 py-4 rounded-lg border text-center transition ${
              formData.daily_goal === goal
                ? 'border-blue-500 bg-blue-500/20 text-white'
                : 'border-gray-700 text-gray-300 hover:border-gray-500'
            }`}
          >
            <div className="text-xl font-bold">{goal}</div>
            <div className="text-xs text-gray-400">min</div>
          </button>
        ))}
      </div>
    </div>
  );
}
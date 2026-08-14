// app/onboarding/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/lib/api';
import { profileEndpoints } from '@/lib/endpoints';

// Step components
import StepNativeLanguage from './steps/StepNativeLanguage';
import StepLearningLanguage from './steps/StepLearningLanguage';
import StepLevel from './steps/StepLevel';
import StepLearningStyle from './steps/StepLearningStyle';
import StepDailyGoal from './steps/StepDailyGoal';
import StepComplete from './steps/StepComplete';

// Define form data type
interface FormData {
  native_language: string;
  learning_language: string;
  level: string;
  learning_style: string;
  daily_goal: number;
}

// Define API error type
interface ApiError {
  response?: {
    data?: {
      detail?: string;
    };
  };
}

export default function OnboardingPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    native_language: '',
    learning_language: '',
    level: 'beginner',
    learning_style: 'conversation-first',
    daily_goal: 10,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [profileChecked, setProfileChecked] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    // Once authenticated, check if profile already has native_language set.
    // user.profile does not exist on UserResponse — must fetch from /profile.
    if (isAuthenticated && !profileChecked) {
      setProfileChecked(true);
      profileEndpoints.get().then((res) => {
        if (res.data?.native_language && res.data.native_language.trim() !== '') {
          router.push('/dashboard');
        }
      }).catch(() => {
        // Profile fetch failed — proceed with onboarding normally
      });
    }
  }, [isLoading, isAuthenticated, router, profileChecked]);

  const totalSteps = 6;

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateFormData = (data: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      console.log('📤 Saving onboarding data:', formData);
      
      // Update profile with onboarding data
      await apiClient.put('/profile', {
        native_language: formData.native_language,
        learning_language: formData.learning_language,
        level: formData.level === 'beginner' ? 1 : formData.level === 'intermediate' ? 2 : 3,
        learning_style: formData.learning_style,
        daily_goal: formData.daily_goal,
      });

      console.log('✅ Onboarding completed successfully!');
      
      // Move to complete step
      setCurrentStep(totalSteps - 1);
      
      // After showing complete, redirect to dashboard
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
      
    } catch (err) {
      console.error('❌ Onboarding failed:', err);
      const apiError = err as ApiError;
      setError(apiError?.response?.data?.detail || 'Failed to save preferences. Please try again.');
      setIsSubmitting(false);
    }
  };

  // Steps array with proper typing
  const steps = [
    {
      component: StepNativeLanguage,
      props: { formData, updateFormData, onNext: handleNext },
    },
    {
      component: StepLearningLanguage,
      props: { formData, updateFormData, onNext: handleNext },
    },
    {
      component: StepLevel,
      props: { formData, updateFormData, onNext: handleNext },
    },
    {
      component: StepLearningStyle,
      props: { formData, updateFormData, onNext: handleNext },
    },
    {
      component: StepDailyGoal,
      props: { formData, updateFormData, onNext: handleNext },
    },
    {
      component: StepComplete,
      props: { formData },
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const CurrentStepComponent = steps[currentStep].component;
  const stepProps = steps[currentStep].props;

  // Show complete step differently
  if (currentStep === totalSteps - 1) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <CurrentStepComponent {...stepProps} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Step {currentStep + 1} of {totalSteps - 1}</span>
            <span>{Math.round(((currentStep + 1) / (totalSteps - 1)) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / (totalSteps - 1)) * 100}%` }}
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Step Content */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-8">
          <CurrentStepComponent {...stepProps} />
          
          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-800">
            {currentStep > 0 && (
              <button
                onClick={handleBack}
                className="px-6 py-2 text-gray-400 hover:text-white transition"
              >
                Back
              </button>
            )}
            
            {currentStep === totalSteps - 2 ? (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="ml-auto px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:opacity-90 transition disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Complete Setup'}
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="ml-auto px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:opacity-90 transition"
              >
                Continue →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
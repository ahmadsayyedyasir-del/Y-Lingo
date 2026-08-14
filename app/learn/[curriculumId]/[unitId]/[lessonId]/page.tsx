// app/learn/[curriculumId]/[unitId]/[lessonId]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { curriculumEndpoints, lessonProgressEndpoints } from '@/lib/endpoints';

interface Exercise {
  id: string;
  exercise_type: string;
  prompt: string;
  content: any;
  points: number;
  order_index: number;
}

interface LessonDetail {
  id: string;
  title: string;
  description: string;
  learning_objectives: string[];
  exercises: Exercise[];
}

export default function LessonPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const lessonId = params.lessonId as string;

  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState<any>(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    const fetchLesson = async () => {
      try {
        setLoading(true);
        console.log('📚 Fetching lesson:', lessonId);
        
        // Get lesson details
        const lessonResponse = await curriculumEndpoints.getLesson(lessonId);
        setLesson(lessonResponse.data);
        
        // Get progress
        try {
          const progressResponse = await lessonProgressEndpoints.getProgress(lessonId);
          setProgress(progressResponse.data);
        } catch {
          // Progress not started yet
          setProgress(null);
        }
        
        console.log('✅ Lesson fetched:', lessonResponse.data);
      } catch (err) {
        console.error('❌ Failed to fetch lesson:', err);
        setError('Failed to load lesson.');
      } finally {
        setLoading(false);
      }
    };

    if (lessonId) {
      fetchLesson();
    }
  }, [lessonId, isAuthenticated, isLoading, router]);

  const handleStartLesson = async () => {
    try {
      const response = await lessonProgressEndpoints.start(lessonId);
      setProgress(response.data);
      console.log('✅ Lesson started:', response.data);
    } catch (err) {
      console.error('❌ Failed to start lesson:', err);
      setError('Failed to start lesson.');
    }
  };

  const handleExerciseSubmit = async (exerciseId: string, answer: any) => {
    try {
      const response = await lessonProgressEndpoints.submitExercise(lessonId, exerciseId, { answer });
      console.log('✅ Exercise submitted:', response.data);
      
      // Move to next exercise
      if (lesson && currentExerciseIndex < lesson.exercises.length - 1) {
        setCurrentExerciseIndex(currentExerciseIndex + 1);
      }
      
      // Refresh progress
      const progressResponse = await lessonProgressEndpoints.getProgress(lessonId);
      setProgress(progressResponse.data);
      
    } catch (err) {
      console.error('❌ Failed to submit exercise:', err);
      setError('Failed to submit exercise.');
    }
  };

  const handleCompleteLesson = async () => {
    try {
      const response = await lessonProgressEndpoints.complete(lessonId);
      console.log('✅ Lesson completed:', response.data);
      setProgress(response.data);
      
      // Redirect to unit page after completion
      setTimeout(() => {
        router.push(`/learn/${params.curriculumId}/${params.unitId}`);
      }, 2000);
      
    } catch (err) {
      console.error('❌ Failed to complete lesson:', err);
      setError('Failed to complete lesson.');
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated || !lesson) {
    return null;
  }

  const isCompleted = progress?.status === 'completed';
  const currentExercise = lesson.exercises[currentExerciseIndex];

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-4xl mx-auto">
        <Link href={`/learn/${params.curriculumId}/${params.unitId}`} className="text-blue-400 hover:text-blue-300 mb-4 inline-block">
          ← Back to Lessons
        </Link>

        <h1 className="text-3xl font-bold text-white mb-2">{lesson.title}</h1>
        <p className="text-gray-400 mb-6">{lesson.description}</p>

        {progress && (
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-gray-400 text-sm">Progress</span>
                <div className="text-lg font-semibold text-white">{progress.completion_percentage}%</div>
              </div>
              <div className="text-right">
                <span className="text-gray-400 text-sm">Status</span>
                <div className={`text-sm font-medium ${
                  progress.status === 'completed' ? 'text-green-400' :
                  progress.status === 'in_progress' ? 'text-yellow-400' :
                  'text-gray-500'
                }`}>
                  {progress.status === 'completed' ? '✅ Completed' :
                   progress.status === 'in_progress' ? '🔄 In Progress' :
                   '📝 Not Started'}
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        {isCompleted ? (
          <div className="bg-green-500/10 border border-green-500/50 text-green-400 rounded-xl p-8 text-center">
            <div className="text-4xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-white">Lesson Completed!</h2>
            <p className="mt-2">Great job! You've completed this lesson.</p>
            <Link href={`/learn/${params.curriculumId}/${params.unitId}`} className="mt-4 inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              Back to Unit
            </Link>
          </div>
        ) : (
          <>
            {/* Learning Objectives */}
            {lesson.learning_objectives && lesson.learning_objectives.length > 0 && (
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 mb-6">
                <h3 className="text-white font-semibold mb-2">🎯 Learning Objectives</h3>
                <ul className="list-disc list-inside text-gray-400 space-y-1">
                  {lesson.learning_objectives.map((obj, index) => (
                    <li key={index}>{obj}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Exercises */}
            {!progress && (
              <button
                onClick={handleStartLesson}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:opacity-90 transition"
              >
                Start Lesson
              </button>
            )}

            {progress && !isCompleted && currentExercise && (
              <div className="space-y-6">
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-400">
                      Exercise {currentExerciseIndex + 1} of {lesson.exercises.length}
                    </span>
                    <span className="text-sm text-gray-400">
                      {currentExercise.points} points
                    </span>
                  </div>
                  
                  <h3 className="text-white font-semibold mb-3">{currentExercise.prompt}</h3>
                  
                  {/* Exercise rendering based on type */}
                  <ExerciseRenderer
                    exercise={currentExercise}
                    onSubmit={(answer) => handleExerciseSubmit(currentExercise.id, answer)}
                  />
                </div>

                {currentExerciseIndex === lesson.exercises.length - 1 && (
                  <button
                    onClick={handleCompleteLesson}
                    className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-lg hover:opacity-90 transition"
                  >
                    Complete Lesson 🎯
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Simple Exercise Renderer
function ExerciseRenderer({ exercise, onSubmit }: { exercise: Exercise; onSubmit: (answer: any) => void }) {
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!answer.trim()) return;
    onSubmit(answer);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="text-green-400 text-center py-4">
        ✅ Submitted! Moving to next exercise...
      </div>
    );
  }

  return (
    <div>
      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Type your answer here..."
        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
      />
      <button
        onClick={handleSubmit}
        disabled={!answer.trim()}
        className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Submit Answer
      </button>
    </div>
  );
}
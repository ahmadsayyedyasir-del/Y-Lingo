// app/admin/curricula/[id]/units/[unitId]/lessons/[lessonId]/exercises/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import ProtectedAdminRoute from '@/components/admin/ProtectedAdminRoute';
import AdminLayout from '@/components/admin/AdminLayout';
import { adminCurriculumEndpoints } from '@/lib/endpoints';

interface Exercise {
  id: string;
  lesson_id: string;
  exercise_type: string;
  prompt: string;
  content: any;
  points: number;
  order_index: number;
}

export default function AdminExercisesPage() {
  const params = useParams();
  const curriculumId = params.id as string;
  const unitId = params.unitId as string;
  const lessonId = params.lessonId as string;

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    exercise_type: 'multiple_choice',
    prompt: '',
    content: { choices: [{ id: 'a', text: '' }, { id: 'b', text: '' }], correctOptionId: 'a' },
    points: 10,
    order_index: 1,
  });

  useEffect(() => {
    fetchData();
  }, [lessonId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await adminCurriculumEndpoints.listExercises(lessonId);
      setExercises(response.data.items || []);
    } catch (err) {
      setError('Failed to load exercises.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminCurriculumEndpoints.createExercise(lessonId, formData);
      setShowForm(false);
      setFormData({
        exercise_type: 'multiple_choice',
        prompt: '',
        content: { choices: [{ id: 'a', text: '' }, { id: 'b', text: '' }], correctOptionId: 'a' },
        points: 10,
        order_index: exercises.length + 1,
      });
      fetchData();
    } catch (err) {
      setError('Failed to create exercise.');
    }
  };

  const handleDelete = async (exerciseId: string) => {
    if (!confirm('Are you sure you want to delete this exercise?')) return;
    try {
      await adminCurriculumEndpoints.deleteExercise(exerciseId);
      fetchData();
    } catch (err) {
      setError('Failed to delete exercise.');
    }
  };

  const addChoice = () => {
    const newId = String.fromCharCode(97 + formData.content.choices.length);
    setFormData({
      ...formData,
      content: {
        ...formData.content,
        choices: [...formData.content.choices, { id: newId, text: '' }],
      },
    });
  };

  const updateChoice = (index: number, text: string) => {
    const newChoices = [...formData.content.choices];
    newChoices[index].text = text;
    setFormData({
      ...formData,
      content: { ...formData.content, choices: newChoices },
    });
  };

  const removeChoice = (index: number) => {
    const newChoices = formData.content.choices.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      content: { ...formData.content, choices: newChoices },
    });
  };

  if (loading) {
    return (
      <ProtectedAdminRoute>
        <AdminLayout>
          <div className="text-white text-xl">Loading...</div>
        </AdminLayout>
      </ProtectedAdminRoute>
    );
  }

  return (
    <ProtectedAdminRoute>
      <AdminLayout>
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <Link href={`/admin/curricula/${curriculumId}/units/${unitId}/lessons`} className="text-blue-400 hover:text-blue-300 text-sm">
                ← Back to Lessons
              </Link>
              <h1 className="text-3xl font-bold text-white">Exercises</h1>
              <p className="text-gray-400">Manage exercises in this lesson</p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              + New Exercise
            </button>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg p-3 mb-4 text-sm">
              {error}
            </div>
          )}

          {showForm && (
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 mb-6">
              <h2 className="text-xl font-semibold text-white mb-4">Create New Exercise</h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Exercise Type</label>
                  <select
                    value={formData.exercise_type}
                    onChange={(e) => setFormData({ ...formData, exercise_type: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="multiple_choice">Multiple Choice</option>
                    <option value="translation">Translation</option>
                    <option value="fill_in_blank">Fill in the Blank</option>
                    <option value="sentence_correction">Sentence Correction</option>
                    <option value="vocabulary">Vocabulary</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Prompt</label>
                  <textarea
                    value={formData.prompt}
                    onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {formData.exercise_type === 'multiple_choice' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Choices</label>
                    {formData.content.choices.map((choice, index) => (
                      <div key={choice.id} className="flex gap-2 mb-2">
                        <span className="px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white">
                          {choice.id}
                        </span>
                        <input
                          type="text"
                          value={choice.text}
                          onChange={(e) => updateChoice(index, e.target.value)}
                          placeholder={`Option ${choice.id}`}
                          className="flex-1 px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => removeChoice(index)}
                          className="px-3 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition"
                          disabled={formData.content.choices.length <= 2}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addChoice}
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                      + Add Choice
                    </button>
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-300 mb-1">Correct Option</label>
                      <select
                        value={formData.content.correctOptionId}
                        onChange={(e) => setFormData({
                          ...formData,
                          content: { ...formData.content, correctOptionId: e.target.value }
                        })}
                        className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {formData.content.choices.map((choice) => (
                          <option key={choice.id} value={choice.id}>
                            {choice.id}: {choice.text || 'Empty'}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Points</label>
                    <input
                      type="number"
                      value={formData.points}
                      onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min={1}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Order Index</label>
                    <input
                      type="number"
                      value={formData.order_index}
                      onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min={1}
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {exercises.length === 0 ? (
            <div className="text-center py-12 bg-gray-900/50 rounded-xl border border-gray-800">
              <p className="text-gray-400">No exercises yet. Create your first one!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {exercises.map((exercise) => (
                <div
                  key={exercise.id}
                  className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        Exercise {exercise.order_index}: {exercise.exercise_type.replace('_', ' ')}
                      </h3>
                      <p className="text-gray-400 text-sm mt-1">{exercise.prompt}</p>
                      <div className="flex gap-4 mt-2 text-sm text-gray-500">
                        <span>📝 {exercise.exercise_type}</span>
                        <span>⭐ {exercise.points} points</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDelete(exercise.id)}
                        className="px-3 py-1 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </AdminLayout>
    </ProtectedAdminRoute>
  );
}
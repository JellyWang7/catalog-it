import { useState } from 'react';

export default function ListFormModal({ list, onSubmit, onClose, title }) {
  const [form, setForm] = useState({
    title: list?.title || '',
    description: list?.description || '',
    visibility: list?.visibility || 'private',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    await onSubmit(form);
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">{title}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              name="title"
              required
              value={form.title}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-deep-blue focus:border-deep-blue"
              placeholder="My awesome list"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-deep-blue focus:border-deep-blue resize-none"
              placeholder="What is this list about?"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
            <select
              name="visibility"
              value={form.visibility}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-deep-blue focus:border-deep-blue"
            >
              <option value="private">Private — only you can see</option>
              <option value="public">Public — visible to everyone</option>
              <option value="shared">Shared — visible to invited users</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 font-medium rounded-xl hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-deep-blue text-white font-semibold rounded-xl hover:bg-deep-blue-800 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Saving...' : list ? 'Update' : 'Create List'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

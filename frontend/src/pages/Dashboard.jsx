import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import listsService from '../services/lists';
import toast from 'react-hot-toast';
import ListFormModal from '../components/ListFormModal';
import ConfirmModal from '../components/ConfirmModal';

export default function Dashboard() {
  const { user } = useAuth();
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingList, setEditingList] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    fetchLists();
  }, []);

  const fetchLists = async () => {
    try {
      const res = await listsService.getAll();
      // Filter to only current user's lists
      const myLists = res.data.filter((l) => l.user_id === user?.id);
      setLists(myLists);
    } catch {
      toast.error('Failed to load your lists');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data) => {
    try {
      await listsService.create(data);
      toast.success('List created!');
      setShowCreate(false);
      fetchLists();
    } catch (err) {
      toast.error(err.response?.data?.errors?.join(', ') || 'Failed to create list');
    }
  };

  const handleUpdate = async (data) => {
    try {
      await listsService.update(editingList.id, data);
      toast.success('List updated!');
      setEditingList(null);
      fetchLists();
    } catch (err) {
      toast.error(err.response?.data?.errors?.join(', ') || 'Failed to update list');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await listsService.delete(deleteTarget.id);
      toast.success('List deleted');
      setDeleteTarget(null);
      fetchLists();
    } catch {
      toast.error('Failed to delete list');
    }
  };

  const publicLists = lists.filter((l) => l.visibility === 'public');
  const privateLists = lists.filter((l) => l.visibility !== 'public');
  const totalItems = lists.reduce((sum, l) => sum + (l.items?.length || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-deep-blue" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-deep-blue mb-1">My Dashboard</h1>
          <p className="text-lg text-gray-600">
            Welcome back, <span className="font-semibold">{user?.username}</span>!
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-6 py-3 bg-deep-blue text-white font-semibold rounded-xl hover:bg-deep-blue-800 transition-colors shadow-lg text-sm"
        >
          + New List
        </button>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl p-5 shadow-md border-l-4 border-deep-blue">
          <p className="text-sm text-gray-500 font-medium">Total Lists</p>
          <p className="text-3xl font-extrabold text-gray-900">{lists.length}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-md border-l-4 border-teal">
          <p className="text-sm text-gray-500 font-medium">Public Lists</p>
          <p className="text-3xl font-extrabold text-gray-900">{publicLists.length}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-md border-l-4 border-yellow-500">
          <p className="text-sm text-gray-500 font-medium">Total Items</p>
          <p className="text-3xl font-extrabold text-gray-900">{totalItems}</p>
        </div>
      </div>

      {/* Lists */}
      {lists.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-16 text-center">
          <p className="text-gray-400 text-lg mb-4">You don&apos;t have any lists yet.</p>
          <button
            onClick={() => setShowCreate(true)}
            className="text-deep-blue font-semibold hover:underline"
          >
            Create your first list
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lists.map((list) => (
            <div
              key={list.id}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all group"
            >
              {/* Card top color bar */}
              <div className={`h-1.5 ${
                list.visibility === 'public' ? 'bg-deep-blue' : list.visibility === 'shared' ? 'bg-teal' : 'bg-gray-400'
              }`} />

              <div className="p-5">
                <Link to={`/lists/${list.id}`} className="block">
                  <h3 className="text-xl font-bold text-gray-800 mb-1 truncate group-hover:text-deep-blue transition-colors">
                    {list.title}
                  </h3>
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                    {list.description || 'No description'}
                  </p>
                </Link>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      list.visibility === 'public'
                        ? 'bg-blue-100 text-deep-blue'
                        : list.visibility === 'shared'
                        ? 'bg-teal-100 text-teal'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {list.visibility}
                    </span>
                    <span className="text-xs text-gray-400">
                      {list.items?.length || 0} items
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingList(list)}
                      className="p-1.5 text-gray-400 hover:text-deep-blue rounded-lg hover:bg-blue-50 transition-colors"
                      title="Edit list"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setDeleteTarget({ id: list.id, name: list.title })}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      title="Delete list"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showCreate && (
        <ListFormModal
          onSubmit={handleCreate}
          onClose={() => setShowCreate(false)}
          title="Create New List"
        />
      )}

      {editingList && (
        <ListFormModal
          list={editingList}
          onSubmit={handleUpdate}
          onClose={() => setEditingList(null)}
          title="Edit List"
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Delete List"
          message={`Are you sure you want to delete "${deleteTarget.name}"? All items in this list will be permanently deleted.`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          danger
        />
      )}
    </div>
  );
}

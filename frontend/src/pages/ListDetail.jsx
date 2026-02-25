import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import listsService from '../services/lists';
import itemsService from '../services/items';
import toast from 'react-hot-toast';
import StarRating from '../components/StarRating';
import ItemFormModal from '../components/ItemFormModal';
import ConfirmModal from '../components/ConfirmModal';

export default function ListDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [list, setList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [showAddItem, setShowAddItem] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'item'|'list', id, name }
  const [sharing, setSharing] = useState(false);
  const [commentBody, setCommentBody] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [listLikeLoading, setListLikeLoading] = useState(false);
  const [itemLikeLoading, setItemLikeLoading] = useState({});

  const isOwner = isAuthenticated && list && user?.id === list.user_id;

  useEffect(() => {
    fetchList();
  }, [id]);

  const fetchList = async () => {
    try {
      const res = await listsService.getById(id);
      setList(res.data);
    } catch (err) {
      if (err.response?.status === 404) {
        toast.error('List not found');
        navigate('/explore');
      } else if (err.response?.status === 403) {
        toast.error('This list is private');
        navigate('/explore');
      } else {
        toast.error('Failed to load list');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (data) => {
    try {
      await itemsService.create(list.id, data);
      toast.success('Item added!');
      setShowAddItem(false);
      fetchList();
    } catch (err) {
      toast.error(err.response?.data?.errors?.join(', ') || 'Failed to add item');
    }
  };

  const handleUpdateItem = async (data) => {
    try {
      await itemsService.update(editingItem.id, data);
      toast.success('Item updated!');
      setEditingItem(null);
      fetchList();
    } catch (err) {
      toast.error(err.response?.data?.errors?.join(', ') || 'Failed to update item');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    try {
      if (deleteTarget.type === 'item') {
        await itemsService.delete(deleteTarget.id);
        toast.success('Item deleted');
      } else {
        await listsService.delete(deleteTarget.id);
        toast.success('List deleted');
        navigate('/dashboard');
        return;
      }
      setDeleteTarget(null);
      fetchList();
    } catch {
      toast.error(`Failed to delete ${deleteTarget.type}`);
    }
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      const res = await listsService.share(list.id);
      const shareUrl = `${window.location.origin}/s/${res.data.share_code}`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Share link copied to clipboard!');
    } catch {
      toast.error('Failed to generate share link');
    } finally {
      setSharing(false);
    }
  };

  const ensureAuthenticated = () => {
    if (isAuthenticated) return true;
    toast.error('Please log in to use this feature');
    return false;
  };

  const handleToggleListLike = async () => {
    if (!ensureAuthenticated()) return;

    setListLikeLoading(true);
    try {
      const isLiked = !!list.liked_by_current_user;
      const res = isLiked ? await listsService.unlike(list.id) : await listsService.like(list.id);
      setList((prev) => ({
        ...prev,
        likes_count: res.data.likes_count,
        liked_by_current_user: res.data.liked_by_current_user,
      }));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update list like');
    } finally {
      setListLikeLoading(false);
    }
  };

  const handleToggleItemLike = async (item) => {
    if (!ensureAuthenticated()) return;

    setItemLikeLoading((prev) => ({ ...prev, [item.id]: true }));
    try {
      const isLiked = !!item.liked_by_current_user;
      const res = isLiked ? await itemsService.unlike(item.id) : await itemsService.like(item.id);

      setList((prev) => ({
        ...prev,
        items: (prev.items || []).map((existingItem) =>
          existingItem.id === item.id
            ? {
                ...existingItem,
                likes_count: res.data.likes_count,
                liked_by_current_user: res.data.liked_by_current_user,
              }
            : existingItem
        ),
      }));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update item like');
    } finally {
      setItemLikeLoading((prev) => ({ ...prev, [item.id]: false }));
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!ensureAuthenticated()) return;

    const body = commentBody.trim();
    if (!body) {
      toast.error('Please enter a comment');
      return;
    }

    setSubmittingComment(true);
    try {
      const res = await listsService.addComment(list.id, body);
      setList((prev) => ({
        ...prev,
        comments: [res.data, ...(prev.comments || [])],
      }));
      setCommentBody('');
      toast.success('Comment posted');
    } catch (err) {
      toast.error(err.response?.data?.errors?.join(', ') || err.response?.data?.error || 'Failed to post comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await listsService.deleteComment(commentId);
      setList((prev) => ({
        ...prev,
        comments: (prev.comments || []).filter((comment) => comment.id !== commentId),
      }));
      toast.success('Comment deleted');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete comment');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-deep-blue" />
      </div>
    );
  }

  if (!list) return null;

  const items = list.items || [];
  const comments = list.comments || [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-10">
        {/* List Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start border-b pb-6 mb-6 gap-4">
          <div>
            <Link
              to={isOwner ? '/dashboard' : '/explore'}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center mb-2"
            >
              &larr; {isOwner ? 'Back to Dashboard' : 'Back to Explore'}
            </Link>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2">
              {list.title}
            </h1>
            {list.description && (
              <p className="text-gray-600">{list.description}</p>
            )}
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-medium px-3 py-1 rounded-full border ${
                list.visibility === 'public'
                  ? 'bg-blue-100 text-deep-blue border-deep-blue'
                  : list.visibility === 'shared'
                  ? 'bg-teal-100 text-teal border-teal'
                  : 'bg-gray-100 text-gray-600 border-gray-400'
              }`}>
                {items.length} Items | {list.visibility?.toUpperCase()}
              </span>
              <button
                onClick={handleToggleListLike}
                disabled={listLikeLoading}
                className={`text-xs font-semibold px-3 py-1 rounded-full border transition-colors disabled:opacity-60 ${
                  list.liked_by_current_user
                    ? 'bg-pink-100 text-pink-700 border-pink-300 hover:bg-pink-200'
                    : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                }`}
                title="Like this list"
              >
                {list.liked_by_current_user ? '👍 Liked' : '👍 I like it'} ({list.likes_count || 0})
              </button>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {isOwner && (
              <>
                <button
                  onClick={() => setShowAddItem(true)}
                  className="px-5 py-2 bg-deep-blue text-white font-semibold rounded-xl hover:bg-deep-blue-800 transition-colors shadow-md text-sm"
                >
                  + Add Item
                </button>
                <button
                  onClick={() => setDeleteTarget({ type: 'list', id: list.id, name: list.title })}
                  className="px-4 py-2 text-red-600 border border-red-300 font-semibold rounded-xl hover:bg-red-50 transition-colors text-sm"
                >
                  Delete List
                </button>
              </>
            )}
            {isOwner && (
              <button
                onClick={handleShare}
                disabled={sharing}
                className="px-4 py-2 text-teal border border-teal font-semibold rounded-xl hover:bg-teal-50 transition-colors text-sm flex items-center gap-1.5 disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                {sharing ? 'Sharing...' : 'Share'}
              </button>
            )}
          </div>
        </div>

        {/* Items */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">Item Catalog</h2>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-lg mb-2">No items yet.</p>
              {isOwner && (
                <button
                  onClick={() => setShowAddItem(true)}
                  className="text-deep-blue font-semibold hover:underline"
                >
                  Add your first item
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center p-4 rounded-xl shadow-sm border-l-4 ${
                    item.rating === 5
                      ? 'bg-gray-50 border-green-500'
                      : item.rating >= 3
                      ? 'bg-white border-yellow-500'
                      : item.rating
                      ? 'bg-white border-red-400'
                      : 'bg-white border-gray-300'
                  }`}
                >
                  {/* Icon */}
                  <div className="w-10 h-10 flex items-center justify-center bg-deep-blue rounded-lg mr-4 text-white flex-shrink-0">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" />
                    </svg>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-lg text-gray-900 truncate">{item.name}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {item.category && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-600">
                          {item.category}
                        </span>
                      )}
                      {item.notes && (
                        <span className="text-xs text-gray-500 truncate max-w-[200px]">
                          {item.notes}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex flex-col items-end gap-1 ml-4 flex-shrink-0">
                    <div className="flex items-center">
                      {item.rating ? (
                        <StarRating rating={item.rating} />
                      ) : (
                        <span className="text-sm text-gray-400">No rating</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleToggleItemLike(item)}
                      disabled={itemLikeLoading[item.id]}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition-colors disabled:opacity-60 ${
                        item.liked_by_current_user
                          ? 'bg-pink-100 text-pink-700 border-pink-300 hover:bg-pink-200'
                          : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                      }`}
                      title="Like this item"
                    >
                      {item.liked_by_current_user ? '👍 Liked' : '👍 Like'} ({item.likes_count || 0})
                    </button>
                  </div>

                  {/* Owner actions */}
                  {isOwner && (
                    <div className="flex items-center ml-3 gap-1 flex-shrink-0">
                      <button
                        onClick={() => setEditingItem(item)}
                        className="p-1.5 text-gray-400 hover:text-deep-blue rounded-lg hover:bg-blue-50 transition-colors"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setDeleteTarget({ type: 'item', id: item.id, name: item.name })}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Comments */}
        <div className="mt-10 border-t pt-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Comments</h2>

          {(list.visibility === 'public' || list.visibility === 'shared') && (
            <form onSubmit={handleAddComment} className="mb-6">
              <textarea
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder={isAuthenticated ? 'Share your thoughts about this list...' : 'Log in to leave a comment'}
                disabled={!isAuthenticated || submittingComment}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal focus:border-teal disabled:bg-gray-100 disabled:text-gray-500"
              />
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-gray-400">{commentBody.length}/500</span>
                <button
                  type="submit"
                  disabled={!isAuthenticated || submittingComment || !commentBody.trim()}
                  className="px-4 py-2 bg-deep-blue text-white text-sm font-semibold rounded-lg hover:bg-deep-blue-800 disabled:opacity-60"
                >
                  {submittingComment ? 'Posting...' : 'Post Comment'}
                </button>
              </div>
            </form>
          )}

          {comments.length === 0 ? (
            <p className="text-gray-400">No comments yet. Be the first to comment.</p>
          ) : (
            <div className="space-y-3">
              {comments.map((comment) => {
                const canDeleteComment =
                  isAuthenticated && (comment.user_id === user?.id || list.user_id === user?.id);

                return (
                  <div key={comment.id} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          {comment.user?.username || `User #${comment.user_id}`}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(comment.created_at).toLocaleString()}
                        </p>
                      </div>
                      {canDeleteComment && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-xs text-red-600 hover:text-red-700 font-medium"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{comment.body}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showAddItem && (
        <ItemFormModal
          onSubmit={handleAddItem}
          onClose={() => setShowAddItem(false)}
          title="Add New Item"
        />
      )}

      {editingItem && (
        <ItemFormModal
          item={editingItem}
          onSubmit={handleUpdateItem}
          onClose={() => setEditingItem(null)}
          title="Edit Item"
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          title={`Delete ${deleteTarget.type === 'list' ? 'List' : 'Item'}`}
          message={`Are you sure you want to delete "${deleteTarget.name}"?${
            deleteTarget.type === 'list' ? ' All items in this list will also be deleted.' : ''
          }`}
          confirmLabel="Delete"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
          danger
        />
      )}
    </div>
  );
}

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
  const [linkAttachmentTitle, setLinkAttachmentTitle] = useState('');
  const [fileAttachmentTitle, setFileAttachmentTitle] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [submittingAttachment, setSubmittingAttachment] = useState(false);
  const [itemAttachmentInputs, setItemAttachmentInputs] = useState({});
  const [itemAttachmentSubmitting, setItemAttachmentSubmitting] = useState({});

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
      const moderationError = err.response?.status === 422
        && err.response?.data?.errors?.some((message) => message.includes('Content contains inappropriate language'));

      if (moderationError) {
        toast.error('Content contains inappropriate language. Please keep notes clean and age-friendly.');
        return;
      }

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
      const moderationError = err.response?.status === 422
        && err.response?.data?.errors?.some((message) => message.includes('Content contains inappropriate language'));

      if (moderationError) {
        toast.error('Content contains inappropriate language. Please keep notes clean and age-friendly.');
        return;
      }

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
    if (isOwner) {
      toast.error('You cannot like your own list');
      return;
    }

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
    if (isOwner) {
      toast.error('You cannot comment on your own list');
      return;
    }

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
      const moderationError = err.response?.status === 422
        && err.response?.data?.errors?.some((message) => message.includes('Content contains inappropriate language'));

      if (moderationError) {
        toast.error('Content contains inappropriate language. Please keep comments clean and age-friendly.');
        return;
      }

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

  const handleAddLinkAttachment = async (e) => {
    e.preventDefault();
    if (!ensureAuthenticated()) return;
    if (!isOwner) {
      toast.error('Only the list owner can add attachments');
      return;
    }

    const title = linkAttachmentTitle.trim();
    const url = attachmentUrl.trim();
    if (!title || !url) {
      toast.error('Please provide both title and https link');
      return;
    }

    setSubmittingAttachment(true);
    try {
      const res = await listsService.createAttachment(list.id, {
        kind: 'link',
        title,
        url,
      });
      setList((prev) => ({
        ...prev,
        attachments: [res.data, ...(prev.attachments || [])],
      }));
      setLinkAttachmentTitle('');
      setAttachmentUrl('');
      toast.success('Link added');
      navigate(`/lists/${list.id}`);
    } catch (err) {
      const errors = err.response?.data?.errors || [];
      const invalidLink = errors.some((message) => message.toLowerCase().includes('https link'));
      toast.error(
        invalidLink
          ? 'Invalid link. Please use a full https:// URL.'
          : errors.join(', ') || 'Failed to add link'
      );
    } finally {
      setSubmittingAttachment(false);
    }
  };

  const handleUploadAttachment = async (e) => {
    e.preventDefault();
    if (!ensureAuthenticated()) return;
    if (!isOwner) {
      toast.error('Only the list owner can add attachments');
      return;
    }

    const title = fileAttachmentTitle.trim();
    if (!title || !attachmentFile) {
      toast.error('Please provide title and select a file');
      return;
    }

    const isImage = attachmentFile.type?.startsWith('image/');

    setSubmittingAttachment(true);
    try {
      const res = await listsService.createAttachment(list.id, {
        kind: isImage ? 'image' : 'file',
        title,
        asset: attachmentFile,
      });
      setList((prev) => ({
        ...prev,
        attachments: [res.data, ...(prev.attachments || [])],
      }));
      setFileAttachmentTitle('');
      setAttachmentFile(null);
      toast.success('File uploaded');
      navigate(`/lists/${list.id}`);
    } catch (err) {
      const errors = err.response?.data?.errors || [];
      const typeError = errors.some((message) => message.toLowerCase().includes('type is not allowed'));
      const sizeError = errors.some((message) => message.toLowerCase().includes('5mb'));

      if (typeError || sizeError) {
        toast.error('Allowed files: JPG, PNG, WEBP, PDF, TXT, ZIP. Max size: 5MB.');
      } else {
        toast.error(errors.join(', ') || 'Failed to upload file');
      }
    } finally {
      setSubmittingAttachment(false);
    }
  };

  const getItemAttachmentInput = (itemId) =>
    itemAttachmentInputs[itemId] || { linkTitle: '', linkUrl: '', fileTitle: '', file: null };

  const updateItemAttachmentInput = (itemId, updates) => {
    setItemAttachmentInputs((prev) => ({
      ...prev,
      [itemId]: {
        ...getItemAttachmentInput(itemId),
        ...updates,
      },
    }));
  };

  const handleAddItemLinkAttachment = async (e, itemId) => {
    e.preventDefault();
    if (!ensureAuthenticated()) return;
    if (!isOwner) {
      toast.error('Only the list owner can add item attachments');
      return;
    }

    const input = getItemAttachmentInput(itemId);
    const title = input.linkTitle.trim();
    const url = input.linkUrl.trim();
    if (!title || !url) {
      toast.error('Please provide both title and https link');
      return;
    }

    setItemAttachmentSubmitting((prev) => ({ ...prev, [itemId]: true }));
    try {
      const res = await itemsService.createAttachment(itemId, { kind: 'link', title, url });
      setList((prev) => ({
        ...prev,
        items: (prev.items || []).map((item) =>
          item.id === itemId
            ? { ...item, attachments: [res.data, ...(item.attachments || [])] }
            : item
        ),
      }));
      updateItemAttachmentInput(itemId, { linkTitle: '', linkUrl: '' });
      toast.success('Item link added');
    } catch (err) {
      const errors = err.response?.data?.errors || [];
      const invalidLink = errors.some((message) => message.toLowerCase().includes('https link'));
      toast.error(
        invalidLink ? 'Invalid link. Please use a full https:// URL.' : errors.join(', ') || 'Failed to add item link'
      );
    } finally {
      setItemAttachmentSubmitting((prev) => ({ ...prev, [itemId]: false }));
    }
  };

  const handleUploadItemAttachment = async (e, itemId) => {
    e.preventDefault();
    if (!ensureAuthenticated()) return;
    if (!isOwner) {
      toast.error('Only the list owner can add item attachments');
      return;
    }

    const input = getItemAttachmentInput(itemId);
    const title = input.fileTitle.trim();
    const file = input.file;
    if (!title || !file) {
      toast.error('Please provide title and select a file');
      return;
    }

    const isImage = file.type?.startsWith('image/');

    setItemAttachmentSubmitting((prev) => ({ ...prev, [itemId]: true }));
    try {
      const res = await itemsService.createAttachment(itemId, {
        kind: isImage ? 'image' : 'file',
        title,
        asset: file,
      });
      setList((prev) => ({
        ...prev,
        items: (prev.items || []).map((item) =>
          item.id === itemId
            ? { ...item, attachments: [res.data, ...(item.attachments || [])] }
            : item
        ),
      }));
      updateItemAttachmentInput(itemId, { fileTitle: '', file: null });
      toast.success('Item file uploaded');
    } catch (err) {
      const errors = err.response?.data?.errors || [];
      const typeError = errors.some((message) => message.toLowerCase().includes('type is not allowed'));
      const sizeError = errors.some((message) => message.toLowerCase().includes('5mb'));

      if (typeError || sizeError) {
        toast.error('Allowed files: JPG, PNG, WEBP, PDF, TXT, ZIP. Max size: 5MB.');
      } else {
        toast.error(errors.join(', ') || 'Failed to upload item file');
      }
    } finally {
      setItemAttachmentSubmitting((prev) => ({ ...prev, [itemId]: false }));
    }
  };

  const handleDeleteAttachment = async (attachmentId, itemId = null) => {
    if (!ensureAuthenticated()) return;
    if (!isOwner) {
      toast.error('Only the list owner can delete attachments');
      return;
    }

    try {
      await listsService.deleteAttachment(attachmentId);
      setList((prev) => {
        if (itemId) {
          return {
            ...prev,
            items: (prev.items || []).map((item) =>
              item.id === itemId
                ? {
                    ...item,
                    attachments: (item.attachments || []).filter((attachment) => attachment.id !== attachmentId),
                  }
                : item
            ),
          };
        }

        return {
          ...prev,
          attachments: (prev.attachments || []).filter((attachment) => attachment.id !== attachmentId),
        };
      });
      toast.success('Attachment deleted');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete attachment');
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
  const attachments = list.attachments || [];
  const isShareable = isOwner && list.visibility !== 'private';

  const resolveAttachmentType = (attachment) => {
    const mime = attachment?.mime_type?.toLowerCase() || '';
    const url = attachment?.url?.toLowerCase() || '';

    if (attachment.kind === 'link') return 'link';
    if (attachment.kind === 'image' || mime.startsWith('image/')) return 'image';
    if (mime.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|aac)$/i.test(url)) return 'audio';
    return 'file';
  };

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
              {!isOwner ? (
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
              ) : (
                <span className="text-xs font-semibold px-3 py-1 rounded-full border bg-gray-100 text-gray-500 border-gray-300">
                  Owner cannot like own list
                </span>
              )}
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
            {isShareable && (
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
            {isOwner && list.visibility === 'private' && (
              <span className="px-4 py-2 text-gray-500 border border-gray-300 font-semibold rounded-xl text-sm">
                Private list cannot be shared
              </span>
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

        {/* Item-Level Attachments */}
        <div className="mt-10 border-t pt-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Item Attachments</h2>
          {items.length === 0 ? (
            <p className="text-gray-400">Add items to manage item-level attachments.</p>
          ) : (
            <div className="space-y-4">
              {items.map((item) => {
                const itemAttachments = item.attachments || [];
                const input = getItemAttachmentInput(item.id);

                return (
                  <div key={`item-attachments-${item.id}`} className="border border-gray-200 rounded-xl p-4 bg-white">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <p className="font-semibold text-gray-800">{item.name}</p>
                      <span className="text-xs text-gray-500">{itemAttachments.length} attachments</span>
                    </div>

                    {isOwner && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
                        <form onSubmit={(e) => handleAddItemLinkAttachment(e, item.id)} className="space-y-2">
                          <input
                            type="text"
                            placeholder="Item link title"
                            value={input.linkTitle}
                            onChange={(e) => updateItemAttachmentInput(item.id, { linkTitle: e.target.value })}
                            maxLength={120}
                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal focus:border-teal"
                          />
                          <input
                            type="url"
                            placeholder="https://example.com/item-resource"
                            value={input.linkUrl}
                            onChange={(e) => updateItemAttachmentInput(item.id, { linkUrl: e.target.value })}
                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal focus:border-teal"
                          />
                          <button
                            type="submit"
                            disabled={itemAttachmentSubmitting[item.id]}
                            className="px-3 py-2 bg-deep-blue text-white text-xs font-semibold rounded-lg hover:bg-deep-blue-800 disabled:opacity-60"
                          >
                            Add Item Link
                          </button>
                        </form>

                        <form onSubmit={(e) => handleUploadItemAttachment(e, item.id)} className="space-y-2">
                          <input
                            type="text"
                            placeholder="Item file title"
                            value={input.fileTitle}
                            onChange={(e) => updateItemAttachmentInput(item.id, { fileTitle: e.target.value })}
                            maxLength={120}
                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal focus:border-teal"
                          />
                          <input
                            type="file"
                            onChange={(e) => updateItemAttachmentInput(item.id, { file: e.target.files?.[0] || null })}
                            className="w-full text-sm text-gray-700"
                          />
                          <button
                            type="submit"
                            disabled={itemAttachmentSubmitting[item.id]}
                            className="px-3 py-2 bg-teal text-white text-xs font-semibold rounded-lg hover:opacity-90 disabled:opacity-60"
                          >
                            Upload Item File
                          </button>
                        </form>
                      </div>
                    )}

                    {itemAttachments.length === 0 ? (
                      <p className="text-sm text-gray-400">No item attachments yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {itemAttachments.map((attachment) => (
                          <div key={attachment.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                            <p className="text-sm font-semibold text-gray-800 mb-1">{attachment.title}</p>
                            {resolveAttachmentType(attachment) === 'image' && (
                              <img
                                src={attachment.url}
                                alt={attachment.title}
                                className="w-full max-w-sm max-h-44 object-cover rounded-lg border border-gray-200"
                              />
                            )}
                            {resolveAttachmentType(attachment) === 'audio' && (
                              <audio controls src={attachment.url} className="w-full max-w-sm" />
                            )}
                            {resolveAttachmentType(attachment) === 'link' && (
                              <a href={attachment.url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline break-all">
                                {attachment.url}
                              </a>
                            )}
                            {resolveAttachmentType(attachment) === 'file' && (
                              <a href={attachment.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline">
                                <span>📎</span>
                                <span>Open file</span>
                              </a>
                            )}
                            {isOwner && (
                              <button
                                onClick={() => handleDeleteAttachment(attachment.id, item.id)}
                                className="mt-2 text-xs text-red-600 hover:text-red-700 font-medium"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Attachments */}
        <div className="mt-10 border-t pt-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Attachments</h2>

          {isOwner && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              <form onSubmit={handleAddLinkAttachment} className="border border-gray-200 rounded-xl p-4 space-y-3">
                <p className="text-sm font-semibold text-gray-700">Add Link</p>
                <input
                  type="text"
                  placeholder="Attachment title"
                  value={linkAttachmentTitle}
                  onChange={(e) => setLinkAttachmentTitle(e.target.value)}
                  maxLength={120}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal focus:border-teal"
                />
                <input
                  type="url"
                  placeholder="https://example.com/resource"
                  value={attachmentUrl}
                  onChange={(e) => setAttachmentUrl(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal focus:border-teal"
                />
                <button
                  type="submit"
                  disabled={submittingAttachment}
                  className="px-4 py-2 bg-deep-blue text-white text-sm font-semibold rounded-lg hover:bg-deep-blue-800 disabled:opacity-60"
                >
                  Add Link
                </button>
                <p className="text-xs text-gray-500">Allowed links: must start with https://</p>
              </form>

              <form onSubmit={handleUploadAttachment} className="border border-gray-200 rounded-xl p-4 space-y-3">
                <p className="text-sm font-semibold text-gray-700">Upload File/Image</p>
                <input
                  type="text"
                  placeholder="Attachment title"
                  value={fileAttachmentTitle}
                  onChange={(e) => setFileAttachmentTitle(e.target.value)}
                  maxLength={120}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal focus:border-teal"
                />
                <input
                  type="file"
                  onChange={(e) => setAttachmentFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-gray-700"
                />
                <button
                  type="submit"
                  disabled={submittingAttachment}
                  className="px-4 py-2 bg-teal text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-60"
                >
                  Upload File
                </button>
                <p className="text-xs text-gray-500">
                  Allowed files: JPG, PNG, WEBP, PDF, TXT, ZIP (max 5MB)
                </p>
              </form>
            </div>
          )}

          {!isOwner && (
            <p className="text-sm text-gray-500 mb-4">Attachments are managed by the list owner.</p>
          )}

          {attachments.length === 0 ? (
            <p className="text-gray-400">No attachments yet.</p>
          ) : (
            <div className="space-y-3">
              {attachments.map((attachment) => (
                <div key={attachment.id} className="border border-gray-200 rounded-xl p-4 flex items-start justify-between gap-3 bg-gray-50">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-800 truncate mb-2">{attachment.title}</p>
                    {resolveAttachmentType(attachment) === 'image' && (
                      <img
                        src={attachment.url}
                        alt={attachment.title}
                        className="w-full max-w-sm max-h-48 object-cover rounded-lg border border-gray-200"
                      />
                    )}
                    {resolveAttachmentType(attachment) === 'audio' && (
                      <audio controls src={attachment.url} className="w-full max-w-sm" />
                    )}
                    {resolveAttachmentType(attachment) === 'link' && (
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-blue-600 hover:underline break-all"
                      >
                        {attachment.url}
                      </a>
                    )}
                    {resolveAttachmentType(attachment) === 'file' && (
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
                      >
                        <span>📎</span>
                        <span>Open file</span>
                      </a>
                    )}
                    <p className="text-xs text-gray-400 mt-2">{resolveAttachmentType(attachment).toUpperCase()}</p>
                  </div>
                  {isOwner && (
                    <button
                      onClick={() => handleDeleteAttachment(attachment.id)}
                      className="text-xs text-red-600 hover:text-red-700 font-medium"
                    >
                      Delete
                    </button>
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
                placeholder={
                  !isAuthenticated
                    ? 'Log in to leave a comment'
                    : isOwner
                    ? 'Owners cannot comment on their own lists'
                    : 'Share your thoughts about this list...'
                }
                disabled={!isAuthenticated || submittingComment || isOwner}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal focus:border-teal disabled:bg-gray-100 disabled:text-gray-500"
              />
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-gray-400">{commentBody.length}/500</span>
                <button
                  type="submit"
                  disabled={!isAuthenticated || submittingComment || !commentBody.trim() || isOwner}
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

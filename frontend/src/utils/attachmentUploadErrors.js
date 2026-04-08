/**
 * Message for user-facing toast when an attachment upload fails.
 * Returns null when there is no clear, actionable error (avoids false alarms).
 */
export function getAttachmentUploadErrorMessage(err) {
  if (!err) return null;

  if (err.code === 'ECONNABORTED' || String(err.message || '').toLowerCase().includes('timeout')) {
    return 'Upload timed out. Try a smaller file or check your connection.';
  }

  if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
    return 'Network error. Check your connection and try again.';
  }

  const status = err.response?.status;
  const data = err.response?.data;

  if (status === 422) {
    const errors = Array.isArray(data?.errors) ? data.errors : [];
    const invalidLink = errors.some((m) => String(m).toLowerCase().includes('https link'));
    const typeError = errors.some((m) => String(m).toLowerCase().includes('type is not allowed'));
    const sizeError = errors.some((m) => String(m).toLowerCase().includes('5mb'));
    if (invalidLink) return 'Invalid link. Use a full https:// URL.';
    if (typeError || sizeError) return 'Allowed files: JPG, PNG, WEBP, PDF, TXT, ZIP. Max size: 5MB.';
    if (errors.length) return errors.join(', ');
    if (typeof data?.error === 'string' && data.error.trim()) return data.error.trim();
    return 'Could not add attachment. Check your input and try again.';
  }

  if (status === 401) return 'Please log in again.';
  if (status === 403) return 'You are not allowed to add attachments here.';
  if (status === 404) return 'List or item was not found.';

  if (status && status >= 400 && status < 500) {
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      if (Array.isArray(data.errors) && data.errors.length) return data.errors.join(', ');
      if (typeof data.error === 'string' && data.error.trim()) return data.error.trim();
    }
    return `Could not add attachment (${status}).`;
  }

  if (status && status >= 500) {
    if (data && typeof data === 'object' && typeof data.error === 'string' && data.error.trim()) {
      return data.error.trim();
    }
    return 'Something went wrong on the server. Refresh the page to see if the attachment was added; if not, try again.';
  }

  // No HTTP response (already handled ERR_NETWORK) — avoid axios generic / misleading messages
  if (!err.response) {
    return null;
  }

  return null;
}

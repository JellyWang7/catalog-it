export default function AttachmentUploadingModal() {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="attachment-uploading-title"
      aria-busy="true"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 flex flex-col items-center">
        <div
          className="animate-spin rounded-full h-12 w-12 border-2 border-gray-200 border-t-deep-blue mb-5"
          aria-hidden
        />
        <h2 id="attachment-uploading-title" className="text-lg font-semibold text-gray-900 text-center">
          Uploading attachment…
        </h2>
        <p className="text-sm text-gray-500 text-center mt-2">
          Please wait — do not close this page.
        </p>
      </div>
    </div>
  );
}

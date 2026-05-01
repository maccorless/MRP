"use client";

export interface EmailPreview {
  to: string;
  subject: string;
  body: string;
}

interface Props {
  preview: EmailPreview | null;
  onClose: () => void;
}

export function EmailPreviewModal({ preview, onClose }: Props) {
  if (!preview) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Email preview</h2>
          <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded">
            Not sent — email not yet live
          </span>
        </div>
        <dl className="text-sm space-y-2">
          <div className="flex gap-2">
            <dt className="font-medium text-gray-500 w-16 shrink-0">To:</dt>
            <dd className="text-gray-900">{preview.to}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-medium text-gray-500 w-16 shrink-0">Subject:</dt>
            <dd className="text-gray-900">{preview.subject}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-500 mb-1">Body:</dt>
            <dd className="bg-gray-50 border border-gray-200 rounded p-3 whitespace-pre-wrap font-mono text-xs text-gray-800">
              {preview.body}
            </dd>
          </div>
        </dl>
        <button
          onClick={onClose}
          className="w-full px-4 py-2 bg-gray-800 text-white rounded text-sm hover:bg-gray-700 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}

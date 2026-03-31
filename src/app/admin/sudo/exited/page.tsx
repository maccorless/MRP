export default function SudoExitedPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-sm w-full text-center">
        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-green-600 text-lg">✓</span>
        </div>
        <h1 className="text-lg font-semibold text-gray-900 mb-2">Sudo session ended</h1>
        <p className="text-sm text-gray-500 mb-6">
          You have exited the impersonation session. This window can be closed.
        </p>
        <p className="text-xs text-gray-400">
          Return to your IOC Admin session in the original window.
        </p>
      </div>
    </div>
  );
}

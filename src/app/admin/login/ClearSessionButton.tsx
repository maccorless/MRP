"use client";

export function ClearSessionButton({ action }: { action: () => Promise<void> }) {
  return (
    <form action={action} className="fixed bottom-3 left-3">
      <button
        type="submit"
        className="text-[10px] text-gray-300 hover:text-gray-500 transition-colors cursor-pointer"
      >
        clear session
      </button>
    </form>
  );
}

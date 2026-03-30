import { logout } from "@/app/admin/login/actions";

export default function AppHeader({
  displayName,
  roleLabel,
}: {
  displayName: string;
  roleLabel: string;
}) {
  return (
    <header className="bg-[#0057A8]">
      <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
        {/* Branding */}
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-white/15 border border-white/20 rounded-md flex items-center justify-center">
            <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4" aria-hidden="true">
              <circle cx="5" cy="8" r="3.25" stroke="white" strokeWidth="1.25"/>
              <circle cx="11" cy="8" r="3.25" stroke="white" strokeWidth="1.25"/>
            </svg>
          </div>
          <div>
            <div className="text-sm font-semibold text-white leading-tight">Media Registration Portal</div>
            <div className="text-xs text-white/60 leading-tight">LA 2028</div>
          </div>
        </div>

        {/* User + sign-out */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-white/85 hidden sm:inline">{displayName}</span>
          <span className="text-xs font-semibold text-white bg-white/15 border border-white/20 px-2.5 py-1 rounded-full">
            {roleLabel}
          </span>
          <form action={logout}>
            <button
              type="submit"
              className="text-xs text-white/50 hover:text-white/85 transition-colors cursor-pointer"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}

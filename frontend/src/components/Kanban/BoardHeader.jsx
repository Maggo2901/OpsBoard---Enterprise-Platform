import React from 'react';
import { Button } from '../UI';
import { LogOut, Archive, Plus } from 'lucide-react';
import HeaderSearch from '../Header/HeaderSearch';
import HeaderClock from '../Header/HeaderClock';
import HeaderWeather from '../Header/HeaderWeather';

export default function BoardHeader({
    onLogout,
    currentUser,
    showArchived,
    setShowArchived,
    searchQuery,
    setSearchQuery,
    onNewTask,
    searchInputRef
}) {
    return (
        <header className="h-20 border border-[rgba(121,150,224,0.2)] bg-[linear-gradient(180deg,rgba(16,26,46,0.92)_0%,rgba(10,18,34,0.78)_100%)] backdrop-blur-xl px-6 xl:px-8 flex items-center justify-between shrink-0 z-30 sticky top-0 shadow-[0_24px_56px_-36px_rgba(0,0,0,0.95),inset_0_1px_0_rgba(160,190,255,0.12)] relative dt-root-layer rounded-b-2xl overflow-hidden">
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#7ca4ffb3] to-transparent" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(98,145,248,0.2),transparent_48%),radial-gradient(circle_at_88%_0%,rgba(84,178,255,0.16),transparent_52%)] opacity-65" />

            <div className="flex items-center gap-3 min-w-[240px] relative z-[1]">
                <img
                    src="/OpsBoard_Brand_Pack/assets/png/opsboard-icon-64.png"
                    alt="OpsBoard"
                    className="h-10 w-10 shrink-0 object-contain select-none drop-shadow-[0_0_14px_rgba(94,154,255,0.45)]"
                    draggable={false}
                />
                <div className="flex flex-col justify-center leading-tight">
                    <span className="text-[1.2rem] font-bold tracking-tight bg-gradient-to-r from-[#8db8ff] via-[#66c4ff] to-[#70e1ff] bg-clip-text text-transparent drop-shadow-[0_0_14px_rgba(96,165,250,0.28)]">
                        OpsBoard
                    </span>
                    <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#9db2d5]">
                        Enterprise Platform
                    </span>
                </div>
            </div>

            <div className="flex-1 flex justify-center px-6 relative z-[1]">
                <HeaderSearch ref={searchInputRef} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
            </div>

            <div className="flex items-center justify-end gap-3 min-w-[320px] relative z-[1]">
                <div className="hidden lg:flex items-center gap-4 mr-2 border-r border-slate-700/50 pr-4">
                    <HeaderWeather />
                    <HeaderClock />
                </div>

                <Button
                    type="button"
                    onClick={onNewTask}
                    className="px-4 py-2 text-xs dt-shine-btn"
                >
                    <Plus size={14} /> New Task
                </Button>

                <Button
                    variant={showArchived ? 'primary' : 'ghost'}
                    size="icon"
                    onClick={() => setShowArchived(!showArchived)}
                    title={showArchived ? 'Hide Archive' : 'Show Archive'}
                    className={showArchived ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20' : 'text-textSecondary hover:text-textPrimary'}
                >
                    <Archive size={18} />
                </Button>

                <div className="flex items-center gap-3 pl-2 border-l border-slate-700/50 ml-1">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-textPrimary text-xs font-bold ring-2 ring-slate-800 shadow-md transform hover:scale-105 transition-transform cursor-pointer">
                        {currentUser.name.charAt(0)}
                    </div>
                    <button onClick={onLogout} className="text-textMuted hover:text-textSecondary transition-colors ml-1 p-1 hover:bg-slate-800 rounded-full" title="Logout">
                        <LogOut size={16} />
                    </button>
                </div>
            </div>
        </header>
    );
}

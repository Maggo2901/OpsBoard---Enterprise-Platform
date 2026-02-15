import React, { forwardRef } from 'react';
import { Search } from 'lucide-react';

const HeaderSearch = forwardRef(function HeaderSearch({ searchQuery, setSearchQuery }, ref) {
    return (
        <div className="relative group w-full max-w-md mx-auto">
            <Search 
                size={16} 
                className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted group-focus-within:text-primary transition-colors pointer-events-none" 
            />
            <input 
                ref={ref}
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks..." 
                className="w-full bg-[linear-gradient(180deg,rgba(13,21,38,0.78)_0%,rgba(8,14,28,0.82)_100%)] border border-[rgba(124,156,255,0.24)] rounded-full pl-9 pr-4 py-1.5 text-sm text-textPrimary placeholder:text-textPlaceholder focus:outline-none focus:ring-2 focus:ring-primary/35 focus:border-primary/65 transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_0_1px_rgba(129,165,250,0.06)] group-focus-within:shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_0_0_1px_rgba(130,170,255,0.28),0_0_18px_-8px_rgba(97,145,240,0.75)]"
            />
            <span className="pointer-events-none absolute inset-0 rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity duration-200 border border-[rgba(123,168,255,0.55)] animate-pulse" />
        </div>
    );
});

export default HeaderSearch;

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export default function CreateBoardModal({ isOpen, onClose, onSubmit }) {
    const [title, setTitle] = useState('');
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setTitle('');
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title.trim()) return;
        onSubmit(title.trim());
        onClose();
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
                onClick={onClose} 
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-6 transform transition-all scale-100 animate-in zoom-in-95 duration-200">
                <button 
                    onClick={onClose}
                    className="absolute right-4 top-4 text-textTertiary hover:text-textPrimary transition-colors"
                >
                    <X size={20} />
                </button>

                <h2 className="text-xl font-bold text-primary mb-6">Create New Board</h2>

                <form onSubmit={handleSubmit}>
                    <div className="mb-6">
                        <label htmlFor="board-title" className="block text-sm font-medium text-textSecondary mb-2">
                            Board Name
                        </label>
                        <input
                            ref={inputRef}
                            id="board-title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Project Alpha, Marketing, Roadmap..."
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-textPrimary placeholder:text-textPlaceholder focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                            autoComplete="off"
                        />
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg text-textTertiary hover:text-textPrimary hover:bg-slate-800 transition-colors font-medium text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!title.trim()}
                            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-sm shadow-lg shadow-primary/20"
                        >
                            Create Board
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}

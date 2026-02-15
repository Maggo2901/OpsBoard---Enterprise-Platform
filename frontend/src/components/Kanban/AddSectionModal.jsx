import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export default function AddSectionModal({ isOpen, onClose, onSubmit }) {
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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm animate-in fade-in duration-200">
            {/* Backdrop click to close */}
            <div className="absolute inset-0" onClick={onClose} />

            <div className="relative w-full max-w-md bg-surface/90 backdrop-blur-md border border-[rgba(124,156,255,0.24)] rounded-2xl shadow-modal p-6 transform transition-all scale-100 animate-in zoom-in-95 duration-200">
                <button 
                    onClick={onClose}
                    className="absolute right-4 top-4 text-textTertiary hover:text-textPrimary transition-colors"
                >
                    <X size={20} />
                </button>

                <h2 className="text-xl font-bold text-primary mb-6">Add New Section</h2>

                <form onSubmit={handleSubmit}>
                    <div className="mb-6">
                        <label htmlFor="column-title" className="block text-sm font-medium text-textSecondary mb-2">
                            Section Name
                        </label>
                        <input
                            ref={inputRef}
                            id="column-title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. In Progress, Review, Done..."
                            className="w-full bg-slate-950/70 border border-[rgba(124,156,255,0.24)] rounded-lg px-4 py-2.5 text-textPrimary placeholder:text-textPlaceholder focus:outline-none focus:ring-2 focus:ring-primary/55 focus:border-primary/60 transition-all"
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
                            className="px-4 py-2 rounded-lg bg-gradient-to-b from-[#6ea0ff] to-[#4f7fe7] text-[#eaf2ff] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-sm shadow-[0_12px_26px_-12px_rgba(79,127,231,0.9)]"
                        >
                            Create Section
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

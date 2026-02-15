import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Layout } from 'lucide-react';

export default function RenameBoardModal({ isOpen, onClose, onConfirm, currentName }) {
    const [name, setName] = useState(currentName);
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setName(currentName);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen, currentName]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (name.trim() !== currentName) {
            onConfirm(name.trim());
        } else {
            onClose();
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            
            <form onSubmit={handleSubmit} className="relative w-full max-w-sm bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-6 transform transition-all scale-100 animate-in zoom-in-95 duration-200">
                <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-3">
                    <div className="bg-primary/20 p-2 rounded-lg text-primary">
                        <Layout size={20} />
                    </div>
                    <h2 className="text-lg font-bold text-primary tracking-tight">Rename Board</h2>
                </div>

                <div className="mb-6 relative">
                    <label className="text-xs font-medium text-textTertiary uppercase tracking-widest absolute -top-5 left-0">New Name</label>
                    <input 
                        ref={inputRef}
                        type="text" 
                        value={name} 
                        onChange={e => setName(e.target.value)} 
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-lg font-medium placeholder:text-textPlaceholder"
                        placeholder="e.g. New Project Name"
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
                        disabled={!name.trim()}
                        className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-sm shadow-lg shadow-primary/20"
                    >
                        Save Changes
                    </button>
                </div>
            </form>
        </div>,
        document.body
    );
}

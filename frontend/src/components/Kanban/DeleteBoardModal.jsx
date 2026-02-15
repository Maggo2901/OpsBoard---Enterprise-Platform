import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Trash2, AlertTriangle } from 'lucide-react';

export default function DeleteBoardModal({ isOpen, onClose, onConfirm, boardName }) {
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
            
            <div className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6 transform transition-all scale-100 animate-in zoom-in-95 duration-200 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-red-500" />
                
                <div className="flex items-center gap-4 mb-4 text-red-500">
                    <div className="bg-red-500/10 p-3 rounded-full">
                        <Trash2 size={24} />
                    </div>
                    <h2 className="text-lg font-bold text-primary">Delete Board?</h2>
                </div>

                <p className="text-textSecondary text-sm mb-6 leading-relaxed">
                    Are you sure you want to delete <span className="text-textPrimary font-medium">"{boardName}"</span>? 
                    This action is permanent and will remove all tasks and columns associated with this board.
                </p>

                <div className="flex justify-end gap-3">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-textTertiary hover:text-textPrimary hover:bg-slate-800 transition-colors font-medium text-sm"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={onConfirm}
                        className="px-4 py-2 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all font-medium text-sm flex items-center gap-2 group"
                    >
                        <AlertTriangle size={14} className="group-hover:hidden" />
                        <Trash2 size={14} className="hidden group-hover:block" />
                        Confirm Delete
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

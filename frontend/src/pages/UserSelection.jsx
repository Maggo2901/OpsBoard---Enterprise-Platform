import React, { useEffect, useMemo, useRef, useState } from 'react';
import api from '../services/api';
import { Button } from '../components/UI';
import ConfirmModal from '../components/ConfirmModal';
import { User, Plus, Trash2 } from 'lucide-react';

export default function UserSelection({ onSelect }) {
    const MAX_VISIBLE_USERS = 6;
    const USER_ROW_GAP_PX = 12;
    const [users, setUsers] = useState([]);
    const [newName, setNewName] = useState('');
    const [loading, setLoading] = useState(true);
    const [pendingDeleteUserId, setPendingDeleteUserId] = useState(null);
    const [userRowHeight, setUserRowHeight] = useState(0);
    const sampleUserRowRef = useRef(null);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users');
            // Handle both direct array (via interceptor) and wrapped format { success: true, data: [...] }
            let data = res.data;
            if (!Array.isArray(data) && data?.data && Array.isArray(data.data)) {
                data = data.data;
            }
            setUsers(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to fetch users", error);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        const row = sampleUserRowRef.current;
        if (!row || typeof ResizeObserver === 'undefined') return;

        const updateRowHeight = () => {
            const measuredHeight = Math.ceil(row.getBoundingClientRect().height);
            if (measuredHeight > 0) setUserRowHeight(measuredHeight);
        };

        updateRowHeight();
        const observer = new ResizeObserver(updateRowHeight);
        observer.observe(row);

        return () => observer.disconnect();
    }, [users.length, loading]);

    const shouldScrollUsers = users.length > MAX_VISIBLE_USERS && userRowHeight > 0;
    const usersListMaxHeight = useMemo(() => {
        if (!shouldScrollUsers) return undefined;
        return (userRowHeight * MAX_VISIBLE_USERS) + (USER_ROW_GAP_PX * (MAX_VISIBLE_USERS - 1));
    }, [shouldScrollUsers, userRowHeight]);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!newName.trim()) return;
        try {
            await api.post('/users', { name: newName });
            setNewName('');
            fetchUsers();
        } catch (error) {
            alert('Error creating user');
        }
    };

    const handleDelete = (e, id) => {
        e.stopPropagation();
        setPendingDeleteUserId(id);
    };

    const handleConfirmDelete = async () => {
        if (!pendingDeleteUserId) return;
        try {
            await api.delete(`/users/${pendingDeleteUserId}`);
            fetchUsers();
        } catch (error) {
            alert('Error deleting user');
        } finally {
            setPendingDeleteUserId(null);
        }
    };

    return (
        <div className="min-h-screen relative bg-background flex flex-col items-center justify-center p-4 overflow-hidden dt-root-layer">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute inset-0 bg-[radial-gradient(1200px_circle_at_50%_22%,rgba(66,118,232,0.18),transparent_62%),linear-gradient(180deg,rgba(8,14,28,0.75)_0%,rgba(7,12,22,0.88)_100%)]" />
                <div className="absolute inset-0 dt-login-sweep" />
                <div className="absolute inset-0 dt-login-vignette" />
            </div>

            <div className="max-w-2xl w-full space-y-8 relative z-[1] dt-login-enter">
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center gap-4 px-4 py-2 rounded-2xl">
                        <div className="relative">
                            <span className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(80,142,255,0.45)_0%,transparent_72%)] blur-lg dt-login-aura" />
                            <img
                                src="/OpsBoard_Brand_Pack/assets/png/opsboard-icon-64.png"
                                alt="OpsBoard"
                                className="relative h-16 w-16 object-contain drop-shadow-[0_0_18px_rgba(95,155,255,0.48)]"
                                draggable={false}
                            />
                        </div>
                        <div className="text-left">
                            <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-[#93bcff] via-[#75c3ff] to-[#7ee8ff] bg-clip-text text-transparent drop-shadow-[0_0_14px_rgba(98,164,255,0.3)]">
                                OpsBoard
                            </h1>
                            <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-[#afc5e8]">Enterprise Platform</p>
                        </div>
                    </div>
                    <p className="text-textSecondary text-base">Select your profile to continue</p>
                </div>

                <div className="relative rounded-[24px] border border-[rgba(130,164,244,0.24)] bg-[linear-gradient(180deg,rgba(16,27,46,0.8)_0%,rgba(10,18,34,0.84)_100%)] backdrop-blur-sm px-9 py-10 shadow-[0_30px_70px_-36px_rgba(0,0,0,0.95),inset_0_1px_0_rgba(160,190,255,0.12)] overflow-hidden">
                    <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[#8bb5ffb3] to-transparent" />
                    {loading ? (
                        <div className="text-center text-textSecondary py-8">Loading users...</div>
                    ) : (
                        <div className="rounded-2xl overflow-visible">
                            <div
                                className={`grid gap-4 overflow-x-hidden custom-scrollbar ${shouldScrollUsers ? 'overflow-y-auto pr-2' : 'overflow-y-visible pr-0'}`}
                                style={usersListMaxHeight ? { maxHeight: `${usersListMaxHeight}px` } : undefined}
                            >
                            {users.map((user, index) => (
                                <div
                                    key={user.id}
                                    onClick={() => onSelect(user)}
                                    ref={index === 0 ? sampleUserRowRef : undefined}
                                    className="group relative isolate w-[88%] mx-auto min-h-16 flex items-center justify-between px-4 py-2.5 rounded-[20px] overflow-visible bg-[linear-gradient(180deg,rgba(17,29,50,0.72)_0%,rgba(11,20,38,0.8)_100%)] border border-[rgba(124,156,255,0.16)] hover:border-blue-500/30 cursor-pointer transition-all duration-200 ease-out hover:shadow-[0_0_18px_rgba(59,130,246,0.32)]"
                                >
                                    <span className="pointer-events-none absolute inset-0 rounded-[20px] bg-[radial-gradient(circle_at_22%_50%,rgba(59,130,246,0.14),transparent_68%)] opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                                    <div className="relative z-[1] flex items-center flex-1 min-w-0">
                                        <div className="relative h-7 w-7 shrink-0">
                                            <span className="pointer-events-none absolute inset-[-14px] rounded-full bg-[radial-gradient(circle,rgba(80,120,255,0.34)_0%,rgba(80,120,255,0.16)_38%,rgba(80,120,255,0.07)_58%,rgba(80,120,255,0.02)_76%,transparent_92%)] blur-[18px]" />
                                            <span className="relative h-7 w-7 rounded-full bg-primary/20 border border-primary/25 text-primary flex items-center justify-center">
                                                <User size={14} />
                                            </span>
                                        </div>
                                        <span className="flex-1 text-center pr-8 font-medium text-textPrimary group-hover:text-[#d8e7ff] transition-colors truncate">{user.name}</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={(e) => handleDelete(e, user.id)}
                                        className="relative z-[1] text-textMuted hover:text-red-300 opacity-0 group-hover:opacity-100 transition-all p-1.5 rounded-md hover:bg-red-500/12 shrink-0"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                            {users.length === 0 && (
                                <p className="text-center text-textTertiary py-4">No users found.</p>
                            )}
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleCreate} className="mt-6 flex gap-2 pt-6 border-t border-[rgba(124,156,255,0.2)]">
                        <input
                            placeholder="Enter new user name..." 
                            value={newName} 
                            onChange={e => setNewName(e.target.value)}
                            className="w-full bg-[linear-gradient(180deg,rgba(12,19,34,0.8)_0%,rgba(8,14,26,0.86)_100%)] border border-[rgba(124,156,255,0.24)] rounded-xl px-3.5 py-2.5 text-sm text-textPrimary placeholder:text-textPlaceholder shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] focus:outline-none focus:ring-2 focus:ring-primary/35 focus:border-primary/60 focus:shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_0_0_1px_rgba(126,168,255,0.25),0_0_16px_-8px_rgba(108,155,255,0.8)] transition-all"
                        />
                        <Button type="submit" disabled={!newName.trim()} className="rounded-xl dt-shine-btn dt-login-add-btn">
                            <Plus size={20} />
                        </Button>
                    </form>
                </div>
            </div>
            <ConfirmModal
                isOpen={pendingDeleteUserId !== null}
                title="Delete User"
                message="Do you really want to delete this user profile?"
                confirmText="Delete"
                variant="danger"
                onConfirm={handleConfirmDelete}
                onCancel={() => setPendingDeleteUserId(null)}
            />
        </div>
    );
}

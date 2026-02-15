import React, { useState, useEffect, useMemo, useRef } from 'react';
import { DndContext, DragOverlay, closestCorners, pointerWithin, rectIntersection, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { arrayMove } from '@dnd-kit/sortable';
import api from '../services/api';
import Column from '../components/Kanban/Column';
import TaskCard from '../components/Kanban/TaskCard';
import BoardHeader from '../components/Kanban/BoardHeader';
import BoardSidebar from '../components/Kanban/BoardSidebar';
import SearchView from '../components/Kanban/SearchView';
import TaskModal from '../components/Kanban/TaskModal';
import AddSectionModal from '../components/Kanban/AddSectionModal';
import ConfirmModal from '../components/ConfirmModal';
import { Plus } from 'lucide-react';
import ArchiveView from '../pages/ArchiveView';

export default function KanbanBoard({ currentUser, onLogout }) {
    const [boards, setBoards] = useState([]);
    const [activeBoardId, setActiveBoardId] = useState(null);
    const [boardData, setBoardData] = useState({ columns: [], tasks: [] });
    const [activeDragItem, setActiveDragItem] = useState(null);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [showArchived, setShowArchived] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [globalSearchEntries, setGlobalSearchEntries] = useState([]);
    const [globalSearchLoading, setGlobalSearchLoading] = useState(false);
    const [searchIndexKey, setSearchIndexKey] = useState('');
    const [searchBoardColumnsById, setSearchBoardColumnsById] = useState({});
    const [modalColumns, setModalColumns] = useState([]);
    const [pendingDeleteTaskId, setPendingDeleteTaskId] = useState(null);
    const [pendingDeleteColumn, setPendingDeleteColumn] = useState(null);
    const [columnDeleteBlocked, setColumnDeleteBlocked] = useState(false);
    const searchInputRef = useRef(null);
    
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    );

    const collisionDetectionStrategy = React.useCallback((args) => {
        const activeType = args.active?.data?.current?.type;

        if (activeType === 'COLUMN') {
            const columnContainers = args.droppableContainers.filter(container =>
                String(container.id).startsWith('col-')
            );
            return closestCorners({ ...args, droppableContainers: columnContainers });
        }

        if (activeType === 'TASK') {
            const taskAndColumnContainers = args.droppableContainers.filter(container => {
                const id = String(container.id);
                return id.startsWith('task-') || id.startsWith('drop-col-');
            });

            const pointerCollisions = pointerWithin({
                ...args,
                droppableContainers: taskAndColumnContainers
            });
            if (pointerCollisions.length > 0) return pointerCollisions;

            const rectCollisions = rectIntersection({
                ...args,
                droppableContainers: taskAndColumnContainers
            });
            if (rectCollisions.length > 0) return rectCollisions;

            return closestCorners({
                ...args,
                droppableContainers: taskAndColumnContainers
            });
        }

        return closestCorners(args);
    }, []);

    useEffect(() => { fetchBoards(); }, []);
    useEffect(() => {
        if (activeBoardId) fetchBoardDetails(activeBoardId);
        else setBoardData({ columns: [], tasks: [] });
    }, [activeBoardId, refreshTrigger]);

    const filteredTasks = useMemo(() => boardData.tasks, [boardData.tasks]);

    const hasGlobalSearchQuery = debouncedSearchQuery.trim().length > 0;

    const fetchBoards = async () => {
        try {
            const res = await api.get('/boards');
            const data = Array.isArray(res.data) ? res.data : [];
            setBoards(data);
            if (data.length > 0 && !activeBoardId) setActiveBoardId(data[0].id);
        } catch (e) {
            console.error("Failed to fetch boards", e);
            setBoards([]);
        }
    };

    const fetchBoardDetails = async (id) => {
        try {
            const res = await api.get(`/boards/${id}`);
            setBoardData({ columns: res.data.columns, tasks: res.data.tasks });
        } catch (error) { console.error(error); }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery.trim());
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        if (!hasGlobalSearchQuery) return;
        if (boards.length === 0) {
            setGlobalSearchEntries([]);
            setSearchBoardColumnsById({});
            return;
        }

        const key = `${boards.map((b) => b.id).join('-')}-${refreshTrigger}`;
        if (searchIndexKey === key && globalSearchEntries.length > 0) return;

        let cancelled = false;
        const buildSearchIndex = async () => {
            setGlobalSearchLoading(true);
            try {
                const responses = await Promise.all(
                    boards.map(async (board) => {
                        const res = await api.get(`/boards/${board.id}`);
                        return {
                            boardId: board.id,
                            boardName: board.name,
                            columns: res.data?.columns || [],
                            tasks: res.data?.tasks || [],
                        };
                    })
                );

                if (cancelled) return;

                const entries = [];
                const columnsMap = {};

                responses.forEach((boardDataItem) => {
                    const columnNameById = Object.fromEntries(
                        boardDataItem.columns.map((column) => [Number(column.id), column.name])
                    );
                    columnsMap[boardDataItem.boardId] = boardDataItem.columns;

                    boardDataItem.tasks.forEach((task) => {
                        const labelNames = (task.labels || []).map((label) => label.name).filter(Boolean);
                        entries.push({
                            task: { ...task },
                            boardId: boardDataItem.boardId,
                            boardName: boardDataItem.boardName,
                            sectionName: columnNameById[Number(task.column_id)] || 'Unknown Section',
                            columnId: Number(task.column_id),
                            labelNames,
                        });
                    });
                });

                setGlobalSearchEntries(entries);
                setSearchBoardColumnsById(columnsMap);
                setSearchIndexKey(key);
            } catch (error) {
                if (!cancelled) {
                    console.error('Failed building global search index', error);
                    setGlobalSearchEntries([]);
                    setSearchBoardColumnsById({});
                }
            } finally {
                if (!cancelled) setGlobalSearchLoading(false);
            }
        };

        buildSearchIndex();
        return () => {
            cancelled = true;
        };
    }, [hasGlobalSearchQuery, boards, refreshTrigger, searchIndexKey, globalSearchEntries.length]);

    const globalSearchResults = useMemo(() => {
        if (!hasGlobalSearchQuery) return [];
        const q = debouncedSearchQuery.toLowerCase();
        return globalSearchEntries.filter((entry) => {
            const title = (entry.task.title || '').toLowerCase();
            const description = (entry.task.description || '').toLowerCase();
            const labels = entry.labelNames.join(' ').toLowerCase();
            return title.includes(q) || description.includes(q) || labels.includes(q);
        });
    }, [hasGlobalSearchQuery, debouncedSearchQuery, globalSearchEntries]);

    useEffect(() => {
        const handleShortcut = (event) => {
            const isShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k';
            if (!isShortcut) return;
            event.preventDefault();
            searchInputRef.current?.focus();
            searchInputRef.current?.select();
        };
        window.addEventListener('keydown', handleShortcut);
        return () => window.removeEventListener('keydown', handleShortcut);
    }, []);

    const handleDragStart = (event) => {
        const { active } = event;
        // Safe access: dnd-kit wraps data in .current by default
        if (active?.data?.current) {
            setActiveDragItem(active.data.current);
        }
    };

    const handleDragOver = (event) => {
        const { active, over } = event;
        if (!over) return;
        if (!active?.data?.current || !over?.data?.current) return;

        const activeId = active.data.current.id; // DB ID
        const overId = over.data.current.id;     // DB ID

        const activeType = active.data.current.type;
        const overType = over.data.current.type;
        
        if (activeType === 'TASK' && overType === 'TASK') {
            const activeTask = active.data.current.task;
            const overTask = over.data.current.task;
            if (!activeTask || !overTask) return;

            setBoardData(prev => {
                const activeIndex = prev.tasks.findIndex(t => t.id === activeId);
                const overIndex = prev.tasks.findIndex(t => t.id === overId);

                if (activeIndex === -1 || overIndex === -1) return prev;

                const newTasks = [...prev.tasks];
                if (activeTask.column_id !== overTask.column_id) {
                    newTasks[activeIndex] = { ...newTasks[activeIndex], column_id: overTask.column_id };
                }

                if (activeIndex !== overIndex) {
                    return { ...prev, tasks: arrayMove(newTasks, activeIndex, overIndex) };
                }

                return prev;
            });
        }

        if (activeType === 'TASK' && overType === 'COLUMN') {
             const activeTask = active.data.current.task;
             const overColumnId = over.data.current.id;
             
             if (activeTask && activeTask.column_id !== overColumnId) {
                 setBoardData(prev => {
                     const activeIndex = prev.tasks.findIndex(t => t.id === activeId);
                     if (activeIndex !== -1) {
                         const newTasks = [...prev.tasks];
                         newTasks[activeIndex] = { ...newTasks[activeIndex], column_id: overColumnId };
                         return { ...prev, tasks: newTasks };
                     }
                     return prev;
                 });
             }
        }
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        
        if (!over) {
            if (active?.data?.current?.type === 'TASK') {
                console.warn('Task drop cancelled: no destination under pointer.', { activeId: active?.id });
            }
            setActiveDragItem(null);
            return;
        }

        // Active should be reliable, but data.current might have updated during render.
        // We use activeDragItem (snapshot from DragStart) for original state.
        
        // We use activeDragItem (snapshot from DragStart) for original state.
        
        const activeId = active.data.current?.id;
        const overId = over.data.current?.id;
        const activeType = active.data.current?.type;
        const overType = over.data.current?.type;

        if (activeId == null || overId == null) {
            console.warn('Drag end missing IDs', { activeId, overId, activeType, overType });
            setActiveDragItem(null);
            return;
        }

        // 1. Column Sorting
        if (activeType === 'COLUMN' && overType === 'COLUMN') {
            if (activeId !== overId) {
                const oldIndex = boardData.columns.findIndex(c => c.id === activeId);
                const newIndex = boardData.columns.findIndex(c => c.id === overId);
                
                const newColumns = arrayMove(boardData.columns, oldIndex, newIndex);
                setBoardData(prev => ({ ...prev, columns: newColumns }));
                
                const updates = newColumns.map((col, index) => ({ id: col.id, position: index }));
                try {
                    await api.post('/columns/reorder', { columns: updates });
                } catch (error) {
                    console.error("Failed to reorder columns:", error);
                    alert("Failed to save column order. reverting...");
                    setRefreshTrigger(prev => prev + 1); // Rollback
                }
            }
            setActiveDragItem(null);
            return;
        }

        // 2. Task Sorting / Moving
        if (activeType === 'TASK') {
            // Use snapshot from start of drag for original props
            const originalTask = activeDragItem?.task || active.data.current?.task;
            const activeTask = active.data.current?.task || originalTask;
            
            let newColumnId = null;

            // Determine target column
            if (overType === 'COLUMN') newColumnId = overId;
            else if (overType === 'TASK') {
                // If over a task, 'over' might be updated in state already, essentially giving us the visual column
                newColumnId = over.data.current?.task?.column_id;
            }

            if (newColumnId) {
                const oldIndex = boardData.tasks.findIndex(t => t.id === activeId);
                const newIndex = boardData.tasks.findIndex(t => t.id === overId);

                // Same column reorder - Visual only (unless we add rank later)
                if (originalTask?.column_id === newColumnId && overType === 'TASK' && oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
                     setBoardData(prev => ({
                         ...prev, 
                         tasks: arrayMove(prev.tasks, oldIndex, newIndex)
                     }));
                }

                if (originalTask?.column_id === newColumnId && overType === 'COLUMN') {
                    setActiveDragItem(null);
                    return;
                }

                // Column Change - Persist
                // compare with originalTask.column_id (start of drag) vs newColumnId (drop target)
                if (originalTask && originalTask.column_id !== newColumnId) {
                    try {
                        await api.patch(`/tasks/${activeId}/move`, { column_id: newColumnId, user_id: currentUser.id });
                        setRefreshTrigger(prev => prev + 1); 
                    } catch (err) {
                        console.error("Failed to move task", err);
                        alert("Failed to move task. Reverting...");
                        setRefreshTrigger(prev => prev + 1); // Rollback
                    }
                }
            } else {
                console.warn('Task drop had no resolved destination column', { activeId, overId, overType });
            }
        }
        
        setActiveDragItem(null);
    };

    const handleCreateTask = async (taskData) => {
        const res = await api.post('/tasks', { ...taskData, board_id: activeBoardId, created_by: currentUser.id });
        const createdTask = res.data;
        setBoardData(prev => ({
            ...prev,
            tasks: [createdTask, ...prev.tasks]
        }));
        setIsTaskModalOpen(false);
    };
    
    const handleUpdateTask = async (id, data) => {
        await api.put(`/tasks/${id}`, { ...data, user_id: currentUser.id });
        setRefreshTrigger(prev => prev + 1);
        setIsTaskModalOpen(false);
    };

    const handleDeleteTask = (id) => {
      setPendingDeleteTaskId(id);
    };

    const handleConfirmDeleteTask = async () => {
      if (!pendingDeleteTaskId) return;
      await api.delete(`/tasks/${pendingDeleteTaskId}`);
      setRefreshTrigger(prev => prev + 1);
      setIsTaskModalOpen(false);
      setPendingDeleteTaskId(null);
    };

    const handleArchiveTask = async (id) => {
        try {
            await api.patch(`/tasks/${id}/archive`, { user_id: currentUser.id });
            // Remove task from local state
            setBoardData(prev => ({
                ...prev,
                tasks: prev.tasks.filter(t => t.id !== id)
            }));
            setIsTaskModalOpen(false);
            setRefreshTrigger(prev => prev + 1); // Ensure full sync
        } catch (error) {
            console.error("Failed to archive task", error);
        }
    };

    const openNewTask = () => {
        if (!activeBoardId) return;
        setModalColumns(boardData.columns);
        setEditingTask(null); 
        setIsTaskModalOpen(true); 
    };
    const openEditTask = (task) => {
        setModalColumns(boardData.columns);
        setEditingTask(task);
        setIsTaskModalOpen(true);
    };

    const openSearchResultTask = (result) => {
        const columnsForBoard = searchBoardColumnsById[result.boardId] || [];
        setModalColumns(columnsForBoard.length > 0 ? columnsForBoard : boardData.columns);
        setEditingTask({ ...result.task, column_id: result.columnId });
        setIsTaskModalOpen(true);
    };

    const handleCreateBoard = async (name) => {
        const res = await api.post('/boards', { name });
        const newBoard = res.data;
        setBoards(prev => [newBoard, ...prev]);
        setActiveBoardId(newBoard.id);
    };

    const handleRenameBoard = async (name) => {
        if (!activeBoardId) return;
        const res = await api.put(`/boards/${activeBoardId}`, { name });
        const updatedBoard = res.data;
        setBoards(prev => prev.map(board => board.id === updatedBoard.id ? updatedBoard : board));
    };

    const handleDeleteBoard = async (boardId) => {
        if (!boardId) return;
        await api.delete(`/boards/${boardId}`);
        const remainingBoards = boards.filter(board => board.id !== boardId);
        setBoards(remainingBoards);
        setActiveBoardId(remainingBoards[0]?.id || null);
    };

    const handleAddColumn = async (title) => {
        try {
            const res = await api.post('/columns', { 
                board_id: activeBoardId,
                name: title,
                position: boardData.columns.length 
            });
            // Update local state immediately
            setBoardData(prev => ({
                ...prev,
                columns: [...prev.columns, res.data]
            }));
        } catch (error) {
            console.error("Failed to add column:", error);
        }
    };

    const handleRenameColumn = async (columnId, nextName) => {
        await api.put(`/columns/${columnId}`, { name: nextName });
        setBoardData(prev => ({
            ...prev,
            columns: prev.columns.map(column => column.id === columnId ? { ...column, name: nextName } : column)
        }));
    };

    const moveColumnByOffset = async (columnId, offset) => {
        const fromIndex = boardData.columns.findIndex(column => column.id === columnId);
        const toIndex = fromIndex + offset;
        if (fromIndex < 0 || toIndex < 0 || toIndex >= boardData.columns.length) return;

        const reordered = arrayMove(boardData.columns, fromIndex, toIndex);
        setBoardData(prev => ({ ...prev, columns: reordered }));

        try {
            const updates = reordered.map((column, index) => ({ id: column.id, position: index }));
            await api.post('/columns/reorder', { columns: updates });
        } catch (error) {
            console.error('Failed moving section', error);
            setRefreshTrigger(prev => prev + 1);
        }
    };

    const requestDeleteColumn = (columnId) => {
        const columns = boardData.columns;
        if (columns.length <= 1) {
            setColumnDeleteBlocked(true);
            return;
        }

        const targetColumn = columns.find(column => column.id === columnId);
        if (!targetColumn) return;

        const fallbackToDo = columns.find(column => column.id !== columnId && column.name.trim().toLowerCase() === 'to do');
        const fallbackColumn = fallbackToDo || columns.find(column => column.id !== columnId);
        if (!fallbackColumn) {
            setColumnDeleteBlocked(true);
            return;
        }

        setPendingDeleteColumn({
            id: columnId,
            name: targetColumn.name,
            fallbackId: fallbackColumn.id,
            fallbackName: fallbackColumn.name,
        });
    };

    const confirmDeleteColumn = async () => {
        if (!pendingDeleteColumn) return;

        const { id, fallbackId } = pendingDeleteColumn;
        try {
            await api.delete(`/columns/${id}`, { data: { fallback_column_id: fallbackId, user_id: currentUser.id } });

            setBoardData(prev => ({
                ...prev,
                columns: prev.columns.filter(column => column.id !== id),
                tasks: prev.tasks.map(task => task.column_id === id ? { ...task, column_id: fallbackId } : task)
            }));
            setRefreshTrigger(prev => prev + 1);
        } catch (error) {
            console.error('Failed deleting section', error);
            alert('Failed to delete section.');
        } finally {
            setPendingDeleteColumn(null);
        }
    };

    return (
        <div className="h-screen flex flex-col bg-background text-textPrimary overflow-hidden font-sans selection:bg-primary/30 selection:text-white dt-root-layer">
            <BoardHeader 
                onLogout={onLogout}
                currentUser={currentUser}
                onNewTask={openNewTask}
                showArchived={showArchived}
                setShowArchived={setShowArchived}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                searchInputRef={searchInputRef}
            />

            <div className="flex w-full h-[calc(100vh-80px)]">
                <BoardSidebar
                    boards={boards}
                    activeBoardId={activeBoardId}
                    onSwitchBoard={setActiveBoardId}
                    onCreateBoard={handleCreateBoard}
                    onRenameBoard={handleRenameBoard}
                    onDeleteBoard={handleDeleteBoard}
                />

                {/* Board Background Area */}
                {hasGlobalSearchQuery ? (
                    <main className="flex-1 min-w-0 overflow-hidden relative">
                        <div className="pointer-events-none absolute inset-0">
                            <div className="absolute inset-0 bg-[#091121]" />
                            <div className="absolute inset-y-0 left-[-18%] w-[55%] bg-[radial-gradient(ellipse_at_left,_rgba(82,130,236,0.13),_transparent_72%)]" />
                            <div className="absolute inset-y-0 right-[-18%] w-[55%] bg-[radial-gradient(ellipse_at_right,_rgba(91,139,242,0.11),_transparent_72%)]" />
                        </div>
                        <SearchView
                            query={debouncedSearchQuery}
                            loading={globalSearchLoading}
                            results={globalSearchResults}
                            onOpenTask={openSearchResultTask}
                        />
                    </main>
                ) : showArchived ? (
                    <div className="flex-1 min-w-0 relative">
                        <ArchiveView 
                            boardId={activeBoardId}
                            currentUser={currentUser}
                            onClose={() => setShowArchived(false)}
                            onRestore={() => setRefreshTrigger(prev => prev + 1)}
                        />
                    </div>
                ) : (
                    <main className="flex-1 min-w-0 overflow-x-auto overflow-y-hidden relative">
                        <div className="pointer-events-none absolute inset-0">
                            <div className="absolute inset-0 bg-[#091121]" />
                            <div className="absolute inset-y-0 left-[-18%] w-[55%] bg-[radial-gradient(ellipse_at_left,_rgba(82,130,236,0.13),_transparent_72%)]" />
                            <div className="absolute inset-y-0 right-[-18%] w-[55%] bg-[radial-gradient(ellipse_at_right,_rgba(91,139,242,0.11),_transparent_72%)]" />
                        </div>
                        <div className="relative z-[1] h-full w-full px-8 xl:px-16 2xl:px-24 py-8">
                            <DndContext 
                                sensors={sensors} 
                                collisionDetection={collisionDetectionStrategy}
                                onDragStart={handleDragStart}
                                onDragOver={handleDragOver}
                                onDragEnd={handleDragEnd}
                            >
                                <div className="flex h-full min-w-max gap-10 xl:gap-12">
                                    <SortableContext 
                                        items={boardData.columns.map(c => `col-${c.id}`)} 
                                        strategy={horizontalListSortingStrategy}
                                    >
                                        {boardData.columns.map((col, index) => (
                                            <Column 
                                                key={col.id} 
                                                column={col} 
                                                index={index}
                                                tasks={filteredTasks.filter(t => t.column_id === col.id && !t.is_archived)}
                                                onEditTask={openEditTask}
                                                canMoveLeft={index > 0}
                                                canMoveRight={index < boardData.columns.length - 1}
                                                onMoveLeft={(id) => moveColumnByOffset(id, -1)}
                                                onMoveRight={(id) => moveColumnByOffset(id, 1)}
                                                onDeleteColumn={requestDeleteColumn}
                                                onRenameColumn={handleRenameColumn}
                                            />
                                        ))}
                                    </SortableContext>
                                    
                                    <div 
                                        onClick={() => setIsAddModalOpen(true)}
                                        className="min-w-[390px] w-[28vw] max-w-[500px] h-12 border border-dashed border-[rgba(124,156,255,0.24)] rounded-xl flex items-center justify-center text-textTertiary hover:text-textSecondary hover:border-[rgba(151,181,255,0.5)] hover:bg-slate-900/45 cursor-pointer transition-all shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                                    >
                                        <span className="flex items-center gap-2 text-sm font-medium"><Plus size={18} /> Add Section</span>
                                    </div>
                                </div>

                                <DragOverlay>
                                    {activeDragItem ? (
                                        activeDragItem.type === 'COLUMN' ? (
                                            <div className="opacity-90 grayscale-[0.2]">
                                                <Column 
                                                    column={activeDragItem.column} 
                                                    tasks={boardData.tasks.filter(t => t.column_id === activeDragItem.id && !t.is_archived)} 
                                                    isOverlay 
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-80 opacity-90 rotate-2 cursor-grabbing">
                                                <TaskCard task={activeDragItem.task} isOverlay />
                                            </div>
                                        )
                                    ) : null}
                                </DragOverlay>
                            </DndContext>
                        </div>
                    </main>
                )}
            </div>

            <TaskModal
                isOpen={isTaskModalOpen}
                onClose={() => setIsTaskModalOpen(false)}
                task={editingTask}
                onSubmit={editingTask ? (data) => handleUpdateTask(editingTask.id, data) : handleCreateTask}
                onDelete={handleDeleteTask}
                onArchive={handleArchiveTask}
                columns={modalColumns.length > 0 ? modalColumns : boardData.columns}
                currentUser={currentUser}
            />

            <AddSectionModal 
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSubmit={handleAddColumn}
            />

            <ConfirmModal
                isOpen={pendingDeleteTaskId !== null}
                title="Delete Task"
                message="This task and all associated files will be permanently removed."
                confirmText="Delete Task"
                variant="danger"
                onConfirm={handleConfirmDeleteTask}
                onCancel={() => setPendingDeleteTaskId(null)}
            />

            <ConfirmModal
                isOpen={pendingDeleteColumn !== null}
                title="Delete Section"
                message={`Are you sure you want to delete this section? All tasks will be moved to '${pendingDeleteColumn?.fallbackName || 'To Do'}'.`}
                confirmText="Delete Section"
                variant="danger"
                onConfirm={confirmDeleteColumn}
                onCancel={() => setPendingDeleteColumn(null)}
            />

            <ConfirmModal
                isOpen={columnDeleteBlocked}
                title="Cannot Delete Section"
                message="At least one section must remain on the board before deletion is allowed."
                confirmText="OK"
                cancelText="Close"
                variant="default"
                onConfirm={() => setColumnDeleteBlocked(false)}
                onCancel={() => setColumnDeleteBlocked(false)}
            />
        </div>
    );
}

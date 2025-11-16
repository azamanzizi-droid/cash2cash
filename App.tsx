
import React, { useState, useEffect, useCallback, useMemo, createContext, useContext } from 'react';
import { Group, Member, Round } from './types';
import { getFinancialTip } from './services/geminiService';
import { UsersIcon, CalendarIcon, DollarSignIcon, CheckCircleIcon, XCircleIcon, ChevronRightIcon, ArrowLeftIcon, RefreshCwIcon, LightbulbIcon, SettingsIcon, WhatsAppIcon, TrashIcon, PlusIcon, PrinterIcon } from './components/icons';


// --- NOTIFICATION SYSTEM ---

type ToastType = 'success' | 'info' | 'error';

interface NotificationContextProps {
    showToast: (message: string, type?: ToastType) => void;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

interface ToastProps {
    message: string;
    type: ToastType;
    visible: boolean;
    onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, visible, onClose }) => {
    const typeStyles = {
        success: { bg: 'bg-green-500', icon: <CheckCircleIcon className="w-6 h-6 mr-3" /> },
        info: { bg: 'bg-blue-500', icon: <LightbulbIcon className="w-6 h-6 mr-3" /> },
        error: { bg: 'bg-red-500', icon: <XCircleIcon className="w-6 h-6 mr-3" /> },
    };

    useEffect(() => {
        if (visible) {
            const timer = setTimeout(() => {
                onClose();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [visible, onClose]);

    return (
        <div
            className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 transition-transform duration-300 ease-in-out ${visible ? 'translate-y-0 opacity-100' : '-translate-y-20 opacity-0'} flex items-center p-4 min-w-[300px] max-w-md text-white rounded-lg shadow-lg ${typeStyles[type].bg}`}
            role="alert"
        >
            {typeStyles[type].icon}
            <span className="text-sm font-medium">{message}</span>
            <button onClick={onClose} className="ml-auto -mx-1.5 -my-1.5 p-1.5 rounded-full inline-flex items-center justify-center h-8 w-8 text-white/70 hover:text-white hover:bg-white/20 focus:outline-none" aria-label="Close">
                <span className="sr-only">Close</span>
                <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/></svg>
            </button>
        </div>
    );
};


const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toast, setToast] = useState<{ message: string, type: ToastType, id: number } | null>(null);

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        setToast({ message, type, id: Date.now() });
    }, []);

    const handleClose = () => {
        setToast(null);
    };

    return (
        <NotificationContext.Provider value={{ showToast }}>
            {children}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    visible={!!toast}
                    onClose={handleClose}
                />
            )}
        </NotificationContext.Provider>
    );
};

// --- MODAL SYSTEM ---

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, title }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h2 id="modal-title" className="text-xl font-bold text-gray-800 dark:text-white">{title}</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        <XCircleIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
};

// --- MOCK DATA ---
const createInitialData = (): Group[] => {
    const members: Member[] = [
        { id: '1', name: 'Abu Bakar', phone: '012-3456789' },
        { id: '2', name: 'Siti Nurhaliza', phone: '019-8765432' },
        { id: '3', name: 'Ahmad Albab', phone: '011-1234567' },
        { id: '4', name: 'Zainab Kassim', phone: '013-4567890' },
        { id: '5', name: 'Muthu Samy', phone: '016-7890123' },
    ];

    const initialRounds: Round[] = [{
        roundNumber: 1,
        payoutMemberId: null,
        payments: members.map(m => ({ memberId: m.id, status: 'Unpaid' })),
        payoutCompleted: false,
    }];

    return [
        {
            id: 'grp1',
            name: 'Kutu Keluarga Bahagia',
            contributionAmount: 200,
            members,
            payoutOrder: ['2', '5', '1', '4', '3'],
            currentRound: 1,
            status: 'Pending',
            rounds: initialRounds,
        }
    ];
};

// --- MAIN APP COMPONENT ---

const App: React.FC = () => (
    <NotificationProvider>
        <KutuApp />
    </NotificationProvider>
);

const KutuApp: React.FC = () => {
    const [groups, setGroups] = useState<Group[]>(() => {
        try {
            const savedGroups = localStorage.getItem('kutuGroups');
            return savedGroups ? JSON.parse(savedGroups) : createInitialData();
        } catch (error) {
            console.error("Failed to parse groups from localStorage", error);
            return createInitialData();
        }
    });
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
    const [isGroupModalOpen, setGroupModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<Group | null>(null);
    const [financialTip, setFinancialTip] = useState<string>('');
    const [tipLoading, setTipLoading] = useState<boolean>(true);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [groupToDelete, setGroupToDelete] = useState<string | null>(null);
    const { showToast } = useNotification();

    useEffect(() => {
        try {
            localStorage.setItem('kutuGroups', JSON.stringify(groups));
        } catch (error) {
            console.error("Failed to save groups to localStorage", error);
        }
    }, [groups]);

    const fetchTip = useCallback(async () => {
        setTipLoading(true);
        try {
            const tip = await getFinancialTip();
            setFinancialTip(tip);
        } catch (error) {
            setFinancialTip("Gunakan wang kutu anda dengan bijak untuk masa depan yang lebih cerah.");
        } finally {
            setTipLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTip();
    }, [fetchTip]);

    const handleSelectGroup = (group: Group) => {
        setSelectedGroup(group);
    };
    
    const handleAddGroup = (group: Omit<Group, 'id' | 'rounds' | 'currentRound' | 'status'>) => {
        const newGroup: Group = {
            ...group,
            id: `grp${Date.now()}`,
            currentRound: 1,
            status: 'Pending',
            rounds: [{
                roundNumber: 1,
                payoutMemberId: null,
                payments: group.members.map(m => ({ memberId: m.id, status: 'Unpaid' })),
                payoutCompleted: false,
            }],
        };
        setGroups([...groups, newGroup]);
        showToast('Group added successfully!', 'success');
    };

    const handleUpdateGroup = (updatedGroup: Group) => {
        setGroups(groups.map(g => g.id === updatedGroup.id ? updatedGroup : g));
        if (selectedGroup?.id === updatedGroup.id) {
            setSelectedGroup(updatedGroup);
        }
        showToast('Group updated successfully!', 'success');
    };

    const requestDeleteGroup = (groupId: string) => {
        setGroupToDelete(groupId);
        setDeleteModalOpen(true);
    };

    const handleConfirmDelete = () => {
        if (groupToDelete) {
            setGroups(groups.filter(g => g.id !== groupToDelete));
            if (selectedGroup?.id === groupToDelete) {
                setSelectedGroup(null);
            }
            showToast('Group deleted successfully.', 'info');
            setDeleteModalOpen(false);
            setGroupToDelete(null);
        }
    };

    const handleStartNextRound = (groupId: string) => {
        setGroups(prevGroups => prevGroups.map(group => {
            if (group.id === groupId) {
                const currentRound = group.rounds.find(r => r.roundNumber === group.currentRound);
                if (!currentRound) return group;

                const allPaid = currentRound.payments.every(p => p.status === 'Paid');
                if (!allPaid) {
                    showToast('All members must pay before starting the next round.', 'error');
                    return group;
                }

                if (!currentRound.payoutCompleted) {
                    showToast('Current round payout must be completed first.', 'error');
                    return group;
                }
                
                if (group.currentRound >= group.members.length) {
                    return {...group, status: 'Completed'};
                }

                const nextRoundNumber = group.currentRound + 1;
                const newRound: Round = {
                    roundNumber: nextRoundNumber,
                    payoutMemberId: null,
                    payments: group.members.map(m => ({ memberId: m.id, status: 'Unpaid' })),
                    payoutCompleted: false,
                };

                const updatedGroup = {
                    ...group,
                    status: 'Active' as 'Active',
                    currentRound: nextRoundNumber,
                    rounds: [...group.rounds, newRound]
                };
                
                // Also update selectedGroup if it's the one being modified
                if (selectedGroup?.id === groupId) {
                    setSelectedGroup(updatedGroup);
                }
                showToast(`Round ${nextRoundNumber} started!`, 'success');
                return updatedGroup;
            }
            return group;
        }));
    };
    
    const handleMarkPayoutComplete = (groupId: string, roundNumber: number) => {
        setGroups(prevGroups => {
            const newGroups = prevGroups.map(group => {
                if (group.id === groupId) {
                    const payoutMemberId = group.payoutOrder[roundNumber - 1];
                    const updatedRounds = group.rounds.map(round =>
                        round.roundNumber === roundNumber ? { ...round, payoutCompleted: true, payoutMemberId } : round
                    );
                    const updatedGroup = { ...group, rounds: updatedRounds, status: 'Active' as 'Active' };

                    if (selectedGroup?.id === groupId) {
                        setSelectedGroup(updatedGroup);
                    }
                    return updatedGroup;
                }
                return group;
            });
            return newGroups;
        });
        showToast('Payout marked as complete!', 'success');
    };

    const handleMarkAsPaid = useCallback((groupId: string, roundNumber: number, memberId: string) => {
        setGroups(prevGroups => {
            const newGroups = prevGroups.map(group => {
                if (group.id === groupId) {
                    const updatedRounds = group.rounds.map(round => {
                        if (round.roundNumber === roundNumber) {
                            const updatedPayments = round.payments.map(payment =>
                                payment.memberId === memberId ? { ...payment, status: 'Paid' as 'Paid' } : payment
                            );
                            return { ...round, payments: updatedPayments };
                        }
                        return round;
                    });
                    const updatedGroup = { ...group, rounds: updatedRounds };
    
                    // Update selectedGroup if it's the one being modified
                    setSelectedGroup(currentSelectedGroup => 
                        currentSelectedGroup?.id === groupId ? updatedGroup : currentSelectedGroup
                    );
                    return updatedGroup;
                }
                return group;
            });
            return newGroups;
        });
        showToast('Payment updated to Paid', 'success');
    }, [showToast]);


    const openEditModal = (group: Group) => {
        setEditingGroup(group);
        setGroupModalOpen(true);
    };

    const openAddModal = () => {
        setEditingGroup(null);
        setGroupModalOpen(true);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <header className="bg-white dark:bg-gray-800 shadow-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">KutuPro Loan Manager</h1>
                    <button 
                        onClick={openAddModal}
                        className="flex items-center justify-center bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800"
                    >
                        <PlusIcon className="w-5 h-5 mr-2"/>
                        New Group
                    </button>
                </div>
            </header>
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {selectedGroup ? (
                    <GroupDetail
                        group={selectedGroup}
                        onBack={() => setSelectedGroup(null)}
                        onUpdateGroup={handleUpdateGroup}
                        onDeleteGroup={requestDeleteGroup}
                        onStartNextRound={handleStartNextRound}
                        onMarkPayoutComplete={handleMarkPayoutComplete}
                        onMarkAsPaid={handleMarkAsPaid}
                    />
                ) : (
                    <>
                        <FinancialTipCard tip={financialTip} loading={tipLoading} onRefresh={fetchTip} />
                        <GroupList groups={groups} onSelectGroup={handleSelectGroup} onEditGroup={openEditModal} onDeleteGroup={requestDeleteGroup}/>
                    </>
                )}
            </main>
             <GroupForm
                isOpen={isGroupModalOpen}
                onClose={() => setGroupModalOpen(false)}
                onAddGroup={handleAddGroup}
                onUpdateGroup={handleUpdateGroup}
                existingGroup={editingGroup}
            />
            <Modal isOpen={isDeleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Confirm Deletion">
                <div className="text-center">
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                        Are you sure you want to delete this group? This action cannot be undone.
                    </p>
                    <div className="flex justify-center gap-4">
                        <button
                            onClick={() => setDeleteModalOpen(false)}
                            className="px-6 py-2 bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirmDelete}
                            className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

// --- FINANCIAL TIP CARD ---

interface FinancialTipCardProps {
    tip: string;
    loading: boolean;
    onRefresh: () => void;
}

const FinancialTipCard: React.FC<FinancialTipCardProps> = ({ tip, loading, onRefresh }) => (
    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-lg p-6 mb-8 text-white">
        <div className="flex items-start">
            <LightbulbIcon className="w-8 h-8 mr-4 flex-shrink-0 text-yellow-300"/>
            <div>
                <h3 className="font-bold text-lg mb-2">Tip Kewangan Harian</h3>
                {loading ? (
                    <div className="h-5 bg-white/30 rounded w-3/4 animate-pulse"></div>
                ) : (
                    <p className="text-indigo-100">"{tip}"</p>
                )}
            </div>
            <button onClick={onRefresh} className="ml-auto p-2 rounded-full hover:bg-white/20 transition-colors" aria-label="Refresh tip">
                <RefreshCwIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
        </div>
    </div>
);


// --- GROUP LIST ---

interface GroupListProps {
    groups: Group[];
    onSelectGroup: (group: Group) => void;
    onEditGroup: (group: Group) => void;
    onDeleteGroup: (groupId: string) => void;
}

const GroupList: React.FC<GroupListProps> = ({ groups, onSelectGroup, onEditGroup, onDeleteGroup }) => {
     if (groups.length === 0) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No Groups Yet</h2>
                <p className="text-gray-500 dark:text-gray-400">Click "New Group" to get started.</p>
            </div>
        )
    }
    
    return (
        <div>
            <h2 className="text-3xl font-extrabold text-gray-800 dark:text-gray-200 mb-6">My Groups</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groups.map(group => (
                    <div key={group.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col">
                        <div className="p-6 flex-grow" onClick={() => onSelectGroup(group)} role="button" tabIndex={0} onKeyPress={(e) => e.key === 'Enter' && onSelectGroup(group)}>
                            <div className="flex justify-between items-start">
                                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{group.name}</h3>
                                <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                                    group.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                    group.status === 'Completed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                }`}>{group.status}</span>
                            </div>
                            <div className="space-y-3 mt-4 text-gray-600 dark:text-gray-300">
                                <p className="flex items-center"><DollarSignIcon className="w-5 h-5 mr-3 text-indigo-500"/>Contribution: <span className="font-semibold ml-1">RM{group.contributionAmount}</span></p>
                                <p className="flex items-center"><UsersIcon className="w-5 h-5 mr-3 text-indigo-500"/>Members: <span className="font-semibold ml-1">{group.members.length}</span></p>
                                <p className="flex items-center"><CalendarIcon className="w-5 h-5 mr-3 text-indigo-500"/>Round: <span className="font-semibold ml-1">{group.currentRound} / {group.members.length}</span></p>
                            </div>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-3 flex justify-between items-center rounded-b-lg">
                           <button onClick={() => onSelectGroup(group)} className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center">
                               View Details <ChevronRightIcon className="w-4 h-4 ml-1"/>
                            </button>
                             <div className="flex items-center space-x-2">
                                <button onClick={(e) => {e.stopPropagation(); onEditGroup(group)}} className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white rounded-full hover:bg-gray-200 dark:hover:bg-gray-600" aria-label="Edit group">
                                    <SettingsIcon className="w-5 h-5" />
                                </button>
                                <button onClick={(e) => {e.stopPropagation(); onDeleteGroup(group.id)}} className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-500 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600" aria-label="Delete group">
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};


// --- GROUP DETAIL COMPONENT ---

interface GroupDetailProps {
    group: Group;
    onBack: () => void;
    onUpdateGroup: (group: Group) => void;
    onDeleteGroup: (groupId: string) => void;
    onStartNextRound: (groupId: string) => void;
    onMarkPayoutComplete: (groupId: string, roundNumber: number) => void;
    onMarkAsPaid: (groupId: string, roundNumber: number, memberId: string) => void;
}

const GroupDetail: React.FC<GroupDetailProps> = ({ group, onBack, onDeleteGroup, onStartNextRound, onMarkPayoutComplete, onMarkAsPaid }) => {
    const currentRound = group.rounds.find(r => r.roundNumber === group.currentRound);
    
    if (!currentRound) {
        return <div className="text-center p-8">Error: Current round data not found.</div>;
    }

    const payoutMemberForCurrentRound = group.members.find(m => m.id === group.payoutOrder[group.currentRound - 1]);
    const totalCollected = currentRound.payments.filter(p => p.status === 'Paid').length * group.contributionAmount;
    const allPaidForCurrentRound = currentRound.payments.every(p => p.status === 'Paid');

    const generateWhatsAppMessage = () => {
        let message = `*Reminder for Kutu Group: ${group.name} - Round ${currentRound.roundNumber}*\n\n`;
        message += `Hi everyone,\nJust a friendly reminder that the contribution of *RM${group.contributionAmount}* is due.\n\n`;
        message += `*Payment Status:*\n`;
        currentRound.payments.forEach(p => {
            const member = group.members.find(m => m.id === p.memberId);
            if(member) {
                message += `- ${member.name}: ${p.status}\n`;
            }
        });
        message += `\nThis round's payout recipient is *${payoutMemberForCurrentRound?.name}*.`;
        message += `\nPlease make your payment as soon as possible. Thank you!`;
        return encodeURIComponent(message);
    };
    
    const printReport = () => {
        const printWindow = window.open('', '', 'height=600,width=800');
        if (printWindow) {
            printWindow.document.write('<html><head><title>Kutu Report</title>');
            printWindow.document.write('<style>body { font-family: Arial, sans-serif; } table { width: 100%; border-collapse: collapse; } th, td { border: 1px solid #ddd; padding: 8px; text-align: left; } th { background-color: #f2f2f2; }</style>');
            printWindow.document.write('</head><body>');
            printWindow.document.write(`<h1>Report for ${group.name}</h1>`);
            group.rounds.forEach(round => {
                printWindow.document.write(`<h2>Round ${round.roundNumber}</h2>`);
                 const payoutMember = group.members.find(m => m.id === group.payoutOrder[round.roundNumber - 1]);
                printWindow.document.write(`<p><strong>Payout To:</strong> ${payoutMember?.name || 'N/A'}</p>`);
                printWindow.document.write(`<p><strong>Payout Status:</strong> ${round.payoutCompleted ? 'Completed' : 'Pending'}</p>`);
                printWindow.document.write('<table><tr><th>Member</th><th>Status</th></tr>');
                round.payments.forEach(p => {
                     const member = group.members.find(m => m.id === p.memberId);
                     printWindow.document.write(`<tr><td>${member?.name || 'Unknown'}</td><td>${p.status}</td></tr>`);
                });
                printWindow.document.write('</table>');
            });
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
        }
    };


    return (
        <div>
            <button onClick={onBack} className="flex items-center text-indigo-600 dark:text-indigo-400 font-semibold mb-6 hover:underline">
                <ArrowLeftIcon className="w-5 h-5 mr-2" />
                Back to All Groups
            </button>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
                <div className="flex flex-col md:flex-row justify-between md:items-start mb-6 border-b pb-6 dark:border-gray-700">
                    <div>
                        <h2 className="text-3xl font-extrabold text-gray-800 dark:text-white">{group.name}</h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Managing Round {group.currentRound} of {group.members.length}</p>
                    </div>
                     <div className="flex items-center space-x-2 mt-4 md:mt-0">
                        <a href={`https://wa.me/?text=${generateWhatsAppMessage()}`} target="_blank" rel="noopener noreferrer" className="flex items-center bg-green-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-600 transition-colors">
                            <WhatsAppIcon className="w-5 h-5 mr-2"/>
                            Remind
                        </a>
                        <button onClick={printReport} className="flex items-center bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">
                            <PrinterIcon className="w-5 h-5 mr-2"/>
                            Print
                        </button>
                        <button 
                            onClick={() => onDeleteGroup(group.id)} 
                            className="flex items-center bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 px-4 py-2 rounded-lg font-semibold hover:bg-red-200 dark:hover:bg-red-900/80 transition-colors"
                            aria-label="Delete group"
                        >
                            <TrashIcon className="w-5 h-5 mr-2"/>
                            Delete
                        </button>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-indigo-50 dark:bg-indigo-900/50 p-4 rounded-lg text-center">
                        <h4 className="text-sm font-semibold text-indigo-800 dark:text-indigo-200 uppercase tracking-wider">Total Pool</h4>
                        <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-300 mt-1">RM{group.contributionAmount * group.members.length}</p>
                    </div>
                     <div className="bg-green-50 dark:bg-green-900/50 p-4 rounded-lg text-center">
                        <h4 className="text-sm font-semibold text-green-800 dark:text-green-200 uppercase tracking-wider">Collected This Round</h4>
                        <p className="text-3xl font-bold text-green-600 dark:text-green-300 mt-1">RM{totalCollected}</p>
                    </div>
                    <div className="bg-yellow-50 dark:bg-yellow-900/50 p-4 rounded-lg text-center">
                        <h4 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 uppercase tracking-wider">Payout Recipient</h4>
                        <p className="text-xl font-bold text-yellow-700 dark:text-yellow-300 mt-2">{payoutMemberForCurrentRound?.name || 'N/A'}</p>
                    </div>
                </div>

                <div>
                    <h3 className="text-2xl font-bold text-gray-700 dark:text-gray-200 mb-4">Round {currentRound.roundNumber} Payments</h3>
                    
                    <ul className="space-y-3">
                        {currentRound.payments.map(payment => {
                            const member = group.members.find(m => m.id === payment.memberId);
                            if (!member) return null;

                            return (
                                <li key={payment.memberId} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <div className="flex flex-col">
                                        <span className="font-medium text-gray-800 dark:text-gray-200">{member.name}</span>
                                        {member.phone && <span className="text-xs text-gray-500 dark:text-gray-400">{member.phone}</span>}
                                    </div>
                                    {payment.status === 'Paid' ? (
                                        <span className="flex items-center text-sm font-semibold text-green-600 dark:text-green-400">
                                            <CheckCircleIcon className="w-5 h-5 mr-1.5" />
                                            Paid
                                        </span>
                                    ) : (
                                        <div className="flex items-center gap-4">
                                            <span className="flex items-center text-sm font-semibold text-red-600 dark:text-red-400">
                                                <XCircleIcon className="w-5 h-5 mr-1.5" />
                                                Unpaid
                                            </span>
                                            <button
                                                onClick={() => onMarkAsPaid(group.id, currentRound.roundNumber, payment.memberId)}
                                                className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-800 disabled:bg-gray-400"
                                                aria-label={`Mark payment for ${member.name} as paid`}
                                                disabled={group.status === 'Completed' || currentRound.payoutCompleted}
                                            >
                                                Mark Paid
                                            </button>
                                        </div>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                    
                    <div className="mt-8 pt-6 border-t dark:border-gray-700 flex flex-col sm:flex-row items-center justify-end gap-4">
                        {!currentRound.payoutCompleted ? (
                            <button
                                onClick={() => onMarkPayoutComplete(group.id, currentRound.roundNumber)}
                                disabled={!allPaidForCurrentRound}
                                className="w-full sm:w-auto flex-shrink-0 px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
                            >
                                Mark Payout as Complete
                            </button>
                        ) : (
                            group.status !== 'Completed' && (
                                <button
                                     onClick={() => onStartNextRound(group.id)}
                                    className="w-full sm:w-auto flex-shrink-0 px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800"
                                >
                                    Start Next Round
                                </button>
                            )
                        )}
                         {group.status === 'Completed' && (
                            <p className="text-lg font-semibold text-green-600 dark:text-green-400">This group cycle is complete!</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- GROUP FORM ---

interface GroupFormProps {
    isOpen: boolean;
    onClose: () => void;
    onAddGroup: (group: Omit<Group, 'id' | 'rounds' | 'currentRound' | 'status'>) => void;
    onUpdateGroup: (group: Group) => void;
    existingGroup: Group | null;
}

const GroupForm: React.FC<GroupFormProps> = ({ isOpen, onClose, onAddGroup, onUpdateGroup, existingGroup }) => {
    const [name, setName] = useState('');
    const [contributionAmount, setContributionAmount] = useState(100);
    const [members, setMembers] = useState<Member[]>([{ id: `mem${Date.now()}`, name: '', phone: '' }]);
    const [payoutOrder, setPayoutOrder] = useState<string[]>([]);
    
    useEffect(() => {
        if (existingGroup) {
            setName(existingGroup.name);
            setContributionAmount(existingGroup.contributionAmount);
            setMembers(existingGroup.members);
            setPayoutOrder(existingGroup.payoutOrder);
        } else {
            setName('');
            setContributionAmount(100);
            setMembers([{ id: `mem${Date.now()}`, name: '', phone: '' }]);
            setPayoutOrder([]);
        }
    }, [existingGroup, isOpen]);
    
    useEffect(() => {
        // Auto-generate payout order when members change
        const memberIds = members.map(m => m.id);
        const shuffledOrder = [...memberIds].sort(() => Math.random() - 0.5);
        setPayoutOrder(shuffledOrder);
    }, [members.length]);

    const handleMemberChange = (index: number, field: keyof Member, value: string) => {
        const newMembers = [...members];
        newMembers[index] = { ...newMembers[index], [field]: value };
        setMembers(newMembers);
    };

    const addMember = () => {
        setMembers([...members, { id: `mem${Date.now()}`, name: '', phone: '' }]);
    };

    const removeMember = (index: number) => {
        const memberIdToRemove = members[index].id;
        setMembers(members.filter((_, i) => i !== index));
        setPayoutOrder(payoutOrder.filter(id => id !== memberIdToRemove));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalMembers = members.filter(m => m.name.trim() !== '');
        if (finalMembers.length < 2) {
            alert("A group must have at least 2 members.");
            return;
        }

        const groupData = {
            name,
            contributionAmount,
            members: finalMembers,
            payoutOrder,
        };

        if (existingGroup) {
            onUpdateGroup({ ...existingGroup, ...groupData });
        } else {
            onAddGroup(groupData);
        }
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={existingGroup ? 'Edit Group' : 'Create New Group'}>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="groupName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Group Name</label>
                    <input type="text" id="groupName" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
                <div>
                    <label htmlFor="contributionAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Contribution Amount (RM)</label>
                    <input type="number" id="contributionAmount" value={contributionAmount} onChange={e => setContributionAmount(Number(e.target.value))} required min="1" className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
                <div>
                    <h3 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-2">Members</h3>
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                        {members.map((member, index) => (
                            <div key={member.id} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                                <span className="text-gray-500 dark:text-gray-400 font-semibold">{index + 1}.</span>
                                <input type="text" placeholder="Name" value={member.name} onChange={e => handleMemberChange(index, 'name', e.target.value)} className="flex-grow block w-full px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500" />
                                <input type="tel" placeholder="Phone (Optional)" value={member.phone} onChange={e => handleMemberChange(index, 'phone', e.target.value)} className="flex-grow block w-full px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500" />
                                <button type="button" onClick={() => removeMember(index)} className="p-1 text-red-500 hover:text-red-700 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50" aria-label="Remove member">
                                    <TrashIcon className="w-5 h-5"/>
                                </button>
                            </div>
                        ))}
                    </div>
                    <button type="button" onClick={addMember} className="mt-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center">
                        <PlusIcon className="w-4 h-4 mr-1"/> Add Member
                    </button>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">{existingGroup ? 'Save Changes' : 'Create Group'}</button>
                </div>
            </form>
        </Modal>
    );
};

export default App;

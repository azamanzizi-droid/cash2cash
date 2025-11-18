

import React, { useState, useEffect, useCallback, useMemo, createContext, useContext } from 'react';
import { Group, Member, Round } from './types';
import { getFinancialTip } from './services/geminiService';
import { translations, Language } from './translations';
import { UsersIcon, CalendarIcon, DollarSignIcon, CheckCircleIcon, XCircleIcon, ChevronRightIcon, ArrowLeftIcon, RefreshCwIcon, LightbulbIcon, SettingsIcon, WhatsAppIcon, TrashIcon, PlusIcon, PrinterIcon, GripVerticalIcon, SearchIcon, BookOpenIcon, DownloadIcon, LayoutGridIcon, GlobeIcon } from './components/icons';


// --- i18n & TRANSLATION SYSTEM ---
interface LanguageContextProps {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string, replacements?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

const useTranslation = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useTranslation must be used within a LanguageProvider');
    }
    return context;
};

const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('kutu_language') as Language) || 'en');

    useEffect(() => {
        localStorage.setItem('kutu_language', language);
    }, [language]);

    const t = useCallback((key: string, replacements: Record<string, string | number> = {}) => {
        let translation = translations[language][key] || translations['en'][key] || key;
        Object.keys(replacements).forEach(placeholder => {
            const regex = new RegExp(`{${placeholder}}`, 'g');
            translation = translation.replace(regex, String(replacements[placeholder]));
        });
        return translation;
    }, [language]);
    
    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};


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
        <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4" aria-labelledby="modal-title" role="dialog" aria-modal="true" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
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
    <LanguageProvider>
        <NotificationProvider>
            <KutuApp />
        </NotificationProvider>
    </LanguageProvider>
);

const DELETE_PASSWORD = 'kutuprodelete';

type View = 'dashboard' | 'groupList' | 'groupDetail' | 'settings' | 'userManual';

const KutuApp: React.FC = () => {
    const { language, setLanguage, t } = useTranslation();
    const { showToast } = useNotification();
    const [groups, setGroups] = useState<Group[]>(() => {
        try {
            const savedGroups = localStorage.getItem('kutuGroups');
            return savedGroups ? JSON.parse(savedGroups) : createInitialData();
        } catch (error) {
            console.error("Failed to parse groups from localStorage", error);
            return createInitialData();
        }
    });

    const [currentView, setCurrentView] = useState<View>('dashboard');
    const [previousView, setPreviousView] = useState<View>('dashboard');
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

    // Modals state
    const [isGroupFormOpen, setIsGroupFormOpen] = useState(false);
    const [groupToEdit, setGroupToEdit] = useState<Group | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);
    const [deletePasswordInput, setDeletePasswordInput] = useState('');
    const [isClearDataModalOpen, setIsClearDataModalOpen] = useState(false);

    // Financial Tip State
    const [financialTip, setFinancialTip] = useState('');
    const [isTipLoading, setIsTipLoading] = useState(false);

    useEffect(() => {
        localStorage.setItem('kutuGroups', JSON.stringify(groups));
    }, [groups]);

    const fetchNewTip = useCallback(async () => {
        setIsTipLoading(true);
        try {
            const tip = await getFinancialTip(language);
            setFinancialTip(tip);
        } catch (error) {
            console.error("Failed to fetch tip:", error);
            setFinancialTip(t('dailyFinancialTip'));
        } finally {
            setIsTipLoading(false);
        }
    }, [language, t]);

    useEffect(() => {
        fetchNewTip();
    }, [fetchNewTip]);
    
    const navigateTo = (view: View) => {
        setPreviousView(currentView);
        setCurrentView(view);
    };

    const handleBack = () => {
        setSelectedGroup(null);
        setCurrentView(previousView);
    };

    const handleSelectGroup = (group: Group) => {
        setSelectedGroup(group);
        navigateTo('groupDetail');
    };

    const handleOpenGroupForm = (group: Group | null) => {
        setGroupToEdit(group);
        setIsGroupFormOpen(true);
    };

    const handleSaveGroup = (groupData: Omit<Group, 'id' | 'currentRound' | 'status' | 'rounds'>) => {
        if (groupToEdit) { // Editing existing group
            setGroups(prev => prev.map(g => g.id === groupToEdit.id ? { ...groupToEdit, ...groupData } : g));
            showToast(t('toastGroupUpdated'), 'success');
        } else { // Creating new group
            const newGroup: Group = {
                id: `grp_${Date.now()}`,
                ...groupData,
                currentRound: 1,
                status: 'Pending',
                rounds: [{
                    roundNumber: 1,
                    payoutMemberId: null,
                    payments: groupData.members.map(m => ({ memberId: m.id, status: 'Unpaid' })),
                    payoutCompleted: false,
                }],
            };
            setGroups(prev => [...prev, newGroup]);
            showToast(t('toastGroupAdded'), 'success');
        }
        setIsGroupFormOpen(false);
        setGroupToEdit(null);
    };

    const handleOpenDeleteModal = (group: Group) => {
        setGroupToDelete(group);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = () => {
        if (deletePasswordInput === DELETE_PASSWORD) {
            setGroups(prev => prev.filter(g => g.id !== groupToDelete?.id));
            setIsDeleteModalOpen(false);
            setGroupToDelete(null);
            setDeletePasswordInput('');
            showToast(t('toastGroupDeleted'), 'success');
            if(selectedGroup?.id === groupToDelete?.id) {
                handleBack();
            }
        } else {
            showToast(t('toastIncorrectPassword'), 'error');
        }
    };
    
    const handleClearAllData = () => {
        if (deletePasswordInput === DELETE_PASSWORD) {
            setGroups([]);
            setIsClearDataModalOpen(false);
            setDeletePasswordInput('');
            showToast(t('toastDataCleared'), 'success');
        } else {
            showToast(t('toastIncorrectPassword'), 'error');
        }
    };

    const handleMarkAsPaid = (groupId: string, memberId: string) => {
        setGroups(prevGroups => {
            const newGroups = [...prevGroups];
            const groupIndex = newGroups.findIndex(g => g.id === groupId);
            if (groupIndex === -1) return prevGroups;

            const group = { ...newGroups[groupIndex] };
            const currentRoundIndex = group.rounds.findIndex(r => r.roundNumber === group.currentRound);
            if (currentRoundIndex === -1) return prevGroups;
            
            const round = { ...group.rounds[currentRoundIndex] };
            const paymentIndex = round.payments.findIndex(p => p.memberId === memberId);
            if (paymentIndex === -1) return prevGroups;

            round.payments = [...round.payments];
            round.payments[paymentIndex] = { ...round.payments[paymentIndex], status: 'Paid' };
            
            // Check if all are paid
            const allPaid = round.payments.every(p => p.status === 'Paid');
            if(allPaid && !round.payoutMemberId) {
                const payoutMemberId = group.payoutOrder[group.currentRound - 1];
                round.payoutMemberId = payoutMemberId;
                const payoutMember = group.members.find(m => m.id === payoutMemberId);
                showToast(t('toastAllPaidPayoutReady', { payoutMemberName: payoutMember?.name || '' }), 'success');
            }
            
            group.rounds = [...group.rounds];
            group.rounds[currentRoundIndex] = round;
            newGroups[groupIndex] = group;
            
            if(selectedGroup?.id === groupId) {
                setSelectedGroup(group);
            }
            showToast(t('toastPaymentUpdated'), 'success');
            return newGroups;
        });
    };
    
    const handleMarkPayoutComplete = (groupId: string) => {
         setGroups(prevGroups => {
            const newGroups = [...prevGroups];
            const groupIndex = newGroups.findIndex(g => g.id === groupId);
            if (groupIndex === -1) return prevGroups;

            const group = { ...newGroups[groupIndex] };
            const currentRoundIndex = group.rounds.findIndex(r => r.roundNumber === group.currentRound);
            if (currentRoundIndex === -1) return prevGroups;

            const round = { ...group.rounds[currentRoundIndex] };
            if (!round.payoutMemberId) {
                showToast(t('toastAllMustPay'), 'error');
                return prevGroups;
            }

            round.payoutCompleted = true;
            group.status = 'Active';

            group.rounds = [...group.rounds];
            group.rounds[currentRoundIndex] = round;
            newGroups[groupIndex] = group;
            
            if(selectedGroup?.id === groupId) {
                setSelectedGroup(group);
            }
            showToast(t('toastPayoutComplete'), 'success');
            return newGroups;
        });
    };
    
    const handleStartNextRound = (groupId: string) => {
        setGroups(prevGroups => {
            const newGroups = [...prevGroups];
            const groupIndex = newGroups.findIndex(g => g.id === groupId);
            if (groupIndex === -1) return prevGroups;
    
            const group = { ...newGroups[groupIndex] };
            const currentRound = group.rounds.find(r => r.roundNumber === group.currentRound);
    
            if (!currentRound?.payoutCompleted) {
                showToast(t('toastPayoutMustBeCompleted'), 'error');
                return prevGroups;
            }
    
            if (group.currentRound < group.members.length) {
                const nextRoundNumber = group.currentRound + 1;
                group.currentRound = nextRoundNumber;
                group.rounds.push({
                    roundNumber: nextRoundNumber,
                    payoutMemberId: null,
                    payments: group.members.map(m => ({ memberId: m.id, status: 'Unpaid' })),
                    payoutCompleted: false,
                });
                showToast(t('toastRoundStarted', { roundNumber: nextRoundNumber }), 'success');
            } else {
                group.status = 'Completed';
            }
    
            newGroups[groupIndex] = group;
            if (selectedGroup?.id === groupId) {
                setSelectedGroup(group);
            }
            return newGroups;
        });
    };

    const handleExportGroup = (group: Group) => {
        try {
            const csvRows: (string | number)[][] = [];
    
            const escapeCsvCell = (cell: any) => {
                const cellStr = String(cell ?? '');
                if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
                    return `"${cellStr.replace(/"/g, '""')}"`;
                }
                return cellStr;
            };
    
            const addRow = (row: (string | number)[]) => {
                csvRows.push(row.map(escapeCsvCell));
            };
    
            // Group Info
            addRow([t('groupName'), group.name]);
            addRow([t('contributionAmount'), `RM ${group.contributionAmount}`]);
            addRow([t('status'), group.status]);
            addRow([]); // Spacer
    
            // Members
            addRow([t('members')]);
            addRow(['ID', t('name'), t('phoneOptional')]);
            group.members.forEach(m => addRow([m.id, m.name, m.phone || '']));
            addRow([]); // Spacer
    
            // Payout Order
            addRow([t('payoutOrder')]);
            addRow(['#', t('name')]);
            group.payoutOrder.forEach((memberId, index) => {
                const member = group.members.find(m => m.id === memberId);
                addRow([index + 1, member?.name || 'Unknown']);
            });
            addRow([]); // Spacer
    
            // Rounds Breakdown
            addRow([t('roundPayments')]);
            group.rounds.forEach(round => {
                const payoutMember = group.members.find(m => m.id === round.payoutMemberId);
                addRow([]); // Spacer
                addRow([`${t('round')} ${round.roundNumber} - ${t('payoutRecipient')}: ${payoutMember?.name || '---'}`]);
                addRow([t('members'), t('status')]);
                round.payments.forEach(payment => {
                    const member = group.members.find(m => m.id === payment.memberId);
                    addRow([member?.name || 'Unknown', t(payment.status.toLowerCase() as keyof typeof translations.en)]);
                });
            });
            
            const csvContent = csvRows.map(e => e.join(",")).join("\n");
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            const safeFileName = group.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            link.setAttribute("download", `kutupro_export_${safeFileName}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
    
            showToast(t('toastExportSuccessful'), 'success');
        } catch (error) {
            console.error("Export failed:", error);
            showToast(t('toastExportFailed'), 'error');
        }
    };
    
    const Header = () => (
        <header className="bg-white dark:bg-gray-800 shadow-md p-4 flex justify-between items-center sticky top-0 z-30">
            <div className="flex items-center space-x-2">
                <span className="text-2xl text-indigo-600 dark:text-indigo-400">💵</span>
                <h1 className="text-xl sm:text-2xl font-bold font-title text-gray-800 dark:text-white tracking-wider">
                    KutuPro<span className="font-manager text-indigo-500">Manager</span>
                </h1>
            </div>
            <nav className="flex items-center space-x-1 sm:space-x-2">
                <button onClick={() => navigateTo('dashboard')} className={`flex items-center space-x-2 px-2 sm:px-3 py-2 rounded-md text-sm font-medium ${currentView === 'dashboard' ? 'bg-indigo-100 text-indigo-700 dark:bg-gray-700 dark:text-white' : 'text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}>
                    <LayoutGridIcon className="w-5 h-5" />
                    <span className="hidden md:inline">{t('dashboard')}</span>
                </button>
                <button onClick={() => navigateTo('groupList')} className={`flex items-center space-x-2 px-2 sm:px-3 py-2 rounded-md text-sm font-medium ${currentView === 'groupList' ? 'bg-indigo-100 text-indigo-700 dark:bg-gray-700 dark:text-white' : 'text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}>
                    <UsersIcon className="w-5 h-5" />
                    <span className="hidden md:inline">{t('myGroups')}</span>
                </button>
                <button onClick={() => navigateTo('userManual')} className={`flex items-center space-x-2 px-2 sm:px-3 py-2 rounded-md text-sm font-medium ${currentView === 'userManual' ? 'bg-indigo-100 text-indigo-700 dark:bg-gray-700 dark:text-white' : 'text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}>
                    <BookOpenIcon className="w-5 h-5" />
                    <span className="hidden md:inline">{t('userManual')}</span>
                </button>
                 <div className="hidden sm:flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-full p-1">
                    <GlobeIcon className="w-5 h-5 text-gray-500 dark:text-gray-400 mx-1" />
                    <button onClick={() => setLanguage('en')} className={`px-3 py-1 text-sm font-semibold rounded-full ${language === 'en' ? 'bg-white text-indigo-600 shadow' : 'text-gray-600 dark:text-gray-300'}`}>EN</button>
                    <button onClick={() => setLanguage('bm')} className={`px-3 py-1 text-sm font-semibold rounded-full ${language === 'bm' ? 'bg-white text-indigo-600 shadow' : 'text-gray-600 dark:text-gray-300'}`}>BM</button>
                </div>
                <button onClick={() => navigateTo('settings')} className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700">
                    <SettingsIcon className="w-6 h-6" />
                </button>
            </nav>
        </header>
    );
    
    const MainContent = () => {
        switch (currentView) {
            case 'dashboard':
                return <Dashboard groups={groups} onSelectGroup={handleSelectGroup} />;
            case 'groupList':
                return <GroupList groups={groups} onSelectGroup={handleSelectGroup} onOpenGroupForm={handleOpenGroupForm} onOpenDeleteModal={handleOpenDeleteModal} />;
            case 'groupDetail':
                return selectedGroup && <GroupDetail group={selectedGroup} onBack={handleBack} onMarkAsPaid={handleMarkAsPaid} onMarkPayoutComplete={handleMarkPayoutComplete} onStartNextRound={handleStartNextRound} onOpenDeleteModal={handleOpenDeleteModal} onEditGroup={handleOpenGroupForm} onExportGroup={handleExportGroup} previousView={previousView} />;
            case 'settings':
                return <Settings onBack={handleBack} onClearData={() => setIsClearDataModalOpen(true)} previousView={previousView} />;
            case 'userManual':
                return <UserManual onBack={handleBack} previousView={previousView} />;
            default:
                return <Dashboard groups={groups} onSelectGroup={handleSelectGroup} />;
        }
    };
    
    // DASHBOARD METRICS CALCULATION
    const dashboardStats = useMemo(() => {
        const activeGroups = groups.filter(g => g.status === 'Active' || g.status === 'Pending');
        const totalGroups = groups.length;
        const activeMembers = activeGroups.reduce((sum, group) => sum + group.members.length, 0);

        let collectedCurrentRounds = 0;
        let outstandingCurrentRounds = 0;

        activeGroups.forEach(group => {
            const currentRound = group.rounds.find(r => r.roundNumber === group.currentRound);
            if (currentRound) {
                const paidCount = currentRound.payments.filter(p => p.status === 'Paid').length;
                collectedCurrentRounds += paidCount * group.contributionAmount;
                outstandingCurrentRounds += (currentRound.payments.length - paidCount) * group.contributionAmount;
            }
        });

        const upcomingPayouts = activeGroups.map(group => {
            const nextPayoutIndex = group.currentRound - 1;
            if (nextPayoutIndex < group.payoutOrder.length) {
                const memberId = group.payoutOrder[nextPayoutIndex];
                const member = group.members.find(m => m.id === memberId);
                return {
                    groupId: group.id,
                    groupName: group.name,
                    memberName: member?.name || 'N/A',
                    payoutAmount: group.contributionAmount * group.members.length,
                };
            }
            return null;
        }).filter(Boolean);

        return { totalGroups, activeMembers, collectedCurrentRounds, outstandingCurrentRounds, upcomingPayouts };
    }, [groups]);


    const Dashboard: React.FC<{ groups: Group[], onSelectGroup: (group: Group) => void }> = ({ groups, onSelectGroup }) => {
        return (
            <div className="p-4 sm:p-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center text-indigo-600 dark:text-indigo-400">
                                <LightbulbIcon className="w-6 h-6 mr-2" />
                                <h3 className="text-lg font-semibold">{t('dailyFinancialTip')}</h3>
                            </div>
                            <p className="text-gray-600 dark:text-gray-300 mt-2 italic">"{isTipLoading ? '...' : financialTip}"</p>
                        </div>
                        <button onClick={fetchNewTip} disabled={isTipLoading} className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">
                            <RefreshCwIcon className={`w-5 h-5 ${isTipLoading ? 'animate-spin' : ''}`} />
                            <span className="sr-only">{t('refreshTip')}</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard title={t('totalGroups')} value={dashboardStats.totalGroups.toString()} icon={<UsersIcon className="w-8 h-8 text-blue-500"/>} />
                    <StatCard title={t('activeMembers')} value={dashboardStats.activeMembers.toString()} icon={<UsersIcon className="w-8 h-8 text-green-500"/>} />
                    <StatCard title={t('collectedCurrentRounds')} value={`RM ${dashboardStats.collectedCurrentRounds.toLocaleString()}`} icon={<CheckCircleIcon className="w-8 h-8 text-purple-500"/>} />
                    <StatCard title={t('outstandingCurrentRounds')} value={`RM ${dashboardStats.outstandingCurrentRounds.toLocaleString()}`} icon={<XCircleIcon className="w-8 h-8 text-red-500"/>} />
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                    <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">{t('upcomingPayouts')}</h3>
                    <div className="space-y-4">
                        {dashboardStats.upcomingPayouts.length > 0 ? (
                            dashboardStats.upcomingPayouts.map((payout, index) => (
                                <div key={index} onClick={() => onSelectGroup(groups.find(g => g.id === payout.groupId)!)} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer transition-colors">
                                    <div className="w-full sm:w-auto">
                                        <p className="font-bold text-gray-800 dark:text-white">{payout.memberName}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{payout.groupName} ({t('active')})</p>
                                    </div>
                                    <div className="w-full sm:w-auto text-left sm:text-right mt-2 sm:mt-0">
                                        <p className="font-bold text-green-600 dark:text-green-400 text-lg">RM {payout.payoutAmount.toLocaleString()}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{t('payoutAmount')}</p>
                                    </div>
                                    <ChevronRightIcon className="w-5 h-5 text-gray-400 absolute top-4 right-4 sm:static" />
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 dark:text-gray-400 text-center py-4">{t('noUpcomingPayouts')}</p>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const StatCard: React.FC<{ title: string, value: string, icon: React.ReactNode }> = ({ title, value, icon }) => (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 flex items-center space-x-4">
            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-full">{icon}</div>
            <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
            <Header />
            <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                <MainContent />
            </main>

            <Modal isOpen={isGroupFormOpen} onClose={() => setIsGroupFormOpen(false)} title={groupToEdit ? t('editExistingGroup') : t('createNewGroup')}>
                <GroupForm group={groupToEdit} onSave={handleSaveGroup} onCancel={() => setIsGroupFormOpen(false)} />
            </Modal>
            
            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title={t('confirmDeletion')}>
                <div className="space-y-4">
                    <p>{t('deleteGroupWarning')}</p>
                    <div className="space-y-2">
                        <label htmlFor="delete-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('enterPasswordConfirm')}</label>
                        <input
                            type="password"
                            id="delete-password"
                            value={deletePasswordInput}
                            onChange={(e) => setDeletePasswordInput(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                         <p className="text-xs text-gray-500">{t('passwordHint')} {DELETE_PASSWORD}</p>
                    </div>
                    <div className="flex justify-end space-x-2">
                        <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500">{t('cancel')}</button>
                        <button onClick={handleConfirmDelete} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">{t('delete')}</button>
                    </div>
                </div>
            </Modal>
            
            <Modal isOpen={isClearDataModalOpen} onClose={() => setIsClearDataModalOpen(false)} title={t('confirmClearAllData')}>
                <div className="space-y-4">
                    <p>{t('clearDataWarning')}</p>
                    <div className="space-y-2">
                         <label htmlFor="clear-data-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('enterPasswordConfirm')}</label>
                         <input
                            type="password"
                            id="clear-data-password"
                            value={deletePasswordInput}
                            onChange={(e) => setDeletePasswordInput(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                         <p className="text-xs text-gray-500">{t('passwordHint')} {DELETE_PASSWORD}</p>
                    </div>
                    <div className="flex justify-end space-x-2">
                        <button onClick={() => setIsClearDataModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500">{t('cancel')}</button>
                        <button onClick={handleClearAllData} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">{t('yesClearEverything')}</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};


const GroupList: React.FC<{ groups: Group[], onSelectGroup: (group: Group) => void, onOpenGroupForm: (group: Group | null) => void, onOpenDeleteModal: (group: Group) => void }> = ({ groups, onSelectGroup, onOpenGroupForm, onOpenDeleteModal }) => {
    const { t } = useTranslation();

    if (groups.length === 0) {
        return (
            <div className="text-center p-10 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300">{t('noGroupsYet')}</h2>
                <p className="mt-2 text-gray-500">{t('clickNewGroup')}</p>
                <button onClick={() => onOpenGroupForm(null)} className="mt-4 px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                    {t('newGroup')}
                </button>
            </div>
        );
    }
    
    return (
        <div>
            <div className="flex justify-end mb-4">
                <button onClick={() => onOpenGroupForm(null)} className="flex items-center px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                    <PlusIcon className="w-5 h-5 mr-2"/> {t('newGroup')}
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groups.map(group => <GroupCard key={group.id} group={group} onSelectGroup={onSelectGroup} onEdit={() => onOpenGroupForm(group)} onDelete={() => onOpenDeleteModal(group)} />)}
            </div>
        </div>
    );
};

const GroupCard: React.FC<{ group: Group, onSelectGroup: (group: Group) => void, onEdit: () => void, onDelete: () => void }> = ({ group, onSelectGroup, onEdit, onDelete }) => {
    const { t } = useTranslation();
    const statusStyles = {
        Pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        Active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        Completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
            <div className="p-5 flex-grow">
                <div className="flex justify-between items-start">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{group.name}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[group.status]}`}>{group.status}</span>
                </div>
                <div className="space-y-3 mt-4 text-sm text-gray-600 dark:text-gray-300">
                    <div className="flex items-center"><DollarSignIcon className="w-5 h-5 mr-3 text-indigo-500"/> <span>{t('contribution')}: <span className="font-semibold">RM {group.contributionAmount}</span></span></div>
                    <div className="flex items-center"><UsersIcon className="w-5 h-5 mr-3 text-indigo-500"/> <span>{t('members')}: <span className="font-semibold">{group.members.length}</span></span></div>
                    <div className="flex items-center"><CalendarIcon className="w-5 h-5 mr-3 text-indigo-500"/> <span>{t('round')}: <span className="font-semibold">{group.currentRound} / {group.members.length}</span></span></div>
                </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 p-3 flex justify-between items-center border-t dark:border-gray-700">
                 <div className="flex items-center space-x-1">
                    <button onClick={onEdit} className="p-2 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"><SettingsIcon className="w-5 h-5" /><span className="sr-only">{t('editGroup')}</span></button>
                    <button onClick={onDelete} className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-500 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"><TrashIcon className="w-5 h-5" /><span className="sr-only">{t('deleteGroup')}</span></button>
                </div>
                <button onClick={() => onSelectGroup(group)} className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                    {t('viewDetails')}
                </button>
            </div>
        </div>
    );
};

interface GroupDetailProps {
    group: Group;
    onBack: () => void;
    onMarkAsPaid: (groupId: string, memberId: string) => void;
    onMarkPayoutComplete: (groupId: string) => void;
    onStartNextRound: (groupId: string) => void;
    onOpenDeleteModal: (group: Group) => void;
    onEditGroup: (group: Group) => void;
    onExportGroup: (group: Group) => void;
    previousView: View;
}

const GroupDetail: React.FC<GroupDetailProps> = ({ group, onBack, onMarkAsPaid, onMarkPayoutComplete, onStartNextRound, onOpenDeleteModal, onEditGroup, onExportGroup, previousView }) => {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');
    const currentRound = group.rounds.find(r => r.roundNumber === group.currentRound);
    if (!currentRound) return <div>Round not found.</div>;

    const collectedAmount = currentRound.payments.filter(p => p.status === 'Paid').length * group.contributionAmount;
    const totalPool = group.members.length * group.contributionAmount;
    const payoutRecipient = group.members.find(m => m.id === currentRound.payoutMemberId);
    
    const filteredMembers = group.members.filter(member => member.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const allPaid = currentRound.payments.every(p => p.status === 'Paid');
    const isCompleted = group.status === 'Completed';

    const handleSendWhatsAppReminder = () => {
        const unpaidMembers = currentRound.payments
            .filter(p => p.status === 'Unpaid')
            .map(p => group.members.find(m => m.id === p.memberId)?.name)
            .filter(Boolean);
        
        const message = `Hi everyone, friendly reminder for our Kutu '${group.name}'. Contribution of RM${group.contributionAmount} is due. Unpaid: ${unpaidMembers.join(', ')}. Thank you!`;
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    const handlePrint = () => { window.print(); };

    const actionButtonClasses = "px-3 py-2 text-sm text-white font-semibold rounded-md flex items-center justify-center shadow-sm transition-colors duration-150";
    
    const getBackText = () => {
        switch(previousView) {
            case 'groupList':
                return t('backToAllGroups');
            case 'dashboard':
            default:
                return t('backToDashboard');
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-6">
                <div>
                    <button onClick={onBack} className="flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white mb-2">
                        <ArrowLeftIcon className="w-4 h-4 mr-2" /> {getBackText()}
                    </button>
                    <h2 className="text-2xl sm:text-3xl font-bold">{group.name}</h2>
                    <p className="text-gray-500 dark:text-gray-400">{t('managingRound')} {group.currentRound} {t('of')} {group.members.length}</p>
                </div>
                <div className="flex items-center space-x-2 mt-4 sm:mt-0 flex-wrap gap-2">
                    <button onClick={handleSendWhatsAppReminder} className={`${actionButtonClasses} bg-green-500 hover:bg-green-600`}>
                        <WhatsAppIcon className="w-5 h-5" /><span className="hidden sm:inline ml-2">{t('remind')}</span>
                    </button>
                    <button onClick={handlePrint} className={`${actionButtonClasses} bg-blue-500 hover:bg-blue-600`}>
                        <PrinterIcon className="w-5 h-5" /><span className="hidden sm:inline ml-2">{t('print')}</span>
                    </button>
                    <button onClick={() => onExportGroup(group)} className={`${actionButtonClasses} bg-purple-500 hover:bg-purple-600`}>
                        <DownloadIcon className="w-5 h-5" /><span className="hidden sm:inline ml-2">{t('export')}</span>
                    </button>
                    <button onClick={() => onEditGroup(group)} className={`${actionButtonClasses} bg-gray-500 hover:bg-gray-600`}>
                        <SettingsIcon className="w-5 h-5" /><span className="hidden sm:inline ml-2">{t('editGroup')}</span>
                    </button>
                    <button onClick={() => onOpenDeleteModal(group)} className={`${actionButtonClasses} bg-red-500 hover:bg-red-600`}>
                        <TrashIcon className="w-5 h-5" /><span className="hidden sm:inline ml-2">{t('delete')}</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-center">
                <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('totalPool')}</p>
                    <p className="text-xl sm:text-2xl font-bold">RM {totalPool.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-green-100 dark:bg-green-900/50 rounded-lg">
                    <p className="text-sm text-green-700 dark:text-green-300">{t('collectedThisRound')}</p>
                    <p className="text-xl sm:text-2xl font-bold text-green-800 dark:text-green-200">RM {collectedAmount.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
                    <p className="text-sm text-indigo-700 dark:text-indigo-300">{t('payoutRecipient')}</p>
                    <p className="text-xl sm:text-2xl font-bold text-indigo-800 dark:text-indigo-200 truncate">{payoutRecipient?.name || '---'}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h3 className="text-xl font-bold mb-4">{t('roundPayments')}</h3>
                    <div className="relative mb-4">
                        <SearchIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="text" placeholder={t('searchMemberPlaceholder')} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                        {filteredMembers.length > 0 ? filteredMembers.map(member => {
                            const payment = currentRound.payments.find(p => p.memberId === member.id);
                            return <PaymentRow key={member.id} member={member} payment={payment} onMarkAsPaid={() => onMarkAsPaid(group.id, member.id)} isCompleted={isCompleted} />;
                        }) : <p className="text-center text-gray-500 py-4">{t('noMembersFound')}</p>}
                    </div>
                </div>

                <div>
                    <h3 className="text-xl font-bold mb-4">{t('payoutOrder')}</h3>
                    <PayoutOrderList group={group} currentRound={currentRound} />
                    
                    {!isCompleted && (
                        <div className="mt-6">
                            {!currentRound.payoutCompleted ? (
                                <button onClick={() => onMarkPayoutComplete(group.id)} disabled={!allPaid} className="w-full px-4 py-3 bg-indigo-600 text-white font-bold rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed">
                                    {t('markPayoutComplete')}
                                </button>
                            ) : (
                                <button onClick={() => onStartNextRound(group.id)} className="w-full px-4 py-3 bg-green-600 text-white font-bold rounded-lg shadow-md hover:bg-green-700">
                                    {t('startNextRound')}
                                </button>
                            )}
                        </div>
                    )}
                    {isCompleted && (
                         <div className="mt-6 text-center p-4 bg-green-100 dark:bg-green-900/50 rounded-lg">
                            <p className="font-bold text-green-800 dark:text-green-200">{t('groupCycleComplete')}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const PaymentRow: React.FC<{ member: Member, payment?: { status: 'Paid' | 'Unpaid' }, onMarkAsPaid: () => void, isCompleted: boolean }> = ({ member, payment, onMarkAsPaid, isCompleted }) => {
    const { t } = useTranslation();
    const isPaid = payment?.status === 'Paid';
    return (
        <div className={`flex items-center justify-between p-3 rounded-lg ${isPaid ? 'bg-green-50 dark:bg-green-900/30' : 'bg-gray-50 dark:bg-gray-700/50'}`}>
            <div>
                <p className="font-semibold">{member.name}</p>
                <p className="text-xs text-gray-500">{member.phone}</p>
            </div>
            {isPaid ? (
                <div className="flex items-center text-green-600 dark:text-green-400">
                    <CheckCircleIcon className="w-5 h-5 mr-2" />
                    <span className="font-semibold text-sm">{t('paid')}</span>
                </div>
            ) : (
                <button onClick={onMarkAsPaid} disabled={isCompleted} className="px-3 py-1 bg-blue-500 text-white text-sm font-semibold rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed">
                    {t('markPaid')}
                </button>
            )}
        </div>
    );
};

const PayoutOrderList: React.FC<{ group: Group, currentRound: Round }> = ({ group, currentRound }) => {
    const { t } = useTranslation();
    return (
         <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
            {group.payoutOrder.map((memberId, index) => {
                const member = group.members.find(m => m.id === memberId);
                const roundNumber = index + 1;
                const isPaidOut = group.rounds.some(r => r.roundNumber < group.currentRound && r.payoutMemberId === memberId && r.payoutCompleted);
                const isCurrent = roundNumber === group.currentRound && currentRound.payoutMemberId === memberId;
                
                let status, statusColor;
                if (isPaidOut) {
                    status = t('paidOut');
                    statusColor = 'text-green-500';
                } else if (isCurrent) {
                    status = t('currentRecipient');
                    statusColor = 'text-indigo-500';
                } else {
                    status = t('upcoming');
                    statusColor = 'text-yellow-500';
                }

                return (
                    <div key={memberId} className={`flex items-center justify-between p-3 rounded-lg ${isCurrent ? 'bg-indigo-50 dark:bg-indigo-900/30 ring-2 ring-indigo-500' : 'bg-gray-50 dark:bg-gray-700/50'}`}>
                        <div className="flex items-center">
                            <span className="text-lg font-bold text-gray-400 dark:text-gray-500 w-8">{roundNumber}.</span>
                            <div>
                                <p className="font-semibold">{member?.name || 'Unknown Member'}</p>
                                <p className={`text-xs font-bold ${statusColor}`}>{status}</p>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const GroupForm: React.FC<{ group: Group | null, onSave: (group: Omit<Group, 'id' | 'currentRound' | 'status' | 'rounds'>) => void, onCancel: () => void }> = ({ group, onSave, onCancel }) => {
    const { t } = useTranslation();
    const [name, setName] = useState(group?.name || '');
    const [contributionAmount, setContributionAmount] = useState(group?.contributionAmount || 100);
    const [members, setMembers] = useState<Member[]>(group?.members || [{ id: `mem_${Date.now()}`, name: '', phone: '' }]);
    const [payoutOrder, setPayoutOrder] = useState<string[]>(group?.payoutOrder || []);

    useEffect(() => {
        if(group) {
            setMembers(group.members);
            setPayoutOrder(group.payoutOrder);
        } else {
            setPayoutOrder(members.map(m => m.id));
        }
    }, [group, members]);

    const handleAddMember = () => {
        const newMember = { id: `mem_${Date.now()}`, name: '', phone: '' };
        setMembers([...members, newMember]);
        setPayoutOrder([...payoutOrder, newMember.id]);
    };

    const handleRemoveMember = (id: string) => {
        setMembers(members.filter(m => m.id !== id));
        setPayoutOrder(payoutOrder.filter(orderId => orderId !== id));
    };

    const handleMemberChange = (id: string, field: 'name' | 'phone', value: string) => {
        setMembers(members.map(m => m.id === id ? { ...m, [field]: value } : m));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const validMembers = members.filter(m => m.name.trim() !== '');
        onSave({ name, contributionAmount, members: validMembers, payoutOrder: payoutOrder.filter(id => validMembers.some(m => m.id === id)) });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label htmlFor="group-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('groupName')}</label>
                <input type="text" id="group-name" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600" />
            </div>
            <div>
                <label htmlFor="contribution-amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('contributionAmount')}</label>
                <input type="number" id="contribution-amount" value={contributionAmount} onChange={e => setContributionAmount(Number(e.target.value))} required min="1" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600" />
            </div>
            <div>
                <h3 className="text-lg font-medium mb-2">{t('members')}</h3>
                <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                    {members.map((member, index) => (
                        <MemberInput key={member.id} member={member} onMemberChange={handleMemberChange} onRemove={handleRemoveMember} />
                    ))}
                </div>
                <button type="button" onClick={handleAddMember} className="mt-2 flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300">
                    <PlusIcon className="w-4 h-4 mr-1" /> {t('addMember')}
                </button>
            </div>
             <div>
                <h3 className="text-lg font-medium mb-2">{t('payoutOrder')}</h3>
                <p className="text-sm text-gray-500 mb-2">{t('payoutOrderInfo')}</p>
                {members.filter(m => m.name).length > 0 ? (
                    <DraggableMemberList members={members} payoutOrder={payoutOrder} setPayoutOrder={setPayoutOrder} />
                ) : (
                    <p className="text-sm text-gray-500 text-center py-4 bg-gray-100 dark:bg-gray-700 rounded-md">{t('addMembersForPayout')}</p>
                )}
            </div>
            <div className="flex justify-end space-x-3 pt-4 border-t dark:border-gray-700">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500">{t('cancel')}</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">{group ? t('saveChanges') : t('createGroup')}</button>
            </div>
        </form>
    );
};

const MemberInput: React.FC<{ member: Member, onMemberChange: (id: string, field: 'name' | 'phone', value: string) => void, onRemove: (id: string) => void }> = ({ member, onMemberChange, onRemove }) => {
    const { t } = useTranslation();
    return (
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:space-x-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-2 sm:space-y-0">
            <input type="text" placeholder={t('name')} value={member.name} onChange={e => onMemberChange(member.id, 'name', e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm text-sm dark:bg-gray-700 dark:border-gray-600" />
            <input type="tel" placeholder={t('phoneOptional')} value={member.phone} onChange={e => onMemberChange(member.id, 'phone', e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm text-sm dark:bg-gray-700 dark:border-gray-600" />
            <button type="button" onClick={() => onRemove(member.id)} className="absolute -top-1 -right-1 sm:static p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-full bg-white dark:bg-gray-800 sm:bg-transparent dark:sm:bg-transparent shadow-md sm:shadow-none">
                <TrashIcon className="w-4 h-4" />
                <span className="sr-only">{t('removeMember')}</span>
            </button>
        </div>
    );
};

const DraggableMemberList: React.FC<{ members: Member[], payoutOrder: string[], setPayoutOrder: (order: string[]) => void }> = ({ members, payoutOrder, setPayoutOrder }) => {
    const [draggedId, setDraggedId] = useState<string | null>(null);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
        setDraggedId(id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetId: string) => {
        e.preventDefault();
        if (draggedId === null || draggedId === targetId) return;

        const draggedIndex = payoutOrder.indexOf(draggedId);
        const targetIndex = payoutOrder.indexOf(targetId);

        const newOrder = [...payoutOrder];
        newOrder.splice(draggedIndex, 1);
        newOrder.splice(targetIndex, 0, draggedId);
        
        setPayoutOrder(newOrder);
        setDraggedId(null);
    };

    const orderedMembers = payoutOrder.map(id => members.find(m => m.id === id)).filter((m): m is Member => !!m && !!m.name);

    return (
        <div className="space-y-2 max-h-60 overflow-y-auto pr-2 border dark:border-gray-700 rounded-lg p-2">
            {orderedMembers.map((member, index) => (
                <div
                    key={member.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, member.id)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, member.id)}
                    className="flex items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-move transition-shadow"
                >
                    <GripVerticalIcon className="w-5 h-5 text-gray-400 mr-2" />
                    <span className="font-semibold">{index + 1}. {member.name}</span>
                </div>
            ))}
        </div>
    );
};

interface SettingsProps {
    onBack: () => void;
    onClearData: () => void;
    previousView: View;
}

const Settings: React.FC<SettingsProps> = ({onBack, onClearData, previousView}) => {
    const { t } = useTranslation();
    const getBackText = () => {
        switch(previousView) {
            case 'groupList':
                return t('backToAllGroups');
            case 'dashboard':
            default:
                return t('backToDashboard');
        }
    };
    return (
         <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md max-w-2xl mx-auto">
             <button onClick={onBack} className="flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white mb-4">
                <ArrowLeftIcon className="w-4 h-4 mr-2" /> {getBackText()}
            </button>
            <h2 className="text-3xl font-bold mb-6">{t('settings')}</h2>
            <div className="space-y-8">
                <div>
                    <h3 className="text-lg font-semibold">{t('dangerZone')}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('dangerZoneDesc')}</p>
                    <div className="p-4 border border-red-300 dark:border-red-700 rounded-lg bg-red-50 dark:bg-red-900/20 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                        <p className="font-medium text-red-800 dark:text-red-300 text-center sm:text-left">{t('clearAllGroupData')}</p>
                        <button onClick={onClearData} className="px-4 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 w-full sm:w-auto">
                            {t('clearAllGroupData')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

interface UserManualProps {
    onBack: () => void;
    previousView: View;
}

const UserManual: React.FC<UserManualProps> = ({onBack, previousView}) => {
    const { t } = useTranslation();
    const ManualSection: React.FC<{title: string, children: React.ReactNode}> = ({title, children}) => (
        <div className="mb-6">
            <h3 className="text-xl font-bold text-indigo-700 dark:text-indigo-400 mb-2 border-b-2 border-indigo-200 dark:border-indigo-800 pb-1">{title}</h3>
            <div className="space-y-3 text-gray-700 dark:text-gray-300 leading-relaxed">{children}</div>
        </div>
    );
    const getBackText = () => {
        switch(previousView) {
            case 'groupList':
                return t('backToAllGroups');
            case 'dashboard':
            default:
                return t('backToDashboard');
        }
    };
    return (
        <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-lg shadow-md max-w-4xl mx-auto">
             <button onClick={onBack} className="flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white mb-4">
                <ArrowLeftIcon className="w-4 h-4 mr-2" /> {getBackText()}
            </button>
             <h2 className="text-3xl font-bold mb-2 text-center">{t('manualTitle')}</h2>
             <p className="text-center text-gray-500 dark:text-gray-400 mb-8">{t('manualWelcome')}</p>

            <ManualSection title={t('manualGettingStarted')}>
                <p>{t('manualGettingStartedP1')}</p>
                <p>{t('manualGettingStartedP2')}</p>
            </ManualSection>

             <ManualSection title={t('manualDashboard')}>
                <p>{t('manualDashboardP1')}</p>
                <ul className="list-disc list-inside space-y-2 pl-4">
                    <li><span className="font-semibold">{t('dailyFinancialTip')}:</span> {t('manualDashboardL1')}</li>
                    <li><span className="font-semibold">{t('newGroup')}:</span> {t('manualDashboardL2')}</li>
                    <li><span className="font-semibold">{t('myGroups')}:</span> {t('manualDashboardL3')}</li>
                </ul>
            </ManualSection>

             <ManualSection title={t('manualCreateEdit')}>
                <p>{t('manualCreateEditP1')}</p>
                 <ul className="list-disc list-inside space-y-2 pl-4">
                    <li><span className="font-semibold">{t('groupName')}:</span> {t('manualCreateEditL1')}</li>
                    <li><span className="font-semibold">{t('contributionAmount')}:</span> {t('manualCreateEditL2')}</li>
                    <li><span className="font-semibold">{t('members')}:</span> {t('manualCreateEditL3')}</li>
                    <li><span className="font-semibold">{t('payoutOrder')}:</span> {t('manualCreateEditL4')}</li>
                </ul>
                <p>{t('manualCreateEditP2')}</p>
            </ManualSection>
            
             <ManualSection title={t('manualManage')}>
                <p>{t('manualManageP1')}</p>
                <h4 className="font-semibold mt-4">{t('manualManageWorkflow')}</h4>
                 <ul className="list-decimal list-inside space-y-2 pl-4">
                    <li>{t('manualManageL1')}</li>
                    <li>{t('manualManageL2')}</li>
                    <li>{t('manualManageL3')}</li>
                </ul>
                <p>{t('manualManageP2')}</p>
            </ManualSection>

            <ManualSection title={t('manualSettings')}>
                <p>{t('manualSettingsP1')}</p>
            </ManualSection>

            <ManualSection title={t('manualFAQ')}>
                <div className="space-y-4">
                    <div>
                        <p className="font-semibold">{t('manualFAQQ1')}</p>
                        <p>{t('manualFAQA1')}</p>
                    </div>
                    <div>
                        <p className="font-semibold">{t('manualFAQQ2')}</p>
                        <p>{t('manualFAQA2')}</p>
                    </div>
                    <div>
                        <p className="font-semibold">{t('manualFAQQ3')}</p>
                        <p>{t('manualFAQA3')}</p>
                    </div>
                </div>
            </ManualSection>
        </div>
    );
};


export default App;
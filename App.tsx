
import React, { useState, useEffect, useCallback, useMemo, createContext, useContext } from 'react';
import { Group, Member, Round, Payment, Frequency } from './types';
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
            payoutFrequency: 'Monthly',
            paymentFrequency: 'Monthly',
            members,
            payoutOrder: ['2', '5', '1', '4', '3'],
            currentRound: 1,
            status: 'Pending',
            rounds: initialRounds,
        }
    ];
};

type View = 'dashboard' | 'groupList' | 'groupDetail' | 'settings' | 'userManual';


const Header: React.FC<{
    currentView: View;
    onNavigate: (view: View, fromView: View) => void;
    language: Language;
    onLanguageChange: (lang: Language) => void;
}> = ({ currentView, onNavigate, language, onLanguageChange }) => {
    const { t } = useTranslation();
    return (
        <header className="bg-white dark:bg-gray-800 shadow-md p-4 flex justify-between items-center sticky top-0 z-30 no-print">
            <div className="flex items-center space-x-2">
                <span className="text-2xl text-indigo-600 dark:text-indigo-400">💵</span>
                <h1 className="text-xl sm:text-2xl font-bold font-title text-gray-800 dark:text-white tracking-wider">
                    KutuPro<span className="font-manager text-indigo-500">Manager</span>
                </h1>
            </div>
            <nav className="flex items-center space-x-1 sm:space-x-2">
                <button onClick={() => onNavigate('dashboard', currentView)} className={`flex items-center space-x-2 px-2 sm:px-3 py-2 rounded-md text-sm font-medium ${currentView === 'dashboard' ? 'bg-indigo-100 text-indigo-700 dark:bg-gray-700 dark:text-white' : 'text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}>
                    <LayoutGridIcon className="w-5 h-5" />
                    <span className="hidden md:inline">{t('dashboard')}</span>
                </button>
                <button onClick={() => onNavigate('groupList', currentView)} className={`flex items-center space-x-2 px-2 sm:px-3 py-2 rounded-md text-sm font-medium ${currentView === 'groupList' ? 'bg-indigo-100 text-indigo-700 dark:bg-gray-700 dark:text-white' : 'text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}>
                    <UsersIcon className="w-5 h-5" />
                    <span className="hidden md:inline">{t('myGroups')}</span>
                </button>
                <button onClick={() => onNavigate('userManual', currentView)} className={`flex items-center space-x-2 px-2 sm:px-3 py-2 rounded-md text-sm font-medium ${currentView === 'userManual' ? 'bg-indigo-100 text-indigo-700 dark:bg-gray-700 dark:text-white' : 'text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}>
                    <BookOpenIcon className="w-5 h-5" />
                    <span className="hidden md:inline">{t('userManual')}</span>
                </button>
                 <div className="hidden sm:flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-full p-1">
                    <GlobeIcon className="w-5 h-5 text-gray-500 dark:text-gray-400 mx-1" />
                    <button onClick={() => onLanguageChange('en')} className={`px-3 py-1 text-sm font-semibold rounded-full ${language === 'en' ? 'bg-white text-indigo-600 shadow' : 'text-gray-600 dark:text-gray-300'}`}>EN</button>
                    <button onClick={() => onLanguageChange('bm')} className={`px-3 py-1 text-sm font-semibold rounded-full ${language === 'bm' ? 'bg-white text-indigo-600 shadow' : 'text-gray-600 dark:text-gray-300'}`}>BM</button>
                </div>
                <button onClick={() => onNavigate('settings', currentView)} className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700">
                    <SettingsIcon className="w-6 h-6" />
                </button>
            </nav>
        </header>
    );
};

const StatCard: React.FC<{ title: string, value: string | number, icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex items-center space-x-4">
        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-full">
            {icon}
        </div>
        <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
        </div>
    </div>
);

const Dashboard: React.FC<{
    groups: Group[];
    onSelectGroup: (groupId: string, fromView: View) => void;
    financialTip: string;
    isLoadingTip: boolean;
    onRefreshTip: () => void;
}> = ({ groups, onSelectGroup, financialTip, isLoadingTip, onRefreshTip }) => {
    const { t } = useTranslation();
    const { totalGroups, activeMembers, collected, outstanding } = useMemo(() => {
        let totalGroups = groups.length;
        let activeMembers = 0;
        let collected = 0;
        let outstanding = 0;

        groups.forEach(group => {
            if (group.status === 'Active') {
                activeMembers += group.members.length;
                const currentRound = group.rounds.find(r => r.roundNumber === group.currentRound);
                if (currentRound) {
                    currentRound.payments.forEach(p => {
                        if (p.status === 'Paid') {
                            collected += group.contributionAmount;
                        } else {
                            outstanding += group.contributionAmount;
                        }
                    });
                }
            }
        });
        return { totalGroups, activeMembers, collected, outstanding };
    }, [groups]);

    const upcomingPayouts = useMemo(() => {
        return groups
            .filter(g => g.status === 'Active')
            .map(g => {
                const recipientId = g.payoutOrder[g.currentRound - 1];
                const recipient = g.members.find(m => m.id === recipientId);
                return {
                    groupId: g.id,
                    groupName: g.name,
                    recipientName: recipient ? recipient.name : 'N/A',
                    payoutAmount: g.contributionAmount * g.members.length
                };
            });
    }, [groups]);

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md flex items-center justify-between">
                <div className="flex items-center">
                    <LightbulbIcon className="w-6 h-6 text-yellow-500 mr-3" />
                    <div>
                        <p className="font-semibold text-gray-800 dark:text-white">{t('dailyFinancialTip')}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300 italic">{isLoadingTip ? '...' : `"${financialTip}"`}</p>
                    </div>
                </div>
                <button onClick={onRefreshTip} className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700">
                    <RefreshCwIcon className={`w-5 h-5 ${isLoadingTip ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title={t('totalGroups')} value={totalGroups} icon={<UsersIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-300" />} />
                <StatCard title={t('activeMembers')} value={activeMembers} icon={<CalendarIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-300" />} />
                <StatCard title={t('collectedCurrentRounds')} value={`RM ${collected.toLocaleString()}`} icon={<CheckCircleIcon className="w-6 h-6 text-green-600 dark:text-green-300" />} />
                <StatCard title={t('outstandingCurrentRounds')} value={`RM ${outstanding.toLocaleString()}`} icon={<XCircleIcon className="w-6 h-6 text-red-500" />} />
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">{t('upcomingPayouts')}</h2>
                {upcomingPayouts.length > 0 ? (
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {upcomingPayouts.map(p => (
                            <li key={p.groupId} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between">
                                <div className="mb-2 sm:mb-0">
                                    <p className="font-semibold text-gray-800 dark:text-white">{p.recipientName}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{p.groupName}</p>
                                </div>
                                <div className="flex items-center space-x-4 w-full sm:w-auto">
                                    <p className="font-bold text-lg text-indigo-600 dark:text-indigo-400 flex-grow sm:flex-grow-0">RM {p.payoutAmount.toLocaleString()}</p>
                                    <button onClick={() => onSelectGroup(p.groupId, 'dashboard')} className="flex items-center text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                                        {t('viewDetails')} <ChevronRightIcon className="w-4 h-4 ml-1" />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-500 dark:text-gray-400">{t('noUpcomingPayouts')}</p>
                )}
            </div>
        </div>
    );
};

const GroupListItem: React.FC<{
    group: Group;
    onSelect: () => void;
    onEdit: () => void;
    onDelete: () => void;
}> = ({ group, onSelect, onEdit, onDelete }) => {
    const { t } = useTranslation();
    const statusClasses = {
        'Active': 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
        'Pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400',
        'Completed': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    };
    const totalRounds = group.members.length;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-shadow duration-300 hover:shadow-lg">
            <div className="p-6">
                <div className="flex justify-between items-start">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">{group.name}</h3>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${statusClasses[group.status]}`}>{group.status}</span>
                </div>
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                        <p className="text-gray-500 dark:text-gray-400">{t('contribution')}</p>
                        <p className="font-semibold text-gray-800 dark:text-white">RM {group.contributionAmount.toLocaleString()}</p>
                    </div>
                    <div>
                         <p className="text-gray-500 dark:text-gray-400">{t('round')}</p>
                         <p className="font-semibold text-gray-800 dark:text-white">{group.currentRound} / {totalRounds}</p>
                    </div>
                    <div>
                        <p className="text-gray-500 dark:text-gray-400">{t('payoutFrequency')}</p>
                        <p className="font-semibold text-gray-800 dark:text-white">{t(group.payoutFrequency?.toLowerCase() || 'monthly')}</p>
                    </div>
                     <div>
                        <p className="text-gray-500 dark:text-gray-400">{t('paymentFrequency')}</p>
                        <p className="font-semibold text-gray-800 dark:text-white">{t(group.paymentFrequency?.toLowerCase() || 'monthly')}</p>
                    </div>
                </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-3 flex items-center justify-end space-x-2">
                 <button onClick={onEdit} className="p-2 rounded-full text-gray-500 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-600" title={t('editGroup')}>
                    <SettingsIcon className="w-5 h-5" />
                </button>
                 <button onClick={onDelete} className="p-2 rounded-full text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50" title={t('deleteGroup')}>
                    <TrashIcon className="w-5 h-5" />
                </button>
                <button onClick={onSelect} className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800">
                    {t('viewDetails')}
                </button>
            </div>
        </div>
    );
};

const GroupList: React.FC<{
    groups: Group[];
    onSelectGroup: (groupId: string, fromView: View) => void;
    onOpenForm: (group?: Group) => void;
    onDeleteGroup: (group: Group) => void;
}> = ({ groups, onSelectGroup, onOpenForm, onDeleteGroup }) => {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredGroups = useMemo(() =>
        groups.filter(group =>
            group.name.toLowerCase().includes(searchTerm.toLowerCase())
        ), [groups, searchTerm]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="relative w-full sm:max-w-xs">
                     <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SearchIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder={t('searchMemberPlaceholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                <button onClick={() => onOpenForm()} className="w-full sm:w-auto flex items-center justify-center px-4 py-2 font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    <PlusIcon className="w-5 h-5 mr-2" />
                    {t('newGroup')}
                </button>
            </div>
            
            {filteredGroups.length > 0 ? (
                <div className="space-y-4">
                    {filteredGroups.map(group => (
                        <GroupListItem
                            key={group.id}
                            group={group}
                            onSelect={() => onSelectGroup(group.id, 'groupList')}
                            onEdit={() => onOpenForm(group)}
                            onDelete={() => onDeleteGroup(group)}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16">
                    <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">{t('noGroupsYet')}</p>
                    <p className="text-gray-500 dark:text-gray-400">{t('clickNewGroup')}</p>
                </div>
            )}
        </div>
    );
};

const MemberInput: React.FC<{
    member: Member;
    onUpdate: (member: Member) => void;
    onRemove: () => void;
}> = ({ member, onUpdate, onRemove }) => {
    const { t } = useTranslation();
    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md">
            <input
                type="text"
                placeholder={t('name')}
                value={member.name}
                onChange={(e) => onUpdate({ ...member, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                required
            />
            <input
                type="tel"
                placeholder={t('phoneOptional')}
                value={member.phone || ''}
                onChange={(e) => onUpdate({ ...member, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
                type="button"
                onClick={onRemove}
                className="w-full sm:w-auto flex-shrink-0 p-2 text-red-500 rounded-md hover:bg-red-100 dark:hover:bg-red-900/50"
                title={t('removeMember')}
            >
                <TrashIcon className="w-5 h-5 mx-auto" />
            </button>
        </div>
    );
};

const DraggableMemberList: React.FC<{
    members: Member[];
    order: string[];
    setOrder: (order: string[]) => void;
}> = ({ members, order, setOrder }) => {
    const { t } = useTranslation();
    const [draggedItem, setDraggedItem] = useState<string | null>(null);

    const handleDragStart = (e: React.DragEvent<HTMLLIElement>, memberId: string) => {
        setDraggedItem(memberId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent<HTMLLIElement>) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent<HTMLLIElement>, targetMemberId: string) => {
        e.preventDefault();
        if (!draggedItem) return;

        const draggedIndex = order.indexOf(draggedItem);
        const targetIndex = order.indexOf(targetMemberId);

        if (draggedIndex === -1 || targetIndex === -1) return;

        const newOrder = [...order];
        newOrder.splice(draggedIndex, 1);
        newOrder.splice(targetIndex, 0, draggedItem);
        setOrder(newOrder);
        setDraggedItem(null);
    };

    const getMemberName = useCallback((id: string) => {
        return members.find(m => m.id === id)?.name || 'Unknown';
    }, [members]);

    return (
        <ul className="space-y-2">
            {order.map((memberId, index) => (
                <li
                    key={memberId}
                    draggable
                    onDragStart={(e) => handleDragStart(e, memberId)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, memberId)}
                    className="flex items-center p-3 bg-white dark:bg-gray-700 rounded-md border dark:border-gray-600 cursor-move shadow-sm"
                >
                    <GripVerticalIcon className="w-6 h-6 text-gray-400 mr-4" />
                    <span className="font-bold text-lg text-indigo-600 dark:text-indigo-300 mr-4">{index + 1}</span>
                    <span className="text-gray-800 dark:text-white">{getMemberName(memberId)}</span>
                </li>
            ))}
        </ul>
    );
};

const GroupForm: React.FC<{
    group?: Group;
    onSave: (group: Omit<Group, 'id' | 'currentRound' | 'status' | 'rounds'> & { id?: string }) => void;
    onClose: () => void;
}> = ({ group, onSave, onClose }) => {
    const { t } = useTranslation();
    const [name, setName] = useState('');
    const [contributionAmount, setContributionAmount] = useState<number>(100);
    const [payoutFrequency, setPayoutFrequency] = useState<Frequency>('Monthly');
    const [paymentFrequency, setPaymentFrequency] = useState<Frequency>('Monthly');
    const [members, setMembers] = useState<Member[]>([{ id: Date.now().toString(), name: '', phone: '' }]);
    const [payoutOrder, setPayoutOrder] = useState<string[]>([]);

    useEffect(() => {
        if (group) {
            setName(group.name);
            setContributionAmount(group.contributionAmount);
            setPayoutFrequency(group.payoutFrequency || 'Monthly');
            setPaymentFrequency(group.paymentFrequency || 'Monthly');
            setMembers(group.members);
            setPayoutOrder(group.payoutOrder);
        }
    }, [group]);
    
    useEffect(() => {
        const validMembers = members.filter(m => m.name.trim() !== '');
        const newOrder = validMembers.map(m => m.id);
        const currentOrder = [...payoutOrder];
    
        // Add new members to the order
        newOrder.forEach(id => {
            if (!currentOrder.includes(id)) {
                currentOrder.push(id);
            }
        });
    
        // Remove members that no longer exist
        const finalOrder = currentOrder.filter(id => newOrder.includes(id));
        setPayoutOrder(finalOrder);
    }, [members]);

    const handleAddMember = () => {
        setMembers([...members, { id: Date.now().toString(), name: '', phone: '' }]);
    };

    const handleUpdateMember = (index: number, updatedMember: Member) => {
        const newMembers = [...members];
        newMembers[index] = updatedMember;
        setMembers(newMembers);
    };

    const handleRemoveMember = (index: number) => {
        if (members.length > 1) {
            const memberToRemove = members[index];
            setMembers(members.filter((_, i) => i !== index));
            setPayoutOrder(payoutOrder.filter(id => id !== memberToRemove.id));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalMembers = members.filter(m => m.name.trim() !== '');
        if (finalMembers.length === 0) return;

        onSave({
            id: group?.id,
            name,
            contributionAmount,
            payoutFrequency,
            paymentFrequency,
            members: finalMembers,
            payoutOrder,
        });
        onClose();
    };

    const validMembersForPayout = useMemo(() => members.filter(m => m.name.trim() !== ''), [members]);

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label htmlFor="groupName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('groupName')}</label>
                <input
                    id="groupName"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    required
                />
            </div>
            <div>
                <label htmlFor="contributionAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('contributionAmount')}</label>
                <input
                    id="contributionAmount"
                    type="number"
                    value={contributionAmount}
                    onChange={(e) => setContributionAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    required
                    min="1"
                />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="payoutFrequency" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('payoutFrequency')}</label>
                    <select
                        id="payoutFrequency"
                        value={payoutFrequency}
                        onChange={(e) => setPayoutFrequency(e.target.value as Frequency)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                        <option value="Monthly">{t('monthly')}</option>
                        <option value="Weekly">{t('weekly')}</option>
                        <option value="Daily">{t('daily')}</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="paymentFrequency" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('paymentFrequency')}</label>
                    <select
                        id="paymentFrequency"
                        value={paymentFrequency}
                        onChange={(e) => setPaymentFrequency(e.target.value as Frequency)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                        <option value="Monthly">{t('monthly')}</option>
                        <option value="Weekly">{t('weekly')}</option>
                        <option value="Daily">{t('daily')}</option>
                    </select>
                </div>
            </div>

            <div>
                <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">{t('members')}</h4>
                <div className="space-y-2">
                    {members.map((member, index) => (
                        <MemberInput
                            key={member.id}
                            member={member}
                            onUpdate={(updated) => handleUpdateMember(index, updated)}
                            onRemove={() => handleRemoveMember(index)}
                        />
                    ))}
                </div>
                 <button type="button" onClick={handleAddMember} className="mt-2 flex items-center px-3 py-2 text-sm font-semibold text-indigo-600 dark:text-indigo-300 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-900/50">
                    <PlusIcon className="w-4 h-4 mr-2" />
                    {t('addMember')}
                </button>
            </div>
            
            <div>
                <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">{t('payoutOrder')}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{t('payoutOrderInfo')}</p>
                {validMembersForPayout.length > 0 ? (
                    <DraggableMemberList members={validMembersForPayout} order={payoutOrder} setOrder={setPayoutOrder} />
                ) : (
                    <p className="text-center py-4 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-md">{t('addMembersForPayout')}</p>
                )}
            </div>

            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">{t('cancel')}</button>
                <button type="submit" className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    {group ? t('saveChanges') : t('createGroup')}
                </button>
            </div>
        </form>
    );
};


const GroupDetail: React.FC<{
    group: Group;
    onMarkAsPaid: (groupId: string, memberId: string) => void;
    onMarkPayoutComplete: (groupId: string) => void;
    onStartNextRound: (groupId: string) => void;
    onDelete: () => void;
    onOpenForm: (group: Group) => void;
    onExportGroup: (group: Group) => void;
}> = ({ group, onMarkAsPaid, onMarkPayoutComplete, onStartNextRound, onDelete, onOpenForm, onExportGroup }) => {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');
    
    const currentRoundDetails = group.rounds.find(r => r.roundNumber === group.currentRound);
    if (!currentRoundDetails) return <div>Round not found!</div>;

    const payoutMemberId = group.payoutOrder[group.currentRound - 1];
    const payoutMember = group.members.find(m => m.id === payoutMemberId);
    
    const getMemberName = useCallback((id: string) => {
        return group.members.find(m => m.id === id)?.name || 'Unknown';
    }, [group.members]);
    
    const allPaid = currentRoundDetails.payments.every(p => p.status === 'Paid');

    const filteredPayments = currentRoundDetails.payments.filter(payment =>
        getMemberName(payment.memberId).toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const collectedAmount = currentRoundDetails.payments.filter(p => p.status === 'Paid').length * group.contributionAmount;
    const totalPool = group.contributionAmount * group.members.length;

    const handleRemindAll = () => {
        const unpaidMembers = currentRoundDetails.payments
            .filter(p => p.status === 'Unpaid')
            .map(p => group.members.find(m => m.id === p.memberId))
            .filter(m => m?.phone);

        if (unpaidMembers.length === 0) return;
        
        const message = encodeURIComponent(`Hi, a friendly reminder for your KutuPro group "${group.name}" payment of RM${group.contributionAmount}. Thank you!`);
        
        let url = 'https://wa.me/';
        const numbers = unpaidMembers.map(m => m!.phone!.replace(/[^0-9]/g, '')).join(',');
        url += numbers + `?text=${message}`;

        window.open(url, '_blank');
    };

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{group.name}</h2>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-gray-500 dark:text-gray-400 text-sm mt-1">
                        <p>{t('managingRound')} {group.currentRound} {t('of')} {group.members.length}</p>
                        <span className="hidden sm:inline">•</span>
                        <p>{t('payoutFrequency')}: {t(group.payoutFrequency?.toLowerCase() || 'monthly')}</p>
                         <span className="hidden sm:inline">•</span>
                        <p>{t('paymentFrequency')}: {t(group.paymentFrequency?.toLowerCase() || 'monthly')}</p>
                    </div>
                </div>
                 <div className="flex flex-wrap items-center gap-2">
                    <button onClick={handleRemindAll} className="flex items-center px-3 py-2 text-sm font-semibold text-white bg-green-500 rounded-md hover:bg-green-600">
                        <WhatsAppIcon className="w-5 h-5 mr-2" />
                        <span className="hidden sm:inline">{t('remind')}</span>
                    </button>
                    <button onClick={() => onExportGroup(group)} className="flex items-center px-3 py-2 text-sm font-semibold text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">
                        <DownloadIcon className="w-5 h-5 mr-2" />
                        <span className="hidden sm:inline">{t('export')}</span>
                    </button>
                    <button onClick={() => window.print()} className="flex items-center px-3 py-2 text-sm font-semibold text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">
                        <PrinterIcon className="w-5 h-5 mr-2" />
                        <span className="hidden sm:inline">{t('print')}</span>
                    </button>
                     <button onClick={() => onOpenForm(group)} className="flex items-center px-3 py-2 text-sm font-semibold text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">
                        <SettingsIcon className="w-5 h-5 mr-2" />
                        <span className="hidden sm:inline">{t('editGroup')}</span>
                    </button>
                    <button onClick={onDelete} className="flex items-center px-3 py-2 text-sm font-semibold text-white bg-red-600 rounded-md hover:bg-red-700">
                        <TrashIcon className="w-5 h-5 mr-2" />
                         <span className="hidden sm:inline">{t('delete')}</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title={t('totalPool')} value={`RM ${totalPool.toLocaleString()}`} icon={<DollarSignIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-300" />} />
                <StatCard title={t('collectedThisRound')} value={`RM ${collectedAmount.toLocaleString()}`} icon={<CheckCircleIcon className="w-6 h-6 text-green-600 dark:text-green-300" />} />
                <StatCard title={t('payoutRecipient')} value={payoutMember?.name || 'N/A'} icon={<UsersIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-300" />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">{t('roundPayments')}</h3>
                    <div className="relative mb-4 no-print">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <SearchIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder={t('searchMemberPlaceholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredPayments.length > 0 ? filteredPayments.map(payment => (
                                <li key={payment.memberId} className="py-3 flex justify-between items-center">
                                    <span className="text-gray-800 dark:text-white">{getMemberName(payment.memberId)}</span>
                                    {payment.status === 'Paid' ? (
                                        <span className="flex items-center px-3 py-1 text-sm font-medium text-green-700 bg-green-100 rounded-full dark:bg-green-900/50 dark:text-green-300">
                                            <CheckCircleIcon className="w-4 h-4 mr-1.5" />
                                            {t('paid')}
                                        </span>
                                    ) : (
                                        <button onClick={() => onMarkAsPaid(group.id, payment.memberId)} className="px-3 py-1 text-sm font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
                                            {t('markPaid')}
                                        </button>
                                    )}
                                </li>
                            )) : (
                                <p className="py-4 text-center text-gray-500 dark:text-gray-400">{t('noMembersFound')}</p>
                            )}
                        </ul>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                     <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">{t('payoutOrder')}</h3>
                    <ul className="space-y-3">
                        {group.payoutOrder.map((memberId, index) => {
                            const roundNum = index + 1;
                            let status, classes;
                            if (roundNum < group.currentRound) {
                                status = t('paidOut');
                                classes = 'text-gray-500 dark:text-gray-400';
                            } else if (roundNum === group.currentRound) {
                                status = t('currentRecipient');
                                classes = 'font-bold text-indigo-600 dark:text-indigo-300 ring-2 ring-indigo-500';
                            } else {
                                status = t('upcoming');
                                classes = 'text-gray-800 dark:text-white';
                            }

                            return (
                                <li key={memberId} className={`flex justify-between items-center p-3 rounded-md transition-all ${roundNum === group.currentRound ? 'bg-indigo-50 dark:bg-indigo-900/30' : ''}`}>
                                    <div className="flex items-center">
                                        <span className={`w-6 text-center font-bold mr-3 ${classes}`}>{roundNum}</span>
                                        <span className={classes}>{getMemberName(memberId)}</span>
                                    </div>
                                    <span className={`text-xs font-semibold ${classes}`}>{status}</span>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </div>

            <div className="mt-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                 {group.status === 'Completed' ? (
                     <div className="text-center">
                        <CheckCircleIcon className="w-12 h-12 text-green-500 mx-auto mb-2" />
                        <p className="text-lg font-semibold text-gray-800 dark:text-white">{t('groupCycleComplete')}</p>
                    </div>
                 ) : (
                    <div className="flex justify-end space-x-4">
                        {!currentRoundDetails.payoutCompleted && (
                            <button
                                onClick={() => onMarkPayoutComplete(group.id)}
                                disabled={!allPaid}
                                className="px-5 py-3 font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                {t('markPayoutComplete')}
                            </button>
                        )}
                        {currentRoundDetails.payoutCompleted && group.currentRound < group.members.length && (
                             <button
                                onClick={() => onStartNextRound(group.id)}
                                className="px-5 py-3 font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                            >
                                {t('startNextRound')}
                            </button>
                        )}
                    </div>
                 )}
            </div>
        </div>
    );
};

const ManualSection: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <section className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-3 pb-2 border-b-2 border-indigo-500">{title}</h2>
        <div className="space-y-4 text-gray-600 dark:text-gray-300 text-base leading-relaxed">
            {children}
        </div>
    </section>
);

const UserManual: React.FC = () => {
    const { t } = useTranslation();
    return (
        <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-lg shadow-md">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">{t('manualTitle')}</h1>
            <ManualSection title={t('manualWelcome')}>
                <p>{t('manualWelcome')}</p>
            </ManualSection>
            <ManualSection title={t('manualGettingStarted')}>
                <p>{t('manualGettingStartedP1')}</p>
                <p><strong>{t('manualGettingStartedP2')}</strong></p>
            </ManualSection>
            <ManualSection title={t('manualDashboard')}>
                <p>{t('manualDashboardP1')}</p>
                <ul className="list-disc list-inside space-y-2">
                    <li>{t('manualDashboardL1')}</li>
                    <li>{t('manualDashboardL2')}</li>
                    <li>{t('manualDashboardL3')}</li>
                </ul>
            </ManualSection>
             <ManualSection title={t('manualCreateEdit')}>
                <p>{t('manualCreateEditP1')}</p>
                <ul className="list-disc list-inside space-y-2">
                    <li><strong>{t('manualCreateEditL1')}</strong></li>
                    <li><strong>{t('manualCreateEditL2')}</strong></li>
                    <li><strong>{t('manualCreateEditL3')}</strong></li>
                    <li><strong>{t('manualCreateEditL4')}</strong></li>
                </ul>
                <p>{t('manualCreateEditP2')}</p>
            </ManualSection>
            <ManualSection title={t('manualManage')}>
                <p>{t('manualManageP1')}</p>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mt-4 mb-2">{t('manualManageWorkflow')}</h3>
                <ol className="list-decimal list-inside space-y-2">
                    <li>{t('manualManageL1')}</li>
                    <li>{t('manualManageL2')}</li>
                    <li>{t('manualManageL3')}</li>
                </ol>
                <p className="mt-2">{t('manualManageP2')}</p>
            </ManualSection>
            <ManualSection title={t('manualSettings')}>
                 <p>{t('manualSettingsP1')}</p>
            </ManualSection>
            <ManualSection title={t('manualFAQ')}>
                <div className="space-y-4">
                    <div>
                        <p className="font-semibold text-gray-700 dark:text-gray-200">{t('manualFAQQ1')}</p>
                        <p>{t('manualFAQA1')}</p>
                    </div>
                    <div>
                        <p className="font-semibold text-gray-700 dark:text-gray-200">{t('manualFAQQ2')}</p>
                        <p>{t('manualFAQA2')}</p>
                    </div>
                    <div>
                        <p className="font-semibold text-gray-700 dark:text-gray-200">{t('manualFAQQ3')}</p>
                        <p>{t('manualFAQA3')}</p>
                    </div>
                </div>
            </ManualSection>
        </div>
    );
};


const Settings: React.FC<{
    onClearAllData: () => void;
}> = ({ onClearAllData }) => {
    const { t } = useTranslation();
    const [isConfirmingClear, setIsConfirmingClear] = useState(false);
    const [password, setPassword] = useState('');

    const handleClearClick = () => {
        if(password === 'kutupro'){
            onClearAllData();
            setIsConfirmingClear(false);
        } else {
            alert('Incorrect password');
        }
        setPassword('');
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-lg shadow-md max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">{t('settings')}</h1>
            
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-red-600 dark:text-red-500">{t('dangerZone')}</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1">{t('dangerZoneDesc')}</p>
                <div className="mt-4">
                     <button onClick={() => setIsConfirmingClear(true)} className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-md hover:bg-red-700">
                        {t('clearAllGroupData')}
                    </button>
                </div>
            </div>
             <Modal isOpen={isConfirmingClear} onClose={() => setIsConfirmingClear(false)} title={t('confirmClearAllData')}>
                 <div>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">{t('clearDataWarning')}</p>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('enterPasswordConfirm')}</label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('passwordHint')} kutupro</p>
                    <div className="mt-6 flex justify-end space-x-3">
                        <button onClick={() => setIsConfirmingClear(false)} className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">{t('cancel')}</button>
                        <button onClick={handleClearClick} className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-md hover:bg-red-700">{t('yesClearEverything')}</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

const KutuApp: React.FC = () => {
    const { language, setLanguage, t } = useTranslation();
    const { showToast } = useNotification();
    
    const [groups, setGroups] = useState<Group[]>([]);
    const [view, setView] = useState<View>('dashboard');
    const [previousView, setPreviousView] = useState<View>('dashboard');
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<Group | undefined>(undefined);
    const [deletingGroup, setDeletingGroup] = useState<Group | null>(null);
    const [password, setPassword] = useState('');
    const [financialTip, setFinancialTip] = useState('');
    const [isLoadingTip, setIsLoadingTip] = useState(true);

    // Load and save groups from/to localStorage
    useEffect(() => {
        try {
            const savedGroups = localStorage.getItem('kutu_groups');
            if (savedGroups) {
                const parsedGroups: Group[] = JSON.parse(savedGroups);
                
                // Data Normalization/Validation
                const normalizedGroups = parsedGroups.map(group => ({
                    ...group,
                    payoutFrequency: group.payoutFrequency || 'Monthly',
                    paymentFrequency: group.paymentFrequency || 'Monthly',
                    rounds: group.rounds && group.rounds.length > 0 ? group.rounds : [{
                        roundNumber: 1,
                        payoutMemberId: null,
                        payments: group.members.map(m => ({ memberId: m.id, status: 'Unpaid' })),
                        payoutCompleted: false,
                    }],
                    status: group.status || 'Pending'
                }));

                setGroups(normalizedGroups);
            } else {
                setGroups(createInitialData());
            }
        } catch (error) {
            console.error("Failed to load or parse groups from localStorage:", error);
            setGroups(createInitialData());
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('kutu_groups', JSON.stringify(groups));
    }, [groups]);

    const fetchTip = useCallback(async () => {
        setIsLoadingTip(true);
        const tip = await getFinancialTip(language);
        setFinancialTip(tip);
        setIsLoadingTip(false);
    }, [language]);
    
    useEffect(() => {
        fetchTip();
    }, [fetchTip]);
    
    // --- Navigation Handlers ---
    const handleNavigate = (newView: View, fromView: View) => {
        if (newView === 'groupDetail' || newView === 'settings' || newView === 'userManual') {
            setPreviousView(fromView);
        }
        setView(newView);
    };

    const handleBack = () => {
        setView(previousView);
        setSelectedGroupId(null);
    };
    
    const handleSelectGroup = (groupId: string, fromView: View) => {
        setSelectedGroupId(groupId);
        handleNavigate('groupDetail', fromView);
    };

    // --- Form Handlers ---
    const handleOpenForm = (group?: Group) => {
        setEditingGroup(group);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setEditingGroup(undefined);
    };

    // --- CRUD Handlers ---
    const handleSaveGroup = (groupData: Omit<Group, 'currentRound' | 'status' | 'rounds'> & { id?: string }) => {
        if (groupData.id) { // Update existing group
            setGroups(groups.map(g => g.id === groupData.id ? { ...g, ...groupData } : g));
            showToast(t('toastGroupUpdated'), 'success');
        } else { // Add new group
            const newGroup: Group = {
                ...groupData,
                id: Date.now().toString(),
                currentRound: 1,
                status: 'Pending',
                rounds: [{
                    roundNumber: 1,
                    payoutMemberId: null,
                    payments: groupData.members.map(m => ({ memberId: m.id, status: 'Unpaid' })),
                    payoutCompleted: false,
                }],
            };
            setGroups([...groups, newGroup]);
            showToast(t('toastGroupAdded'), 'success');
        }
    };

    const handleDeleteGroup = (group: Group) => {
        setDeletingGroup(group);
    };

    const confirmDelete = () => {
        if (password === 'kutupro') {
            setGroups(groups.filter(g => g.id !== deletingGroup!.id));
            showToast(t('toastGroupDeleted'), 'success');
            setDeletingGroup(null);
        } else {
            showToast(t('toastIncorrectPassword'), 'error');
        }
        setPassword('');
    };

    // --- Group Logic Handlers ---
    const handleMarkAsPaid = (groupId: string, memberId: string) => {
        setGroups(groups.map(g => {
            if (g.id === groupId) {
                const updatedRounds = g.rounds.map(r => {
                    if (r.roundNumber === g.currentRound) {
                        const updatedPayments = r.payments.map(p =>
                            p.memberId === memberId ? { ...p, status: 'Paid' as 'Paid' } : p
                        );

                        // Check if all are paid now
                        const allNowPaid = updatedPayments.every(p => p.status === 'Paid');
                        if (allNowPaid && !r.payoutMemberId) {
                            const payoutMemberId = g.payoutOrder[g.currentRound - 1];
                            const payoutMember = g.members.find(m => m.id === payoutMemberId);
                            showToast(t('toastAllPaidPayoutReady', { payoutMemberName: payoutMember?.name || 'N/A' }), 'success');
                            return { ...r, payments: updatedPayments, payoutMemberId: payoutMemberId };
                        }
                        return { ...r, payments: updatedPayments };
                    }
                    return r;
                });
                return { ...g, rounds: updatedRounds };
            }
            return g;
        }));
        showToast(t('toastPaymentUpdated'), 'success');
    };

    const handleMarkPayoutComplete = (groupId: string) => {
        setGroups(groups.map(g => {
            if (g.id === groupId) {
                const updatedRounds = g.rounds.map(r => 
                    r.roundNumber === g.currentRound ? { ...r, payoutCompleted: true } : r
                );
                return { ...g, status: 'Active', rounds: updatedRounds };
            }
            return g;
        }));
        showToast(t('toastPayoutComplete'), 'success');
    };
    
    const handleStartNextRound = (groupId: string) => {
        setGroups(groups.map(g => {
            if (g.id === groupId) {
                const currentRoundDetails = g.rounds.find(r => r.roundNumber === g.currentRound);
                if (!currentRoundDetails?.payments.every(p => p.status === 'Paid')) {
                    showToast(t('toastAllMustPay'), 'error');
                    return g;
                }
                if (!currentRoundDetails?.payoutCompleted) {
                    showToast(t('toastPayoutMustBeCompleted'), 'error');
                    return g;
                }

                const nextRoundNumber = g.currentRound + 1;
                if (nextRoundNumber > g.members.length) {
                    return { ...g, status: 'Completed' };
                }

                const newRound: Round = {
                    roundNumber: nextRoundNumber,
                    payoutMemberId: null,
                    payments: g.members.map(m => ({ memberId: m.id, status: 'Unpaid' })),
                    payoutCompleted: false,
                };
                showToast(t('toastRoundStarted', { roundNumber: nextRoundNumber }), 'info');
                return { ...g, currentRound: nextRoundNumber, rounds: [...g.rounds, newRound] };
            }
            return g;
        }));
    };

    const handleClearAllData = () => {
        setGroups([]);
        showToast(t('toastDataCleared'), 'success');
    };
    
    const handleExportGroup = (group: Group) => {
        try {
            let csvContent = "data:text/csv;charset=utf-8,";
            
            // Group Info
            csvContent += "Group Name," + group.name + "\n";
            csvContent += "Contribution Amount," + group.contributionAmount + "\n";
            csvContent += "Payout Frequency," + (group.payoutFrequency || 'Monthly') + "\n";
            csvContent += "Payment Frequency," + (group.paymentFrequency || 'Monthly') + "\n";
            csvContent += "Status," + group.status + "\n\n";

            // Members
            csvContent += "Members\n";
            csvContent += "ID,Name,Phone\n";
            group.members.forEach(m => {
                csvContent += `${m.id},"${m.name}","${m.phone || ''}"\n`;
            });
            csvContent += "\n";

            // Payout Order
            csvContent += "Payout Order\n";
            csvContent += "Order,Member Name\n";
            group.payoutOrder.forEach((id, index) => {
                const memberName = group.members.find(m => m.id === id)?.name || "Unknown";
                csvContent += `${index + 1},"${memberName}"\n`;
            });
            csvContent += "\n";

            // Rounds
            csvContent += "Rounds Breakdown\n";
            group.rounds.forEach(round => {
                csvContent += `Round ${round.roundNumber}\n`;
                const payoutMemberName = group.members.find(m => m.id === group.payoutOrder[round.roundNumber - 1])?.name || "N/A";
                csvContent += `Payout Recipient,"${payoutMemberName}"\n`;
                csvContent += `Payout Status,${round.payoutCompleted ? 'Completed' : 'Pending'}\n`;
                csvContent += "Member Name,Payment Status\n";
                round.payments.forEach(payment => {
                    const memberName = group.members.find(m => m.id === payment.memberId)?.name || "Unknown";
                    csvContent += `"${memberName}",${payment.status}\n`;
                });
                csvContent += "\n";
            });

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `kutupro_export_${group.name.replace(/\s+/g, '_').toLowerCase()}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showToast(t('toastExportSuccessful'), 'success');
        } catch(e) {
            showToast(t('toastExportFailed'), 'error');
            console.error(e);
        }
    };
    
    const selectedGroup = groups.find(g => g.id === selectedGroupId);

    const renderContent = () => {
        switch (view) {
            case 'dashboard':
                return <Dashboard groups={groups} onSelectGroup={handleSelectGroup} financialTip={financialTip} isLoadingTip={isLoadingTip} onRefreshTip={fetchTip} />;
            case 'groupList':
                return <GroupList groups={groups} onSelectGroup={handleSelectGroup} onOpenForm={handleOpenForm} onDeleteGroup={handleDeleteGroup} />;
            case 'groupDetail':
                return selectedGroup ? <GroupDetail group={selectedGroup} onMarkAsPaid={handleMarkAsPaid} onMarkPayoutComplete={handleMarkPayoutComplete} onStartNextRound={handleStartNextRound} onDelete={() => handleDeleteGroup(selectedGroup)} onOpenForm={handleOpenForm} onExportGroup={handleExportGroup}/> : <div>Group not found</div>;
            case 'settings':
                return <Settings onClearAllData={handleClearAllData} />;
            case 'userManual':
                return <UserManual />;
            default:
                return <Dashboard groups={groups} onSelectGroup={handleSelectGroup} financialTip={financialTip} isLoadingTip={isLoadingTip} onRefreshTip={fetchTip} />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
            <Header currentView={view} onNavigate={handleNavigate} language={language} onLanguageChange={setLanguage} />
            <main className="p-4 sm:p-6 max-w-7xl mx-auto">
                 {(view === 'groupDetail' || view === 'settings' || view === 'userManual') && (
                    <button onClick={handleBack} className="flex items-center text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline mb-6 no-print">
                        <ArrowLeftIcon className="w-4 h-4 mr-2" />
                        {previousView === 'dashboard' ? t('backToDashboard') : t('backToAllGroups')}
                    </button>
                )}
                {renderContent()}
            </main>
            
            <Modal isOpen={isFormOpen} onClose={handleCloseForm} title={editingGroup ? t('editExistingGroup') : t('createNewGroup')}>
                <GroupForm group={editingGroup} onSave={handleSaveGroup} onClose={handleCloseForm} />
            </Modal>
            
            <Modal isOpen={!!deletingGroup} onClose={() => setDeletingGroup(null)} title={t('confirmDeletion')}>
                <div>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">{t('deleteGroupWarning')}</p>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('enterPasswordConfirm')}</label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('passwordHint')} kutupro</p>
                    <div className="mt-6 flex justify-end space-x-3">
                        <button onClick={() => setDeletingGroup(null)} className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">{t('cancel')}</button>
                        <button onClick={confirmDelete} className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-md hover:bg-red-700">{t('delete')}</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};


const App: React.FC = () => (
    <LanguageProvider>
        <NotificationProvider>
            <KutuApp />
        </NotificationProvider>
    </LanguageProvider>
);

export default App;

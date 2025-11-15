
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Group, Member, Round } from './types';
import { getFinancialTip } from './services/geminiService';
import { UsersIcon, CalendarIcon, DollarSignIcon, CheckCircleIcon, XCircleIcon, ChevronRightIcon, ArrowLeftIcon, RefreshCwIcon, LightbulbIcon, SettingsIcon, WhatsAppIcon, TrashIcon, PlusIcon, PrinterIcon } from './components/icons';

// --- MOCK DATA ---
const createInitialData = (): Group[] => {
    const members: Member[] = [
        { id: 'm1', name: 'Ali bin Abu', phone: '60123456789' },
        { id: 'm2', name: 'Siti Nurhaliza', phone: '60198765432' },
        { id: 'm3', name: 'John Doe', phone: '60112345678' },
        { id: 'm4', name: 'Mei Ling', phone: '60167891234' },
        { id: 'm5', name: 'Rajesh Kumar', phone: '60178901234' },
    ];
    
    const rounds: Round[] = [];
    // Round 1 (Completed)
    rounds.push({
        roundNumber: 1,
        payoutMemberId: 'm3',
        payoutCompleted: true,
        payments: members.map(m => ({ memberId: m.id, status: 'Paid' })),
    });
     // Round 2 (Active, no recipient yet)
    rounds.push({
        roundNumber: 2,
        payoutMemberId: null,
        payoutCompleted: false,
        payments: members.map(m => ({ memberId: m.id, status: 'Unpaid' })),
    });
    // Subsequent rounds
    for (let i = 3; i <= members.length; i++) {
        rounds.push({
            roundNumber: i,
            payoutMemberId: null,
            payoutCompleted: false,
            payments: members.map(m => ({ memberId: m.id, status: 'Unpaid' })),
        });
    }

    return [
        {
            id: 'g1',
            name: 'Kutu Keluarga Bahagia',
            contributionAmount: 200,
            members,
            payoutOrder: ['m3'], // Stores historical payout order
            currentRound: 2,
            status: 'Active',
            rounds,
        },
        {
            id: 'g2',
            name: 'Sahabat Office 2024',
            contributionAmount: 500,
            members: members.slice(0, 3),
            payoutOrder: [],
            currentRound: 1,
            status: 'Active',
            rounds: Array.from({ length: 3 }, (_, i) => ({
                roundNumber: i + 1,
                payoutMemberId: null,
                payoutCompleted: false,
                payments: members.slice(0, 3).map(m => ({
                    memberId: m.id,
                    status: 'Unpaid'
                }))
            }))
        }
    ];
};

// --- HELPER FUNCTIONS ---
const handleWhatsAppReminder = (member: Member, group: Group) => {
    if (!member.phone) {
        alert('Nombor telefon ahli tidak ditetapkan.');
        return;
    }
    const message = `Peringatan mesra untuk bayaran kutu Kumpulan '${group.name}' bagi pusingan ini sebanyak RM${group.contributionAmount}. Terima kasih!`;
    const whatsappUrl = `https://wa.me/${member.phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
};

const resetGroupProgress = (group: Group): Group => {
    const newRounds: Round[] = Array.from({ length: group.members.length }, (_, i) => ({
        roundNumber: i + 1,
        payoutMemberId: null,
        payoutCompleted: false,
        payments: group.members.map(m => ({
            memberId: m.id,
            status: 'Unpaid',
        })),
    }));

    return {
        ...group,
        payoutOrder: [],
        rounds: newRounds,
        currentRound: 1,
        status: 'Active',
    };
};

// --- CHILD COMPONENTS ---

interface FinancialTipCardProps {
    tip: string;
    isLoading: boolean;
    onRefresh: () => void;
}

const FinancialTipCard: React.FC<FinancialTipCardProps> = ({ tip, isLoading, onRefresh }) => (
    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="flex items-start justify-between">
            <div className="flex-shrink-0">
                <LightbulbIcon className="w-8 h-8 text-yellow-300"/>
            </div>
            <div className="ml-4 flex-1">
                <h3 className="font-bold text-lg">Tip Kewangan Harian</h3>
                <p className="mt-1 text-sm text-indigo-100">
                    {isLoading ? 'Memuatkan...' : tip}
                </p>
            </div>
            <button onClick={onRefresh} disabled={isLoading} className="ml-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition disabled:opacity-50">
                <RefreshCwIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
        </div>
        <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-white/10 rounded-full"></div>
    </div>
);

interface GroupCardProps {
    group: Group;
    onSelect: (group: Group) => void;
}

const GroupCard: React.FC<GroupCardProps> = ({ group, onSelect }) => {
    const currentRoundInfo = group.rounds.find(r => r.roundNumber === group.currentRound);
    const payoutMember = group.members.find(m => m.id === currentRoundInfo?.payoutMemberId);
    const totalPaid = currentRoundInfo?.payments.filter(p => p.status === 'Paid').length || 0;

    return (
        <div onClick={() => onSelect(group)} className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 cursor-pointer overflow-hidden">
            <div className="p-5">
                <div className="flex justify-between items-start">
                    <h3 className="font-bold text-lg text-gray-800 dark:text-white">{group.name}</h3>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${group.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'}`}>
                        {group.status}
                    </span>
                </div>
                <div className="mt-4 space-y-3 text-sm text-gray-600 dark:text-gray-300">
                    <div className="flex items-center">
                        <DollarSignIcon className="w-4 h-4 mr-3 text-green-500" />
                        <span>Sumbangan: <span className="font-semibold text-gray-800 dark:text-white">RM{group.contributionAmount}</span></span>
                    </div>
                    <div className="flex items-center">
                        <UsersIcon className="w-4 h-4 mr-3 text-blue-500" />
                        <span>{group.members.length} Ahli</span>
                    </div>
                    <div className="flex items-center">
                        <CalendarIcon className="w-4 h-4 mr-3 text-purple-500" />
                        <span>Pusingan: <span className="font-semibold text-gray-800 dark:text-white">{group.currentRound}/{group.members.length}</span></span>
                    </div>
                </div>
                 <div className="mt-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Giliran Pusingan Ini: <span className="font-semibold">{payoutMember?.name || 'Belum Ditetapkan'}</span></p>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mt-2">
                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${(totalPaid / group.members.length) * 100}%` }}></div>
                    </div>
                    <p className="text-right text-xs mt-1 text-gray-500 dark:text-gray-400">{totalPaid}/{group.members.length} Bayaran Diterima</p>
                </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 px-5 py-3 flex justify-end items-center">
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Lihat Butiran</span>
                <ChevronRightIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 ml-1" />
            </div>
        </div>
    );
};


interface GroupDetailProps {
    group: Group;
    onBack: () => void;
    onUpdateGroup: (updatedGroup: Group) => void;
    onGoToSettings: () => void;
}

const GroupDetail: React.FC<GroupDetailProps> = ({ group, onBack, onUpdateGroup, onGoToSettings }) => {
    const [activeRound, setActiveRound] = useState<number>(group.currentRound);
    
    const roundData = useMemo(() => group.rounds.find(r => r.roundNumber === activeRound), [group.rounds, activeRound]);
    
    const isRecipientSelectionPhase = useMemo(() => 
        roundData && !roundData.payoutMemberId && group.status === 'Active' && activeRound === group.currentRound,
        [roundData, group.status, activeRound, group.currentRound]
    );

    const paidOutMemberIds = useMemo(() => 
        group.rounds
            .filter(r => r.payoutCompleted && r.payoutMemberId)
            .map(r => r.payoutMemberId!), 
        [group.rounds]
    );

    const eligibleMembers = useMemo(() => 
        group.members.filter(m => !paidOutMemberIds.includes(m.id)), 
        [group.members, paidOutMemberIds]
    );

    const handleSetRecipient = (memberId: string) => {
        const updatedGroup = { ...group };
        const round = updatedGroup.rounds.find(r => r.roundNumber === activeRound);
        if (round && eligibleMembers.some(m => m.id === memberId)) {
            round.payoutMemberId = memberId;
            onUpdateGroup(updatedGroup);
        }
    };

    const handlePayment = (memberId: string) => {
        const updatedGroup = { ...group };
        const round = updatedGroup.rounds.find(r => r.roundNumber === activeRound);
        if (round) {
            const payment = round.payments.find(p => p.memberId === memberId);
            if (payment) {
                payment.status = payment.status === 'Paid' ? 'Unpaid' : 'Paid';
                onUpdateGroup(updatedGroup);
            }
        }
    };
    
    const canAdvance = roundData?.payments.every(p => p.status === 'Paid') && !roundData.payoutCompleted && roundData.payoutMemberId;
    
    const handlePayout = () => {
        if (!canAdvance || !roundData?.payoutMemberId) return;
        const updatedGroup = { ...group };
        
        const currentRoundIndex = updatedGroup.rounds.findIndex(r => r.roundNumber === activeRound);
        if(currentRoundIndex > -1){
            updatedGroup.rounds[currentRoundIndex].payoutCompleted = true;
            updatedGroup.payoutOrder.push(roundData.payoutMemberId); // Add to historical order

            const nextRound = activeRound + 1;
            if(nextRound <= updatedGroup.members.length){
                updatedGroup.currentRound = nextRound;
            } else {
                updatedGroup.status = 'Completed';
            }
            onUpdateGroup(updatedGroup);
            if(nextRound <= updatedGroup.members.length) setActiveRound(nextRound);
        }
    };

    const RecipientSelection = () => (
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Pilih Penerima untuk Pusingan {activeRound}</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">Pilih ahli yang akan menerima bayaran kutu untuk pusingan ini.</p>
            {eligibleMembers.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {eligibleMembers.map(member => (
                        <div key={member.id} className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                             <div>
                                <p className="font-semibold text-gray-800 dark:text-gray-100">{member.name}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{member.phone || 'Tiada No. Telefon'}</p>
                            </div>
                            <button 
                                onClick={() => handleSetRecipient(member.id)}
                                className="bg-green-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-600 transition text-sm"
                            >
                                Jadikan Penerima
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                 <p className="text-center text-gray-500 dark:text-gray-400 py-4">Semua ahli telah menerima bayaran.</p>
            )}
        </div>
    );

    const PaymentTracking = () => {
        if (!roundData) return null;

        const totalPaidCount = roundData.payments.filter(p => p.status === 'Paid').length;
        const totalCollected = totalPaidCount * group.contributionAmount;
        const totalPot = group.members.length * group.contributionAmount;
    
        return (
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6">
                <div className="md:flex justify-between items-center mb-6">
                    <div>
                       <p className="text-sm text-gray-500 dark:text-gray-400">Penerima Pusingan {activeRound}:</p>
                       <p className="text-xl font-bold text-gray-900 dark:text-white">{group.members.find(m => m.id === roundData.payoutMemberId)?.name}</p>
                       <p className="text-sm text-green-600 dark:text-green-400 font-semibold mt-1">
                           RM{totalCollected.toLocaleString()} / RM{totalPot.toLocaleString()} Terkumpul
                       </p>
                    </div>
                    <div className="mt-3 md:mt-0">
                        <span className={`text-sm font-semibold flex items-center ${roundData.payoutCompleted ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                            {roundData.payoutCompleted ? <CheckCircleIcon className="w-5 h-5 mr-2" /> : <XCircleIcon className="w-5 h-5 mr-2" />}
                            {roundData.payoutCompleted ? 'Bayaran Selesai' : 'Bayaran Belum Selesai'}
                        </span>
                    </div>
                </div>
    
                <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">Status Bayaran Ahli</h4>
                <div className="space-y-3">
                    {roundData.payments.map(payment => {
                        const member = group.members.find(m => m.id === payment.memberId);
                        return (
                            <div key={payment.memberId} className="flex justify-between items-center bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
                                <div>
                                  <p className="text-gray-700 dark:text-gray-200 font-medium">{member?.name}</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">{member?.phone || 'Tiada No. Telefon'}</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    {payment.status === 'Unpaid' && member?.phone && !roundData.payoutCompleted && group.status === 'Active' && (
                                        <button onClick={() => handleWhatsAppReminder(member, group)} className="p-2 rounded-full text-green-500 hover:bg-green-100 dark:hover:bg-gray-700 transition" aria-label={`Send WhatsApp reminder to ${member.name}`}>
                                            <WhatsAppIcon className="w-5 h-5" />
                                        </button>
                                    )}
                                    <button onClick={() => handlePayment(payment.memberId)}
                                        className={`flex items-center px-3 py-1 text-xs font-semibold rounded-full transition ${payment.status === 'Paid' ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'}`}
                                        disabled={roundData.payoutCompleted || group.status !== 'Active'}>
                                        {payment.status === 'Paid' ? <CheckCircleIcon className="w-4 h-4 mr-1.5"/> : <XCircleIcon className="w-4 h-4 mr-1.5"/>}
                                        {payment.status === 'Paid' ? 'Dibayar' : 'Belum Bayar'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
                
                {group.status === 'Active' && activeRound === group.currentRound && (
                     <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
                         <button onClick={handlePayout} disabled={!canAdvance}
                             className="w-full md:w-auto bg-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed dark:disabled:bg-gray-600">
                             {canAdvance ? `Sahkan Bayaran & Teruskan ke Pusingan ${activeRound + 1 > group.members.length ? 'Akhir' : activeRound + 1}` : 'Tunggu Semua Bayaran Selesai'}
                         </button>
                     </div>
                )}
            </div>
        );
    };

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-6">
            <button onClick={onBack} className="flex items-center text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white mb-6">
                <ArrowLeftIcon className="w-5 h-5 mr-2" />
                Kembali ke Dashboard
            </button>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8">
                <div className="md:flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-6 mb-6">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{group.name}</h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Sumbangan Bulanan: RM{group.contributionAmount}</p>
                    </div>
                     <div className="flex items-center space-x-4 mt-4 md:mt-0">
                         <span className={`px-4 py-2 text-sm font-semibold rounded-full ${group.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : (group.status === 'Completed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200')}`}>
                            Status: {group.status}
                        </span>
                        <button onClick={onGoToSettings} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                            <SettingsIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                        </button>
                    </div>
                </div>
                
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">Pusingan</h3>
                    <div className="flex space-x-2 overflow-x-auto pb-2">
                        {group.rounds.map(r => (
                            <button key={r.roundNumber} onClick={() => setActiveRound(r.roundNumber)}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition whitespace-nowrap ${activeRound === r.roundNumber ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                                Pusingan {r.roundNumber}
                            </button>
                        ))}
                    </div>
                </div>

                 {isRecipientSelectionPhase ? <RecipientSelection /> : <PaymentTracking />}
            </div>
        </div>
    );
};


interface GroupSettingsProps {
    group: Group;
    onBack: () => void;
    onUpdateGroup: (updatedGroup: Group) => void;
}

const GroupSettings: React.FC<GroupSettingsProps> = ({ group, onBack, onUpdateGroup }) => {
    const [members, setMembers] = useState<Member[]>(group.members);
    const [newMemberName, setNewMemberName] = useState('');
    const [newMemberPhone, setNewMemberPhone] = useState('');

    const handleAddMember = () => {
        if (!newMemberName.trim()) {
            alert("Sila masukkan nama ahli.");
            return;
        }
        if (window.confirm("Menambah ahli baru akan menetapkan semula kemajuan kumpulan kepada pusingan 1. Anda pasti?")) {
            const newMember: Member = {
                id: `m${Date.now()}`,
                name: newMemberName,
                phone: newMemberPhone,
            };
            const updatedGroup = resetGroupProgress({
                ...group,
                members: [...members, newMember]
            });
            onUpdateGroup(updatedGroup);
            setNewMemberName('');
            setNewMemberPhone('');
        }
    };

    const handleRemoveMember = (memberId: string) => {
        if (members.length <= 2) {
            alert("Kumpulan mesti mempunyai sekurang-kurangnya 2 ahli.");
            return;
        }
        if (window.confirm("Membuang ahli akan menetapkan semula kemajuan kumpulan kepada pusingan 1. Anda pasti?")) {
            const updatedMembers = members.filter(m => m.id !== memberId);
            const updatedGroup = resetGroupProgress({
                ...group,
                members: updatedMembers
            });
            onUpdateGroup(updatedGroup);
        }
    };
    
    const handleResetGroup = () => {
        if (window.confirm("Anda pasti ingin menetapkan semula kumpulan ini? Semua pusingan dan bayaran akan dimulakan semula.")) {
            onUpdateGroup(resetGroupProgress(group));
            alert("Kumpulan telah berjaya ditetapkan semula!");
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-6">
            <button onClick={onBack} className="flex items-center text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white mb-6">
                <ArrowLeftIcon className="w-5 h-5 mr-2" />
                Kembali ke Butiran Kumpulan
            </button>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-6 mb-6">Tetapan Kumpulan: {group.name}</h2>

                {/* Manage Members */}
                <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Urus Ahli ({members.length} orang)</h3>
                    <div className="space-y-3 mb-4">
                        {members.map(member => (
                            <div key={member.id} className="flex justify-between items-center bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                                <div>
                                    <p className="text-gray-800 dark:text-gray-100 font-medium">{member.name}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{member.phone || 'Tiada No. Telefon'}</p>
                                </div>
                                <button onClick={() => handleRemoveMember(member.id)} className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 text-red-500 transition">
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="bg-gray-100 dark:bg-gray-900/50 p-4 rounded-lg">
                        <h4 className="font-semibold mb-3 text-gray-800 dark:text-gray-100">Tambah Ahli Baru</h4>
                        <div className="flex flex-col md:flex-row gap-4">
                            <input type="text" placeholder="Nama Penuh" value={newMemberName} onChange={e => setNewMemberName(e.target.value)} className="flex-grow bg-white dark:bg-gray-800 rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                            <input type="text" placeholder="No. Telefon (cth: 60123456789)" value={newMemberPhone} onChange={e => setNewMemberPhone(e.target.value)} className="flex-grow bg-white dark:bg-gray-800 rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                            <button onClick={handleAddMember} className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition flex items-center justify-center">
                                <PlusIcon className="w-5 h-5 mr-2"/> Tambah
                            </button>
                        </div>
                    </div>
                </div>

                {/* Group Actions */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Tindakan Kumpulan</h3>
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                        <div className="flex flex-col md:flex-row justify-between items-center">
                            <div>
                                <h4 className="font-semibold text-gray-800 dark:text-gray-100">Tetapkan Semula Kumpulan</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-300">Mulakan semula semua pusingan dan bayaran. Berguna apabila kitaran telah selesai.</p>
                            </div>
                            <button onClick={handleResetGroup} disabled={group.status !== 'Completed'} className="mt-3 md:mt-0 w-full md:w-auto bg-yellow-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-yellow-600 transition disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center">
                                <RefreshCwIcon className="w-5 h-5 mr-2" /> Tetapkan Semula
                            </button>
                        </div>
                         {group.status !== 'Completed' && <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-2">Fungsi ini hanya tersedia selepas semua pusingan selesai.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};


interface DashboardProps {
    groups: Group[];
    onSelectGroup: (group: Group) => void;
    financialTip: string;
    isLoadingTip: boolean;
    onRefreshTip: () => void;
    onGoToReports: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ groups, onSelectGroup, financialTip, isLoadingTip, onRefreshTip, onGoToReports }) => (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <header className="mb-10">
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
                Pengurus Pinjaman <span className="text-blue-600 dark:text-blue-500">KutuPro</span>
            </h1>
            <p className="mt-4 text-xl text-gray-500 dark:text-gray-400">
                Urus, pantau dan laporkan pinjaman kutu anda dengan telus dan sistematik.
            </p>
        </header>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Kumpulan Aktif Anda</h2>
                    <button className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition">
                       + Cipta Kumpulan Baru
                    </button>
                </div>
                
                <div className="space-y-6">
                    {groups.map(group => (
                        <GroupCard key={group.id} group={group} onSelect={onSelectGroup} />
                    ))}
                </div>
            </div>

            <aside className="space-y-8">
                <div>
                    <h2 className="text-2xl font-bold mb-6">Ringkasan</h2>
                     <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600 dark:text-gray-300">Jumlah Kumpulan</span>
                                <span className="font-bold text-lg">{groups.length}</span>
                            </div>
                             <div className="flex justify-between items-center">
                                <span className="text-gray-600 dark:text-gray-300">Status Aktif</span>
                                <span className="font-bold text-lg text-green-500">{groups.filter(g => g.status === 'Active').length}</span>
                            </div>
                             <div className="flex justify-between items-center">
                                <span className="text-gray-600 dark:text-gray-300">Telah Selesai</span>
                                <span className="font-bold text-lg text-blue-500">{groups.filter(g => g.status === 'Completed').length}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div>
                   <FinancialTipCard tip={financialTip} isLoading={isLoadingTip} onRefresh={onRefreshTip} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold mb-6">Laporan</h2>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 space-y-3">
                        <button onClick={onGoToReports} className="w-full text-left font-semibold text-blue-600 dark:text-blue-400 hover:underline">Sejarah Pembayaran</button>
                        <button onClick={onGoToReports} className="w-full text-left font-semibold text-blue-600 dark:text-blue-400 hover:underline">Prestasi Kumpulan</button>
                        <button onClick={onGoToReports} className="w-full text-left font-semibold text-blue-600 dark:text-blue-400 hover:underline">Lihat Laporan Penuh</button>
                    </div>
                </div>
            </aside>
        </div>
    </main>
);

interface ReportsPageProps {
    groups: Group[];
    onBack: () => void;
}

const ReportsPage: React.FC<ReportsPageProps> = ({ groups, onBack }) => {
    
    const paymentHistory = useMemo(() => {
        return groups.flatMap(group => 
            group.rounds.flatMap(round => {
                if (!round.payoutMemberId) return [];
                const recipient = group.members.find(m => m.id === round.payoutMemberId);
                return round.payments.map(payment => {
                    const payer = group.members.find(m => m.id === payment.memberId);
                    return {
                        id: `${group.id}-${round.roundNumber}-${payment.memberId}`,
                        groupName: group.name,
                        roundNumber: round.roundNumber,
                        payerName: payer?.name || 'N/A',
                        recipientName: recipient?.name || 'N/A',
                        amount: group.contributionAmount,
                        status: payment.status,
                        isSelfPayment: payer?.id === recipient?.id,
                    };
                }).filter(p => !p.isSelfPayment);
            })
        );
    }, [groups]);

    const stats = useMemo(() => {
        const totalMembers = groups.reduce((acc, group) => acc + group.members.length, 0);
        const totalValuePaid = paymentHistory
            .filter(p => p.status === 'Paid')
            .reduce((acc, p) => acc + p.amount, 0);
        return {
            totalGroups: groups.length,
            totalMembers,
            totalValuePaid
        };
    }, [groups, paymentHistory]);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8">
            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .printable-area, .printable-area * {
                        visibility: visible;
                    }
                    .printable-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                    .no-print {
                        display: none;
                    }
                }
            `}</style>
            <div className="no-print">
                <button onClick={onBack} className="flex items-center text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white mb-6">
                    <ArrowLeftIcon className="w-5 h-5 mr-2" />
                    Kembali ke Dashboard
                </button>
            </div>
            
            <div className="printable-area">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Laporan Prestasi & Sejarah</h1>
                    <button onClick={handlePrint} className="no-print flex items-center bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition">
                        <PrinterIcon className="w-5 h-5 mr-2"/> Cetak Laporan
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                        <h3 className="text-gray-500 dark:text-gray-400">Jumlah Kumpulan</h3>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.totalGroups}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                        <h3 className="text-gray-500 dark:text-gray-400">Jumlah Ahli</h3>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.totalMembers}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                        <h3 className="text-gray-500 dark:text-gray-400">Jumlah Transaksi (Dibayar)</h3>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">RM{stats.totalValuePaid.toLocaleString()}</p>
                    </div>
                </div>

                <div className="mb-10">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Prestasi Kumpulan</h2>
                    <div className="space-y-4">
                        {groups.map(group => {
                            const completedRounds = group.rounds.filter(r => r.payoutCompleted).length;
                            const progress = (completedRounds / group.members.length) * 100;
                            return (
                                <div key={group.id} className="bg-white dark:bg-gray-800 rounded-xl shadow p-5">
                                    <div className="flex justify-between items-center">
                                        <p className="font-bold text-lg text-gray-800 dark:text-white">{group.name}</p>
                                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${group.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'}`}>{group.status}</span>
                                    </div>
                                    <div className="mt-4">
                                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-1">
                                            <span>Kemajuan</span>
                                            <span>Pusingan {completedRounds}/{group.members.length}</span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Sejarah Terperinci Pembayaran</h2>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                    <tr>
                                        <th scope="col" className="px-6 py-3">Kumpulan</th>
                                        <th scope="col" className="px-6 py-3 text-center">Pusingan</th>
                                        <th scope="col" className="px-6 py-3">Pembayar</th>
                                        <th scope="col" className="px-6 py-3">Penerima</th>
                                        <th scope="col" className="px-6 py-3 text-right">Jumlah</th>
                                        <th scope="col" className="px-6 py-3 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paymentHistory.map(p => (
                                        <tr key={p.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
                                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">{p.groupName}</td>
                                            <td className="px-6 py-4 text-center">{p.roundNumber}</td>
                                            <td className="px-6 py-4">{p.payerName}</td>
                                            <td className="px-6 py-4">{p.recipientName}</td>
                                            <td className="px-6 py-4 text-right">RM{p.amount.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${p.status === 'Paid' ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'}`}>
                                                    {p.status === 'Paid' ? 'Dibayar' : 'Belum Bayar'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {paymentHistory.length === 0 && (
                                        <tr><td colSpan={6} className="text-center py-6">Tiada sejarah pembayaran untuk dipaparkan.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- MAIN APP COMPONENT ---

type View = 'dashboard' | 'detail' | 'settings' | 'reports';

export default function App() {
    const [groups, setGroups] = useState<Group[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
    const [view, setView] = useState<View>('dashboard');
    const [financialTip, setFinancialTip] = useState<string>('');
    const [isLoadingTip, setIsLoadingTip] = useState<boolean>(true);

    const fetchTip = useCallback(async () => {
        setIsLoadingTip(true);
        const tip = await getFinancialTip();
        setFinancialTip(tip);
        setIsLoadingTip(false);
    }, []);

    useEffect(() => {
        setGroups(createInitialData());
        fetchTip();
    }, [fetchTip]);

    const handleUpdateGroup = (updatedGroup: Group) => {
        setGroups(prevGroups => prevGroups.map(g => g.id === updatedGroup.id ? updatedGroup : g));
        if (selectedGroup?.id === updatedGroup.id) {
            setSelectedGroup(updatedGroup);
        }
    };
    
    const handleSelectGroup = (group: Group) => {
        setSelectedGroup(group);
        setView('detail');
    };

    const handleBackToDashboard = () => {
        setSelectedGroup(null);
        setView('dashboard');
    };
    
    const handleGoToReports = () => {
        setView('reports');
    };
    
    const handleBackToDetail = () => {
        setView('detail');
    }

    const renderContent = () => {
        if (view === 'reports') {
            return <ReportsPage groups={groups} onBack={handleBackToDashboard} />;
        }
        
        if (view === 'settings' && selectedGroup) {
            return <GroupSettings group={selectedGroup} onBack={handleBackToDetail} onUpdateGroup={handleUpdateGroup} />;
        }
        
        if (view === 'detail' && selectedGroup) {
            return <GroupDetail group={selectedGroup} onBack={handleBackToDashboard} onUpdateGroup={handleUpdateGroup} onGoToSettings={() => setView('settings')} />;
        }
        
        return <Dashboard groups={groups} onSelectGroup={handleSelectGroup} financialTip={financialTip} isLoadingTip={isLoadingTip} onRefreshTip={fetchTip} onGoToReports={handleGoToReports} />;
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            {renderContent()}
        </div>
    );
}


export interface Member {
  id: string;
  name: string;
  phone?: string;
}

export interface Payment {
  memberId: string;
  status: 'Paid' | 'Unpaid';
}

export interface Round {
  roundNumber: number;
  payoutMemberId: string | null;
  payments: Payment[];
  payoutCompleted: boolean;
}

export type Frequency = 'Daily' | 'Weekly' | 'Monthly';

export interface Group {
  id: string;
  name: string;
  contributionAmount: number;
  payoutFrequency: Frequency;
  paymentFrequency: Frequency;
  members: Member[];
  payoutOrder: string[];
  currentRound: number;
  status: 'Pending' | 'Active' | 'Completed';
  rounds: Round[];
}

import { db } from '../firebase/config';
import { collection, onSnapshot, query, orderBy, addDoc, Timestamp } from 'firebase/firestore';

export interface SavingsTransaction {
  id?: string;
  type: 'deposit' | 'withdrawal' | 'to_vault' | 'from_vault';
  amount: number;
  label: string;
  date: Timestamp;
  vaultId?: string; // Solo si va o viene de una hucha
}

export const SavingsService = {
  // Nos suscribimos a todos los movimientos históricos de ahorro
  subscribeToSavings: (userId: string, callback: (data: { available: number, inVaults: number, transactions: SavingsTransaction[] }) => void) => {
    const transRef = collection(db, `users/${userId}/savings_transactions`);
    const q = query(transRef, orderBy('date', 'desc'));

    return onSnapshot(q, (snap) => {
      const transactions = snap.docs.map(d => ({ id: d.id, ...d.data() } as SavingsTransaction));
      
      let available = 0;
      let inVaults = 0;

      // Calculamos los totales recorriendo el historial
      transactions.forEach(t => {
        if (t.type === 'deposit') available += t.amount;
        if (t.type === 'withdrawal') available -= t.amount;
        
        if (t.type === 'to_vault') {
          available -= t.amount;
          inVaults += t.amount;
        }
        if (t.type === 'from_vault') {
          available += t.amount;
          inVaults -= t.amount;
        }
      });

      callback({ available, inVaults, transactions });
    }, (error) => {
      console.error("Error al cargar ahorros:", error);
    });
  },

  // Función para registrar un movimiento
  addSavingsTransaction: async (userId: string, data: Omit<SavingsTransaction, 'id' | 'date'>) => {
    const transRef = collection(db, `users/${userId}/savings_transactions`);
    await addDoc(transRef, {
      ...data,
      date: Timestamp.now()
    });
  },

  subscribeToVaults: (userId: string, callback: (vaults: any[]) => void) => {
    const vaultsRef = collection(db, `users/${userId}/vaults`);
    const q = query(vaultsRef, orderBy('createdAt', 'asc'));
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  },

  addVault: async (userId: string, data: any) => {
    const vaultsRef = collection(db, `users/${userId}/vaults`);
    await addDoc(vaultsRef, {
      ...data,
      createdAt: Timestamp.now()
    });
  },

  deleteVault: async (userId: string, vaultId: string) => {
    const vaultRef = doc(db, `users/${userId}/vaults/${vaultId}`);
    await deleteDoc(vaultRef);
  }
};

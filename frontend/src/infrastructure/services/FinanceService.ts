import { db } from '../firebase/config';
import { doc, collection, onSnapshot, setDoc, addDoc, updateDoc, deleteDoc, query, orderBy, Timestamp } from 'firebase/firestore';

export const FinanceService = {
  subscribeToMonthData: (userId: string, monthId: string, callback: (data: any) => void) => {
    const monthRef = doc(db, `users/${userId}/finance_months/${monthId}`);
    const transRef = collection(db, `users/${userId}/finance_months/${monthId}/transactions`);
    const q = query(transRef, orderBy('date', 'desc'));
 
    let currentBudget = 0;
    let currentTransactions: any[] = [];
    let monthLoaded = false;
    let transLoaded = false;

    const checkAndCallback = () => {
      if (monthLoaded && transLoaded) {
        callback({ budget: currentBudget, transactions: currentTransactions });
      }
    };

    const unsubMonth = onSnapshot(monthRef, 
      (snap) => {
        currentBudget = snap.exists() ? snap.data().budget : 0;
        monthLoaded = true;
        checkAndCallback();
      }, 
      (error) => {
        console.error("Error al cargar el presupuesto:", error);
        monthLoaded = true; checkAndCallback();
      }
    );

    const unsubTrans = onSnapshot(q, 
      (snap) => {
        currentTransactions = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        transLoaded = true;
        checkAndCallback();
      }, 
      (error) => {
        console.error("Error al cargar transacciones:", error);
        transLoaded = true; checkAndCallback();
      }
    );

    return () => {
      unsubMonth();
      unsubTrans();
    };
  },

  updateBudget: async (userId: string, monthId: string, amount: number) => {
    const monthRef = doc(db, `users/${userId}/finance_months/${monthId}`);
    await setDoc(monthRef, { budget: amount }, { merge: true });
  },

  addTransaction: async (userId: string, monthId: string, data: any) => {
    const transRef = collection(db, `users/${userId}/finance_months/${monthId}/transactions`);
    await addDoc(transRef, {
      ...data,
      date: Timestamp.now()
    });
  },

  updateTransaction: async (userId: string, monthId: string, transactionId: string, data: any) => {
    const transRef = doc(db, `users/${userId}/finance_months/${monthId}/transactions/${transactionId}`);
    await updateDoc(transRef, data);
  },

  deleteTransaction: async (userId: string, monthId: string, transactionId: string) => {
    const transRef = doc(db, `users/${userId}/finance_months/${monthId}/transactions/${transactionId}`);
    await deleteDoc(transRef);
  }
};

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
    const newDoc = await addDoc(transRef, {
      ...data,
      date: Timestamp.now()
    });

    if (data.type === 'transfer' && data.category === 'Ahorro') {
      const savingsRef = doc(db, `users/${userId}/savings_transactions/${newDoc.id}`);
      await setDoc(savingsRef, {
        type: 'deposit',
        amount: data.amount,
        label: data.label || 'Desde Día a Día',
        date: Timestamp.now()
      });
    }
  },

  updateTransaction: async (userId: string, monthId: string, transactionId: string, data: any) => {
    const transRef = doc(db, `users/${userId}/finance_months/${monthId}/transactions/${transactionId}`);
    await updateDoc(transRef, data);

    const savingsRef = doc(db, `users/${userId}/savings_transactions/${transactionId}`);
    if (data.type === 'transfer' && data.category === 'Ahorro') {
      await setDoc(savingsRef, {
        type: 'deposit',
        amount: data.amount,
        label: data.label || 'Desde Día a Día'
      }, { merge: true });
    } else {
      try { await deleteDoc(savingsRef); } catch (e) {}
    }
  },

  deleteTransaction: async (userId: string, monthId: string, transactionId: string) => {
    const transRef = doc(db, `users/${userId}/finance_months/${monthId}/transactions/${transactionId}`);
    await deleteDoc(transRef);

    const savingsRef = doc(db, `users/${userId}/savings_transactions/${transactionId}`);
    try { await deleteDoc(savingsRef); } catch (e) {}
  }
};

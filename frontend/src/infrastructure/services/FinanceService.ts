import { db } from '../firebase/config';
import { doc, collection, onSnapshot, setDoc, addDoc, updateDoc, deleteDoc, query, orderBy, Timestamp, getDocs } from 'firebase/firestore';

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

  getCarryOverBalance: async (userId: string, currentMonthId: string): Promise<number> => {
    try {
      const monthsRef = collection(db, `users/${userId}/finance_months`);
      const monthsSnap = await getDocs(monthsRef);
      
      let totalCarryOver = 0;
      
      for (const monthDoc of monthsSnap.docs) {
        const mId = monthDoc.id; 
        
        if (mId < currentMonthId) {
          const transRef = collection(db, `users/${userId}/finance_months/${mId}/transactions`);
          const transSnap = await getDocs(transRef);
          
          transSnap.docs.forEach(d => {
            const t = d.data();
            if (t.type === 'income') totalCarryOver += t.amount;
            if (t.type === 'savings_return') totalCarryOver += t.amount;
            if (t.type === 'expense' || t.type === 'other_expense') totalCarryOver -= t.amount;
            if (t.type === 'transfer') totalCarryOver -= t.amount;
          });
        }
      }
      return totalCarryOver;
    } catch (error) {
      console.error("Error al calcular el balance acumulado histórico:", error);
      return 0;
    }
  },

  updateBudget: async (userId: string, monthId: string, amount: number) => {
    const monthRef = doc(db, `users/${userId}/finance_months/${monthId}`);
    await setDoc(monthRef, { budget: amount }, { merge: true });
  },

  addTransaction: async (userId: string, monthId: string, data: any) => {
    // MAGIA ANTI-FANTASMAS: Aseguramos que la carpeta del mes exista siempre
    const monthRef = doc(db, `users/${userId}/finance_months/${monthId}`);
    await setDoc(monthRef, {}, { merge: true });

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
    // Nos aseguramos también al editar, por si editas una transacción que estaba en un mes fantasma
    const monthRef = doc(db, `users/${userId}/finance_months/${monthId}`);
    await setDoc(monthRef, {}, { merge: true });

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

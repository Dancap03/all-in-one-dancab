import { db } from '../firebase/config';
import { doc, collection, onSnapshot, setDoc, addDoc, query, orderBy, Timestamp, deleteDoc, updateDoc } from 'firebase/firestore';

export const FinanceService = {
  subscribeToMonthData: (userId: string, monthId: string, callback: (data: any) => void) => {
    const monthRef = doc(db, `users/${userId}/finance_months/${monthId}`);
    const transRef = collection(db, `users/${userId}/finance_months/${monthId}/transactions`);
    const q = query(transRef, orderBy('date', 'desc'));

    let currentBudget = 0;
    let currentTransactions: any[] = [];
    let monthLoaded = false;
    let transLoaded = false;

    // Función que comprueba si ambas peticiones ya han contestado
    const checkAndCallback = () => {
      if (monthLoaded && transLoaded) {
        callback({ budget: currentBudget, transactions: currentTransactions });
      }
    };

    // Escuchar el documento del mes (para el presupuesto)
    const unsubMonth = onSnapshot(monthRef, 
      (snap) => {
        currentBudget = snap.exists() ? snap.data().budget : 0;
        monthLoaded = true;
        checkAndCallback();
      }, 
      (error) => {
        console.error("Error al cargar el presupuesto:", error);
        // Si hay error, forzamos a que deje de cargar devolviendo lo que tenga
        monthLoaded = true; checkAndCallback();
      }
    );

    // Escuchar la colección de transacciones (ingresos y gastos)
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

    // Al desmontar el componente, cancelamos ambas suscripciones a la vez
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
  // ... (después de addTransaction)

  updateTransaction: async (userId: string, monthId: string, transactionId: string, data: any) => {
    const transRef = doc(db, `users/${userId}/finance_months/${monthId}/transactions/${transactionId}`);
    await updateDoc(transRef, data);
  },

  deleteTransaction: async (userId: string, monthId: string, transactionId: string) => {
    const transRef = doc(db, `users/${userId}/finance_months/${monthId}/transactions/${transactionId}`);
    await deleteDoc(transRef);
  }
};
};

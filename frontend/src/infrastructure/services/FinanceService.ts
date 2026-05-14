import { db } from '../firebase/config';
import { doc, collection, onSnapshot, setDoc, addDoc, query, orderBy, Timestamp } from 'firebase/firestore';

export const FinanceService = {
  // Escuchar cambios en el presupuesto y transacciones del mes
  subscribeToMonthData: (userId: string, monthId: string, callback: (data: any) => void) => {
    const monthRef = doc(db, `users/${userId}/finance_months/${monthId}`);
    const transRef = collection(db, `users/${userId}/finance_months/${monthId}/transactions`);
    const q = query(transRef, orderBy('date', 'desc'));

    // Suscripción en tiempo real
    return onSnapshot(monthRef, (monthSnap) => {
      onSnapshot(q, (transSnap) => {
        const transactions = transSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        callback({
          budget: monthSnap.exists() ? monthSnap.data().budget : 0,
          transactions
        });
      });
    });
  },

  // Guardar nuevo presupuesto
  updateBudget: async (userId: string, monthId: string, amount: number) => {
    const monthRef = doc(db, `users/${userId}/finance_months/${monthId}`);
    await setDoc(monthRef, { budget: amount }, { merge: true });
  },

  // Añadir ingreso o gasto
  addTransaction: async (userId: string, monthId: string, data: any) => {
    const transRef = collection(db, `users/${userId}/finance_months/${monthId}/transactions`);
    await addDoc(transRef, {
      ...data,
      date: Timestamp.now()
    });
  }
};

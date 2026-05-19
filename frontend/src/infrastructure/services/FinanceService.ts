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
        currentBudget = snap.exists() && snap.data().budget ? Number(snap.data().budget) : 0;
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
        currentTransactions = snap.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            amount: Number(data.amount) || 0 
          };
        });
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
            const amt = Number(t.amount) || 0;
            if (t.type === 'income') totalCarryOver += amt;
            if (t.type === 'savings_return') totalCarryOver += amt;
            if (t.type === 'expense' || t.type === 'other_expense') totalCarryOver -= amt;
            if (t.type === 'transfer') totalCarryOver -= amt;
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
  },

  // MOTOR DE GEMINI DIRECTO EN EL FRONTEND CON GOOGLE SEARCH
  analyzeAssetWithAI: async (assetName: string, apiKey: string) => {
    if (!apiKey) {
      throw new Error("Falta la API Key de Gemini en los Secrets de GitHub.");
    }
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: `Eres un analista financiero experto. Analiza el siguiente activo financiero: "${assetName}".
      
      REGLA DE ORO DE CONVERSIÓN:
      El usuario opera desde Europa utilizando el broker Trade Republic. Por tanto, TODOS los precios que devuelvas 
      deben estar OBLIGATORIAMENTE en EUROS (EUR). 
      Si el activo es americano (ej. Apple, Intel) y cotiza en USD en el NASDAQ/NYSE, busca su cotización actual en 
      mercados europeos (como Tradegate, Lang & Schwarz o Xetra) en EUROS. Si no encuentras la cotización directa en EUR, 
      busca el precio en USD, busca el tipo de cambio USD a EUR en tiempo real, y haz la conversión matemática antes de responder.
      
      Devuelve ÚNICAMENTE un objeto JSON válido con la siguiente estructura exacta:
      {
        "name": "Nombre completo de la empresa o ETF",
        "ticker": "Ticker oficial de bolsa (ej. AAPL, VUSA.AS)",
        "currentPrice": número con el precio actual ESTRICTAMENTE EN EUROS (usa punto para decimales, haz la conversión obligatoria),
        "currency": "EUR",
        "assetClass": "Acción, ETF, Criptomoneda, o Bono",
        "region": "Norteamérica, Europa, Mercados Emergentes, Global, o Cripto",
        "country": "País principal",
        "sector": "Sector principal",
        "dividendYield": "Porcentaje de dividendo anual o '0%'",
        "nextDividendDate": "Fecha estimada del próximo dividendo o 'N/A'"
      }`,
      config: {
        tools: [{ googleSearch: {} }], // ENCIENDE GOOGLE SEARCH EN TIEMPO REAL
        temperature: 0.1,
      }
    });

    const aiText = response.text || "{}";
    const jsonString = aiText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(jsonString);
  }
};

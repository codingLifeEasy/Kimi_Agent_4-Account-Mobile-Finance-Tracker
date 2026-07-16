import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, orderBy, writeBatch, getDocs, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import type { Transaction } from '@/types';

// Global user state hook
export function useAuth() {
  const [user, setUser] = useState<User | null | undefined>(undefined); // undefined = loading
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);
  return user;
}

// Subscribe to Firestore transactions
export function useTransactions(): Transaction[] {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const user = useAuth();

  useEffect(() => {
    if (!user) {
      setTransactions([]);
      return;
    }

    const q = query(
      collection(db, `users/${user.uid}/transactions`),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const txs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          // Convert Firestore Timestamp to number for our app
          createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now()
        } as Transaction;
      });
      setTransactions(txs);
    }, (error) => {
      console.error("Firestore sync error:", error);
      alert("Error syncing data: " + error.message);
    });

    return () => unsubscribe();
  }, [user]);

  return transactions;
}

export const txStore = {
  async add(t: Omit<Transaction, 'id' | 'createdAt'>) {
    if (!auth.currentUser) throw new Error("Must be logged in");
    
    const txData = {
      ...t,
      createdAt: serverTimestamp(),
    };
    
    await addDoc(collection(db, `users/${auth.currentUser.uid}/transactions`), txData);
  },
  async remove(id: string) {
    if (!auth.currentUser) return;
    await deleteDoc(doc(db, `users/${auth.currentUser.uid}/transactions`, id));
  },
  async clearAll() {
    if (!auth.currentUser) return;
    const q = query(collection(db, `users/${auth.currentUser.uid}/transactions`));
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  },
};

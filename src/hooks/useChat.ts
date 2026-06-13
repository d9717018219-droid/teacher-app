import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  getDoc,
  serverTimestamp, 
  setDoc,
  getDocs,
  limit
} from 'firebase/firestore';
import { db } from '../firebase';
import { ConnectionRequest, ChatMessage } from '../types';

export const useChat = (userId: string | null) => {
  const [connections, setConnections] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Listen to active connections (accepted)
  useEffect(() => {
    if (!userId) {
      setConnections([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'connections'),
      where('members', 'array-contains', userId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ConnectionRequest));
      
      // Deduplicate connections (in case of legacy duplicate data)
      const uniqueDocs = Array.from(new Map(docs.map(item => [item.parentId + '-' + item.tutorId, item])).values());

      // Sort in memory to avoid needing a composite index
      uniqueDocs.sort((a, b) => {
        const timeA = a.updatedAt?.toDate ? a.updatedAt.toDate().getTime() : 0;
        const timeB = b.updatedAt?.toDate ? b.updatedAt.toDate().getTime() : 0;
        return timeB - timeA;
      });
      setConnections(uniqueDocs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const sendInterest = async (
    parent: { id: string, name: string, city: string }, 
    tutor: { id: string, name: string },
    senderType: 'parent' | 'teacher' = 'parent'
  ) => {
    if (!parent.id || !tutor.id || tutor.id === 'N/A') return;

    // Check if connection already exists
    const q = query(
      collection(db, 'connections'),
      where('parentId', '==', parent.id),
      where('tutorId', '==', tutor.id)
    );
    const existing = await getDocs(q);
    
    let connectionId;

    if (!existing.empty) {
      // Re-trigger interest if it was already pending or rejected
      const existingDoc = existing.docs[0];
      connectionId = existingDoc.id;
      await updateDoc(doc(db, 'connections', connectionId), {
        status: 'pending',
        updatedAt: serverTimestamp(),
        lastMessage: senderType === 'parent' ? 'Parent sent a connection request' : 'Tutor applied for job',
        lastMessageTime: serverTimestamp()
      });
    } else {
      const docRef = await addDoc(collection(db, 'connections'), {
        parentId: parent.id,
        tutorId: tutor.id,
        parentName: parent.name,
        tutorName: tutor.name,
        status: 'pending',
        members: [parent.id, tutor.id],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastMessage: senderType === 'parent' ? 'Parent sent a connection request' : 'Tutor applied for job',
        lastMessageTime: serverTimestamp()
      });
      connectionId = docRef.id;
    }

    // Add first message to the chat room
    const senderId = senderType === 'parent' ? parent.id : tutor.id;
    const messageText = senderType === 'parent' 
      ? `Hi ${tutor.name}, I am interested in your profile. Let's discuss further!`
      : `Hi, I am interested in your job posting (Order ID: #${parent.id}). Let's discuss further!`;

    await addDoc(collection(db, `connections/${connectionId}/messages`), {
      senderId: senderId,
      text: messageText,
      timestamp: serverTimestamp(),
      read: false,
      isSystem: false
    });

    // Create a simplified alert for the receiver (just for push/badge notification)
    const targetId = senderType === 'parent' ? tutor.id : parent.id;
    const targetEmail = (targetId.includes('@') || isNaN(Number(targetId))) ? targetId : 'all';
    const targetTutorId = targetEmail === 'all' ? targetId : 'all';

    await addDoc(collection(db, 'alerts'), {
      message: `💬 New Message Request from ${senderType === 'parent' ? parent.name : tutor.name}! Check your Messages tab.`,
      type: 'interest',
      targetUserType: senderType === 'parent' ? 'teacher' : 'parent',
      targetTutorId: targetTutorId,
      targetEmail: targetEmail,
      city: 'all',
      sender: senderType === 'parent' ? parent.name : tutor.name,
      timestamp: serverTimestamp(),
      connectionId: connectionId
    });
  };

  const handleConnection = async (connectionId: string, status: 'accepted' | 'rejected' | 'blocked') => {
    const ref = doc(db, 'connections', connectionId);
    await updateDoc(ref, { 
      status, 
      updatedAt: serverTimestamp() 
    });

    if (status === 'accepted') {
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        // Send alert to Parent
        await addDoc(collection(db, 'alerts'), {
          message: `✅ ${data.tutorName} accepted your interest! You can now chat.`,
          type: 'success',
          targetUserType: 'parent',
          targetEmail: data.parentId, // Assuming parentId is email or uid
          city: 'all',
          sender: 'System',
          timestamp: serverTimestamp()
        });
      }
    }
  };

  const reportUser = async (connection: ConnectionRequest, reporterId: string, reason: string = 'Inappropriate behavior') => {
    const reportedId = reporterId === connection.parentId ? connection.tutorId : connection.parentId;
    const reportedName = reporterId === connection.parentId ? connection.tutorName : connection.parentName;
    const reporterName = reporterId === connection.parentId ? connection.parentName : connection.tutorName;

    await addDoc(collection(db, 'reports'), {
      connectionId: connection.id,
      reporterId,
      reporterName,
      reportedId,
      reportedName,
      reason,
      status: 'pending',
      timestamp: serverTimestamp()
    });

    // Also send an alert to Admin (optional but good for visibility)
    await addDoc(collection(db, 'alerts'), {
      message: `🚩 REPORT: ${reporterName} reported ${reportedName} in chat.`,
      type: 'urgent',
      targetUserType: 'admin',
      targetEmail: 'all',
      city: 'all',
      sender: 'Security System',
      timestamp: serverTimestamp()
    });
  };

  return { connections, loading, sendInterest, handleConnection, reportUser };
};

export const useMessages = (connectionId: string | null) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!connectionId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, `connections/${connectionId}/messages`),
      orderBy('timestamp', 'asc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage));
      setMessages(docs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [connectionId]);

  const sendMessage = async (text: string, senderId: string) => {
    if (!connectionId || !text.trim()) return;

    await addDoc(collection(db, `connections/${connectionId}/messages`), {
      senderId,
      text: text.trim(),
      timestamp: serverTimestamp(),
      read: false
    });

    await updateDoc(doc(db, 'connections', connectionId), {
      lastMessage: text.trim(),
      lastMessageTime: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  };

  return { messages, loading, sendMessage };
};

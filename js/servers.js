import { db, auth } from './firebase-config.js';
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  increment,
  arrayUnion,
  arrayRemove
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

/**
 * Добавление нового сервера в Firestore
 * @param {Object} serverData - данные сервера (name, ip, port, description, version)
 * @returns {Promise<string>} ID созданного документа
 */
export async function addServer(serverData) {
  const user = auth.currentUser;
  if (!user) throw new Error('Необходимо авторизоваться');

  const newServer = {
    ...serverData,
    ownerId: user.uid,
    ownerEmail: user.email,
    createdAt: new Date(),
    votes: 0,
    voters: [],
    verified: false // можно использовать для админки
  };
  const docRef = await addDoc(collection(db, 'servers'), newServer);
  return docRef.id;
}

/**
 * Получение списка серверов
 * @param {string|null} filterUserId - если указан, возвращает только серверы этого пользователя
 * @returns {Promise<Array>} массив серверов (с id)
 */
export async function getServers(filterUserId = null) {
  let q = collection(db, 'servers');
  if (filterUserId) {
    q = query(q, where('ownerId', '==', filterUserId));
  }
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Получение одного сервера по ID
 * @param {string} serverId
 * @returns {Promise<Object|null>} объект сервера или null
 */
export async function getServerById(serverId) {
  const docRef = doc(db, 'servers', serverId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

/**
 * Обновление данных сервера
 * @param {string} serverId
 * @param {Object} updatedData - поля для обновления
 * @param {string} ownerId - ID владельца для проверки прав
 */
export async function updateServer(serverId, updatedData, ownerId) {
  const user = auth.currentUser;
  if (!user) throw new Error('Не авторизован');

  // Проверка прав (владелец или админ)
  const serverRef = doc(db, 'servers', serverId);
  const serverSnap = await getDoc(serverRef);
  if (!serverSnap.exists()) throw new Error('Сервер не найден');
  const server = serverSnap.data();

  // Проверка на админа (опционально)
  // const isAdmin = await checkIfAdmin(user.uid);
  if (server.ownerId !== user.uid) {
    throw new Error('Нет прав на редактирование');
  }

  // Убираем неизменяемые поля, если они случайно переданы
  const { ownerId: _, voters: __, votes: ___, createdAt: ____, ...safeData } = updatedData;

  await updateDoc(serverRef, safeData);
}

/**
 * Удаление сервера (только владелец)
 * @param {string} serverId
 * @param {string} ownerId - ID владельца (для проверки)
 */
export async function deleteServer(serverId, ownerId) {
  const user = auth.currentUser;
  if (!user) throw new Error('Не авторизован');

  if (user.uid !== ownerId) {
    // Здесь можно добавить проверку на админа
    throw new Error('Нет прав на удаление');
  }
  await deleteDoc(doc(db, 'servers', serverId));
}

/**
 * Голосование за сервер (добавить/убрать голос)
 * @param {string} serverId
 * @param {Object} serverData - текущие данные сервера (нужны для проверки, голосовал ли пользователь)
 * @returns {Promise<boolean>} true - голос добавлен, false - убран
 */
export async function voteServer(serverId, serverData) {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Войдите, чтобы голосовать');
  }

  const serverRef = doc(db, 'servers', serverId);
  const hasVoted = serverData.voters?.includes(user.uid);

  if (hasVoted) {
    // Убрать голос
    await updateDoc(serverRef, {
      votes: increment(-1),
      voters: arrayRemove(user.uid)
    });
    return false; // голос убран
  } else {
    // Добавить голос
    await updateDoc(serverRef, {
      votes: increment(1),
      voters: arrayUnion(user.uid)
    });
    return true; // голос добавлен
  }
}

/**
 * Проверка, является ли пользователь администратором
 * @param {string} uid
 * @returns {Promise<boolean>}
 */
export async function checkIfAdmin(uid) {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    return userSnap.exists() && userSnap.data().isAdmin === true;
  } catch {
    return false;
  }
}

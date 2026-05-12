importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBDcug_xiTTGc6fkb3So3DBMw99e7rEfDk",
  authDomain: "gen-lang-client-0533512936.firebaseapp.com",
  projectId: "gen-lang-client-0533512936",
  storageBucket: "gen-lang-client-0533512936.firebasestorage.app",
  messagingSenderId: "503686229174",
  appId: "1:503686229174:web:bbe0957d75035e9b820a17"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icons/student.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

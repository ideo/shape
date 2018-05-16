import firebase from 'firebase'
import 'firebase/firestore'

firebase.initializeApp({
  apiKey: process.env.GOOGLE_CLOUD_BROWSER_KEY,
  projectId: process.env.GOOGLE_CLOUD_PROJECT,
})

const db = firebase.firestore()
db.collection('collections').doc('1')
  .onSnapshot(doc => {
    console.log(doc.data())
  })

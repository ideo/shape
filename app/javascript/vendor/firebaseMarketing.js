// javascript/vendor/firebaseMarketing.js
import firebase from 'firebase'

require('firebase/firestore')

const config = {
  apiKey: 'AIzaSyBPOo4mXov0P41asNqoBtbxfd6xYBJeYA8',
  authDomain: 'shape-marketing.firebaseapp.com',
  databaseURL: 'https://shape-marketing.firebaseio.com',
  projectId: 'shape-marketing',
  storageBucket: 'shape-marketing.appspot.com',
  messagingSenderId: '386968419386'
}

firebase.initializeApp(config)
let db = {}
db = firebase.firestore()
db.settings({
  // recommending setting for Firestore 5.0+
  timestampsInSnapshots: true
})

export default firebase

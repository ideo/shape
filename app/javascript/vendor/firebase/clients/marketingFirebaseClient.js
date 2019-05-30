import firebase from 'firebase/app'
import 'firebase/auth'
import 'firebase/firestore'

let db = {}
if (process.env.GOOGLE_FIRESTORE_SHAPE_MARKETING) {
  const config = JSON.parse(process.env.GOOGLE_FIRESTORE_SHAPE_MARKETING)
  firebase.initializeApp(config)
  db = firebase.firestore()
  db.settings({
    // recommending setting for Firestore 5.0+
    timestampsInSnapshots: true,
  })
}

export class MarketingFirebaseClient {
  constructor() {}

  async getCollection(collection) {
    const querySnapshot = await db.collection(collection).get()
    const data = {}
    querySnapshot.forEach(doc => {
      data[doc.id] = doc.data()
    })
    return data
  }

  async getCollectionField(collection, field) {
    const docRef = db.collection(collection).doc(field)
    const snapshot = await docRef.get()
    return snapshot.data()
  }
}

export default new MarketingFirebaseClient()

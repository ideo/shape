import firebase from 'firebase/app'

export default class FirestoreClient {
  constructor(config) {
    this.config = JSON.parse(config)
    this.db = {}
  }

  initialize() {
    firebase.initializeApp(this.config)
    const firestoreSettings = {
      timestampsInSnapshots: true,
    }
    firebase.firestore().settings(firestoreSettings)
    this.db.store = firebase.firestore()
  }

  getDocument(collection, id) {
    // this isn't used at all...
    // const document = this.db.store.collection(collection).id(id)
    // document
    //   .get()
    //   .then(doc => {
    //     if (doc.exists) {
    //       return doc.data().value
    //     }
    //     // doc.data() will be undefined in this case
    //     console.log('No such document %s', `${collection}/${id}`)
    //     return false
    //   })
    //   .catch(error => {
    //     console.log('Error getting document:', error)
    //   })
  }

  async getObjectFromCollection(collection) {
    let obj = {}
    const hasCollection = this.db.store && this.db.store.collection
    if (!hasCollection) {
      return obj
    }
    const queryForObj = async collection => {
      const snapshot = await this.db.store
        .collection(collection)
        .get()
        .then(snapshot => {
          return snapshot
        })
      const o = {}
      snapshot.forEach(s => {
        const { id } = s
        o[id] = s.data()
      })
      return o
    }
    obj = await queryForObj(collection)
    return obj
  }
}

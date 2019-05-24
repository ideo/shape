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

  async getObjectFromCollection(collection) {
    let obj = {}
    const hasCollection = db && db.collection
    if (!hasCollection) {
      return obj
    }
    const queryForObj = async collection => {
      let snapshot = {}
      switch (collection) {
        case 'productDescriptions':
        case 'productTemplates':
          snapshot = await db
            .collection(collection)
            .orderBy('order')
            .get()
            .then(snapshot => {
              return snapshot
            })
          break
        default:
          snapshot = await db
            .collection(collection)
            .get()
            .then(snapshot => {
              return snapshot
            })
          break
      }
      const o = {}
      snapshot.forEach(s => {
        const { id } = s
        o[id] = s.data()
      })

      // convert non template objects, ie: 'productDescriptions' to array
      // for easy component rendering in the front-end
      const transformKeyValueToArray = hash => {
        return Object.keys(hash).map(key =>
          Object.assign({ id: key }, hash[key])
        )
      }

      switch (collection) {
        case 'productDescriptions':
        case 'productTemplates':
          return transformKeyValueToArray(o)
        default:
          return o
      }
    }
    obj = await queryForObj(collection)
    return obj
  }
}

export default new MarketingFirebaseClient()

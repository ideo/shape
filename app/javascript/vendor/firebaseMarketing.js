import firebase from 'firebase/app'
import 'firebase/firestore'

/*
{
  "$id": "https://shape.ideo.com/productDescription.schema.json",
  "$schema": "http://json-schema.org/draft-07/schema#",
  "description:": "Product descriptions for the IDEO Shape marketing site, originally in /productDescriptions",
  "type": "object",
  "properties": {
    "description": {
      "type": "string"
    },
    "imageUrl": {
      "type": "string"
    },
    "order": {
      "type": "number"
      "minimum": -99,
      "maximum": 99
    },
    "title": {
      "type": "string"
    },
}

{
  "$id": "https://shape.ideo.com/marketingSiteElements.schema.json",
  "$schema": "http://json-schema.org/draft-07/schema#",
  "description:": "Text Elements for IDEO Shape marketing site, originally in /pageText",
  "type": "object",
  "properties": {
    "value": {
      "type": "string"
    }

    Initial Ids:
      buttonFooter
      buttonTopLeft
      buttonTopRight
      contactHeader
      contactHeader2
      footerHeader
      footerSubHeader
      subscriptionHeader
      tagLine
}

*/

const config = process.env.GOOGLE_FIRESTORE_SHAPE_MARKETING
let db = {}
if (config) {
  firebase.initializeApp(JSON.parse(config))
  db = firebase.firestore()
  db.settings({
    // recommending setting for Firestore 5.0+
    timestampsInSnapshots: true,
  })
}

export function readFirebaseValue(collection, id) {
  const docRef = db.collection(collection).doc(id)

  docRef
    .get()
    .then(doc => {
      if (doc.exists) {
        return doc.data().value
      }
      // doc.data() will be undefined in this case
      console.log('No such document %s', `${collection}/${id}`)
      return false
    })
    .catch(error => {
      console.log('Error getting document:', error)
    })
}

export default firebase

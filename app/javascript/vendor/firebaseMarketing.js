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
      footerHeader
      footerSubHeader
      subscriptionHeader
      tagLine
}

*/

firebase.initializeApp(config)
let db = {}
db = firebase.firestore()
db.settings({
  // recommending setting for Firestore 5.0+
  timestampsInSnapshots: true
})

export default firebase

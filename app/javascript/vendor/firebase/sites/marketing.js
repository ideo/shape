import 'firebase/firestore'
import FirestoreClient from '~/vendor/firebase/firestoreClient'

// disable firestore in cypress automated tests -- doesn't really work
const cypress = navigator && navigator.userAgent === 'cypress'

const config = process.env.GOOGLE_FIRESTORE_SHAPE_MARKETING
const marketingFirestoreClient = new FirestoreClient(config)

if (config && !cypress) {
  marketingFirestoreClient.initialize()
}

export default marketingFirestoreClient

import firebase from 'firebase/app'
import 'firebase/auth'
import 'firebase/firestore'

import { apiStore } from '~/stores'

let db = {}
if (process.env.GOOGLE_CLOUD_BROWSER_KEY) {
  firebase.initializeApp({
    apiKey: process.env.GOOGLE_CLOUD_BROWSER_KEY,
    projectId: process.env.GOOGLE_CLOUD_PROJECT,
  })
  db = firebase.firestore()
  db.settings({
    // recommending setting for Firestore 5.0+
    timestampsInSnapshots: true
  })
}

export class FirebaseClient {
  subscribedThreadIds = []

  authenticate = (token) => {
    firebase.auth().signInWithCustomToken(token)
    firebase.auth().onAuthStateChanged(user => {
      if (user) {
        this.listenForUsersThreads(user.uid)
      }
    })
  }

  listenForUsersThreads = (userId) => {
    const orgId = apiStore.currentUserOrganizationId
    db.collection('users_threads')
      .where('data.attributes.identifier', '==', `${orgId}_${userId}`)
      .onSnapshot(querySnapshot => {
        querySnapshot.forEach(doc => {
          const usersThread = apiStore.syncFromFirestore(doc.data())
          this.subscribeToThread(usersThread)
        })
      }, error => {
        console.warn('listen_for_ut', error)
      })
  }

  commentsForThread = (threadId) => (
    db.collection('comments')
      .where('data.attributes.comment_thread_id', '==', parseInt(threadId))
      .orderBy('data.attributes.updated_at', 'desc')
  )

  subscribeToThread = (usersThread) => {
    const threadId = usersThread.comment_thread_id
    // check if we're already listening for this thread
    if (this.subscribedThreadIds.indexOf(threadId) > -1) return
    this.subscribedThreadIds.push(threadId)
    const threadUid = threadId.toString()
    db.collection('comment_threads').doc(threadUid)
      .onSnapshot(threadDoc => {
        const thread = apiStore.syncFromFirestore(threadDoc.data())
        this.commentsForThread(threadUid)
          .limit(3)
          .get()
          .then(snapshots => {
            const comments = []
            snapshots.docs.forEach(commentDoc => {
              const comment = apiStore.syncFromFirestore(commentDoc.data())
              comments.push(comment)
            })
            apiStore.importUsersThread({
              usersThread,
              thread,
              comments,
            })
          })
      }, error => {
        console.warn('comment_threads', error)
      })
  }
}

export default new FirebaseClient()

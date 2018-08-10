import _ from 'lodash'
import firebase from 'firebase/app'
import 'firebase/auth'
import 'firebase/firestore'
import { observe } from 'mobx'

import { apiStore } from '~/stores'
import trackError from '~/utils/trackError'

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
  constructor() {
    this.listeners = []
    this.disposer = observe(apiStore, 'currentUserOrganizationId', (change) => {
      if (change.type === 'update' &&
        change.oldValue &&
        change.newValue !== change.oldValue) {
        this.stopListening()
        this.startListening()
      }
    })
  }

  startListening() {
    if (!apiStore.currentUserId) return
    this.listenForUsersThreads(apiStore.currentUserId)
    this.listenForUserNotifications(apiStore.currentUserId)
  }

  stopListening() {
    this.listeners.forEach(listener => { _.isFunction(listener) && listener() })
    this.listeners = []
    apiStore.removeAll('notifications')
    apiStore.removeAll('users_threads')
    apiStore.removeAll('comment_threads')
    apiStore.removeAll('comments')
  }

  authenticate = (token) => {
    firebase.auth().signInWithCustomToken(token)
    firebase.auth().onAuthStateChanged(user => {
      if (user) {
        this.startListening()
      }
    })
  }

  listenForUserNotifications = (userId) => {
    const orgId = apiStore.currentUserOrganizationId
    this.notificationsListener = db.collection('notifications')
      .where('data.attributes.identifier', '==', `${orgId}_${userId}`)
      .limit(50)
      .onSnapshot(querySnapshot => {
        querySnapshot.forEach(doc => {
          apiStore.syncFromFirestore(doc.data())
        })
        const changes = querySnapshot.docChanges()
        if (changes) {
          changes.forEach(change => {
            // remove all notifications that were deleted
            if (change.type === 'removed') {
              apiStore.remove('notifications', change.doc.id)
            }
          })
        }
      }, err => {
        trackError(err, { name: 'Firestore:Notifications' })
      })
    this.listeners.push(this.notificationsListener)
  }

  listenForUsersThreads = (userId) => {
    const orgId = apiStore.currentUserOrganizationId
    this.userThreadListener = db.collection('users_threads')
      .where('data.attributes.identifier', '==', `${orgId}_${userId}`)
      .onSnapshot(querySnapshot => {
        querySnapshot.forEach(doc => {
          const usersThread = apiStore.syncFromFirestore(doc.data())
          this.subscribeToThread(usersThread)
        })
      }, error => {
        trackError(error, { name: 'Firestore:UserThreads' })
      })
    this.listeners.push(this.userThreadListener)
  }

  commentsForThread = (threadId) => (
    this.commentsListener = db.collection('comments')
      .where('data.attributes.comment_thread_id', '==', parseInt(threadId))
      .orderBy('data.attributes.updated_at', 'desc')
  )

  subscribeToThread = (usersThread) => {
    const threadId = usersThread.comment_thread_id
    // check if we're already listening for this thread
    if (this.subscribedThreadIds.indexOf(threadId) > -1) return
    this.subscribedThreadIds.push(threadId)
    const threadUid = threadId.toString()
    this.commentThreadsListener = db.collection('comment_threads').doc(threadUid)
      .onSnapshot(threadDoc => {
        const thread = apiStore.syncFromFirestore(threadDoc.data())
        this.commentsListener = this.commentsForThread(threadUid)
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
        trackError(error, { name: 'Firestore:CommentThreads' })
      })
    this.listeners.push(this.commentThreadsListener)
    this.listeners.push(this.commentsListener)
  }
}

export default new FirebaseClient()

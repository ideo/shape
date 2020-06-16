import { fakeCollection } from '#/mocks/data'

const phaseSubcollections = [
  {
    ...fakeCollection,
    id: '4560202',
    name: 'Phase Collection',
  },
]

class Collection {
  static async loadPhasesForSubmissionBoxes(submissionBoxes) {
    submissionBoxes.map(submissionBox => {
      // Append phase subcollections
      if (submissionBox.submission_template) {
        submissionBox.phaseSubCollections = phaseSubcollections
      }
    })
    // Immediately resolve promise for the test
    return Promise.resolve(submissionBoxes)
  }
}

export default Collection

import ChallengeHeaderButton from '~/ui/challenges/ChallengePhasesIcons'

import { fakeCollection, fakeCollectionCard } from '#/mocks/data'

let props, wrapper, rerender
describe('ChallengeHeaderButton', () => {
  beforeEach(() => {
    props = {
      record: {
        ...fakeCollection,
        collection_type: 'challenge',
        API_fetchAllReviewableSubmissions: jest
          .fn()
          .mockReturnValue(Promise.resolve([])),
        canEdit: false,
      },
    }

    rerender = () => {
      wrapper = shallow(<ChallengeHeaderButton {...props} />)
    }

    rerender()
  })

  // TODO: add test that it renders challenge settings button only if user can canEdit on collection
  // TODO: add test that it only renders review submissions button if user is in reviewer group

  describe('inside a submission box', () => {
    const submissionsCollection = fakeCollection
    beforeEach(() => {
      props.collection.isSubmissionBox = true
      props.collection.submissions_collection = submissionsCollection
      props.collection.isChallengeOrInsideChallenge = true
      rerender()
    })

    it('should render a Challenge Settings Button', () => {
      const challengeButton = wrapper.find('Button')
      expect(challengeButton.exists()).toEqual(true)
    })

    it('should render the button with no reviewable submissions', () => {
      expect(wrapper.find('Button').text()).toContain(
        'No Reviewable Submissions'
      )
    })

    describe('with reviewable submissions', () => {
      beforeEach(() => {
        submissionsCollection.reviewableCards = [fakeCollectionCard]
        props.collection.submissions_collection = submissionsCollection
        rerender()
      })
      it('should render the button with reviewable submissions', () => {
        expect(wrapper.find('Button').text()).toContain('Review Submissions')
      })
    })
  })
})

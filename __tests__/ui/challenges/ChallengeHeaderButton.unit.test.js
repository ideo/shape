import ChallengeHeaderButton from '~/ui/challenges/ChallengeHeaderButton'

import { fakeCollection, fakeCollectionCard } from '#/mocks/data'

let props, wrapper, rerender
describe('ChallengeHeaderButton', () => {
  beforeEach(() => {
    props = {
      record: {
        ...fakeCollection,
        collection_type: 'challenge',
        isChallengeOrInsideChallenge: true,
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

  describe('if user cannot edit collection and is not in reviewer group', () => {
    it('does not render button', () => {
      expect(wrapper.find('Button').exists()).toBe(false)
    })
  })

  describe('if user can edit collection', () => {
    beforeEach(() => {
      props.record.canEdit = true
      rerender()
    })

    it('renders Challenge Settings button', () => {
      expect(wrapper.find('Button').exists()).toBe(true)
      expect(wrapper.find('Button').text()).toEqual('Challenge Settings')
    })
  })

  describe('inside a submission box', () => {
    const submissionsCollection = fakeCollection
    beforeEach(() => {
      props.record.isSubmissionBox = true
      props.record.submissions_collection = submissionsCollection
      rerender()
    })

    describe('if user is in reviewer group', () => {
      beforeEach(() => {
        // TODO: setup user in reviewer group
      })

      it('renders the button with no reviewable submissions', () => {
        expect(wrapper.find('Button').text()).toContain(
          'No Reviewable Submissions'
        )
      })

      describe('with reviewable submissions', () => {
        beforeEach(() => {
          submissionsCollection.reviewableCards = [fakeCollectionCard]
          props.record.submissions_collection = submissionsCollection
          rerender()
        })

        it('renders the button with reviewable submissions', () => {
          expect(wrapper.find('Button').text()).toContain('Review Submissions')
        })
      })
    })
  })
})

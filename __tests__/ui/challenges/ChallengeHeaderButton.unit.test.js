import ChallengeHeaderButton from '~/ui/challenges/ChallengeHeaderButton'
import fakeApiStore from '#/mocks/fakeApiStore'
import { fakeCollection } from '#/mocks/data'

let props, wrapper, rerender
describe('ChallengeHeaderButton', () => {
  beforeEach(() => {
    props = {
      record: {
        ...fakeCollection,
        isChallengeOrInsideChallenge: true,
        API_fetchAllReviewableSubmissions: jest
          .fn()
          .mockReturnValue(Promise.resolve([])),
        fetchChallengeReviewersGroup: jest.fn(),
        canEdit: false,
        challenge: {
          ...fakeCollection,
          canEdit: false,
          collection_type: 'challenge',
        },
      },
      apiStore: fakeApiStore(),
    }

    rerender = () => {
      wrapper = shallow(<ChallengeHeaderButton.wrappedComponent {...props} />)
    }

    rerender()
  })

  describe('if user cannot edit collection and is not in reviewer group', () => {
    it('does not render button', () => {
      expect(wrapper.find('ChallengeHeaderButton').exists()).toBe(false)
    })
  })

  describe('if user can edit collection', () => {
    beforeEach(() => {
      props.record.challenge.canEdit = true
      rerender()
    })

    it('renders Challenge Settings button', () => {
      expect(wrapper.find('Button').exists()).toBe(true)
      expect(wrapper.find('Button').text()).toEqual('Challenge Settings')
    })
  })

  describe('inside a submission box', () => {
    beforeEach(() => {
      props.record.isSubmissionBox = true
      props.record.isChallengeOrInsideChallenge = true
      props.record.challenge.canEdit = true
      rerender()
    })

    it('should render a review button', () => {
      expect(wrapper.find('Button').exists()).toBe(true)
    })

    describe('if user has no submissions to review', () => {
      beforeEach(() => {
        props.record.currentUserHasSubmissionsToReview = false
        rerender()
      })

      it('should render the button with no reviewable submissions', () => {
        expect(wrapper.find('Button').text()).toContain(
          'No Reviewable Submissions'
        )
      })
    })

    describe('with reviewable submissions', () => {
      beforeEach(() => {
        props.record.currentUserHasSubmissionsToReview = true
        rerender()
      })

      it('renders the button with reviewable submissions', () => {
        expect(wrapper.find('Button').text()).toContain('Review Submissions')
      })
    })
  })
})

import ChallengeHeaderButton from '~/ui/challenges/ChallengeHeaderButton'
import fakeApiStore from '#/mocks/fakeApiStore'
import {
  fakeCollection,
  fakeCollectionCard,
  fakeGroup,
  fakeRole,
  fakeUser,
} from '#/mocks/data'

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
        fetchChallengeReviewersGroup: jest.fn(),
        canEdit: false,
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
      props.record.isChallengeOrInsideChallenge = true
      props.record.submissions_collection = submissionsCollection
      rerender()
    })

    it('should not render a challenge button', () => {
      expect(wrapper.find('Button').exists()).toBe(false)
    })

    describe('if user is in reviewer group', () => {
      beforeEach(() => {
        const reviewerGroup = fakeGroup
        const memberRole = fakeRole
        memberRole.label = 'member'
        memberRole.users = [fakeUser]
        reviewerGroup.roles = [memberRole]
        props.apiStore.currentUser = fakeUser
        props.record.challengeReviewerGroup = reviewerGroup
        rerender()
      })

      it('should render the button with no reviewable submissions', () => {
        expect(wrapper.find('Button').text()).toContain(
          'No Reviewable Submissions'
        )
      })

      describe('with reviewable submissions', () => {
        beforeEach(() => {
          submissionsCollection.reviewableCards = [fakeCollectionCard]
          rerender()
        })

        it('renders the button with reviewable submissions', () => {
          expect(wrapper.find('Button').text()).toContain('Review Submissions')
        })
      })
    })
  })
})

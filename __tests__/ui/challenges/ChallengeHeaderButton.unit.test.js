import ChallengeHeaderButton, {
  ReviewSubmissionsButton,
} from '~/ui/challenges/ChallengeHeaderButton'
import { fakeCollection } from '#/mocks/data'

let props, wrapper, rerender
describe('ChallengeHeaderButton', () => {
  beforeEach(() => {
    props = {
      record: {
        ...fakeCollection,
        isChallengeOrInsideChallenge: true,
        canEdit: false,
        in_reviewer_group: false,
      },
      parentChallenge: null,
    }
    rerender = () => {
      wrapper = shallow(<ChallengeHeaderButton {...props} />)
    }
    rerender()
  })

  describe('if user cannot edit collection and is not in reviewer group', () => {
    it('does not render a button', () => {
      expect(wrapper.find('ChallengeSettingsButton').exists()).toBe(false)
      expect(wrapper.find('ReviewSubmissionsButton').exists()).toBe(false)
    })
  })

  describe('if user can edit collection', () => {
    beforeEach(() => {
      props.parentChallenge = {
        ...fakeCollection,
        id: 999,
        canEdit: true,
      }
      rerender()
    })

    it('renders challenge settings button', () => {
      expect(wrapper.find('ChallengeSettingsButton').exists()).toBe(true)
    })
  })

  describe('if user is in the reviewer group and not a challenge editor', () => {
    beforeEach(() => {
      props.parentChallenge = {
        ...fakeCollection,
        id: 999,
        canEdit: false,
      }
      props.record.in_reviewer_group = true
      rerender()
    })

    it('renders review submissions button', () => {
      expect(wrapper.find('ReviewSubmissionsButton').exists()).toBe(true)
    })
  })
})

describe('ReviewSubmissionsButton', () => {
  beforeEach(() => {
    props = {
      record: { ...fakeCollection, isSubmissionBox: true },
    }
    rerender = () => {
      wrapper = shallow(<ReviewSubmissionsButton {...props} />)
    }
  })

  it('calls API_getNextAvailableTest to see if there are any tests to review', () => {
    rerender()
    expect(props.record.API_getNextAvailableTest).toHaveBeenCalled()
  })

  describe('if user has no submissions to review', () => {
    beforeEach(() => {
      props.record.API_getNextAvailableTest = jest
        .fn()
        .mockReturnValue(Promise.resolve(null))
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
      props.record.API_getNextAvailableTest = jest
        .fn()
        .mockReturnValue(Promise.resolve('/collections/999?open=tests'))
      rerender()
    })

    it('renders the button with reviewable submissions', () => {
      expect(wrapper.find('Button').text()).toContain('Review Submissions')
    })
  })
})

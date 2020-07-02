import ChallengeFixedHeader from '~/ui/layout/ChallengeFixedHeader'

import { fakeCollection, fakeCollectionCard } from '#/mocks/data'

let props, wrapper, rerender
describe('ChallengeFixedHeader', () => {
  beforeEach(() => {
    props = {
      collection: {
        ...fakeCollection,
        name: 'Reusable Cup Challenge',
        icon: 'challenge',
      },
      handleShowSettings: jest.fn(),
      handleReviewSubmissions: jest.fn(),
      challengeNavigationHandler: jest.fn(),
    }
    rerender = () => {
      wrapper = shallow(<ChallengeFixedHeader {...props} />)
    }
    rerender()
  })

  describe('inside a challenge collection', () => {
    beforeEach(() => {
      props.collection.collection_type = 'challenge'
      rerender()
    })
    it('should render an inline EditableName with the chalenge name', () => {
      expect(wrapper.find('EditableName').props().inline).toEqual(true)
      expect(wrapper.find('EditableName').props().name).toContain(
        'Reusable Cup Challenge'
      )
    })

    it('should render a challenge icon', () => {
      expect(wrapper.find('CollectionIcon').props().type).toEqual('challenge')
    })

    it('should not render challenge ChallengeSubHeader', () => {
      expect(wrapper.find('ChallengeSubHeader').exists()).toEqual(false)
    })

    it('should render a Challenge Settings Button', () => {
      const challengeButton = wrapper.find('Button')
      expect(challengeButton.exists()).toEqual(true)
      expect(challengeButton.text()).toContain('Challenge Settings')
    })

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

  describe('collection is not a challenge', () => {
    beforeEach(() => {
      props.collection.collection_type = 'phase'
      rerender()
    })

    it('should not render challenge ChallengeSubHeader', () => {
      expect(wrapper.find('ChallengeSubHeader').exists()).toEqual(true)
    })
  })
})

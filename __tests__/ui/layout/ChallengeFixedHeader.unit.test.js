import ChallengeFixedHeader from '~/ui/layout/ChallengeFixedHeader'

import { fakeCollection } from '#/mocks/data'

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
      props.collection.canEdit = true
      props.collection.API_fetchAllReviewableSubmissions = jest
        .fn()
        .mockReturnValue(Promise.resolve([]))
      rerender()
    })
    it('should render an inline EditableName with the challenge name', () => {
      expect(wrapper.find('EditableName').props().inline).toEqual(true)
      expect(wrapper.find('EditableName').props().name).toEqual(
        'Reusable Cup Challenge'
      )
    })

    it('should render a challenge icon', () => {
      expect(wrapper.find('CollectionIcon').props().type).toEqual('challenge')
    })

    it('should not render challenge ChallengeSubHeader', () => {
      expect(wrapper.find('ChallengeSubHeader').exists()).toEqual(false)
    })

    it('renders the Challenge Settings Button', () => {
      const buttonProps = wrapper.find('TopRightChallengeButton').props()
      expect(buttonProps.name).toEqual('Challenge Settings')
      expect(buttonProps.hidden).toEqual(false)
    })

    describe('if user cannot edit challenge and is not a reviewer', () => {
      beforeEach(() => {
        props.collection.canEdit = false
        rerender()
      })

      it('renders hidden button', () => {
        expect(wrapper.find('TopRightChallengeButton').props().hidden).toEqual(
          true
        )
      })
    })

    describe('inside a submission box', () => {
      beforeEach(() => {
        props.collection.isSubmissionBox = true
        rerender()
      })

      it('should render a Challenge Settings Button', () => {
        const challengeButton = wrapper.find('TopRightChallengeButton')
        expect(challengeButton.exists()).toEqual(true)
        expect(challengeButton.props().name).toContain('Review Submissions')
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

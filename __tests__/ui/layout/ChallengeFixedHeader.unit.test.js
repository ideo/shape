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
      rerender()
    })
    it('should render an inline EditableName with the challenge name', () => {
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

    it('renders the ChallengeHeaderButton', () => {
      expect(wrapper.find('ChallengeHeaderButton').exists()).toEqual(true)
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

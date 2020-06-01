import ChallengeFixedHeader from '~/ui/layout/ChallengeFixedHeader'
import { fakeCollection } from '#/mocks/data'
let props, wrapper, rerender
describe('ChallengeFixedHeader', () => {
  beforeEach(() => {
    fakeCollection.collection_type = 'challenge'
    props = {
      collection: fakeCollection,
      challengeNavigationHandler: jest.fn(),
      handleShowSettings: jest.fn(),
      handleReviewSubmissions: jest.fn(),
    }
    rerender = () => {
      wrapper = shallow(<ChallengeFixedHeader {...props} />)
    }
    rerender()
  })

  it('should render an inline EditableName with the chalenge name', () => {
    expect(wrapper.find('EditableName').props().inline).toEqual(true)
    expect(wrapper.find('EditableName').props().name).toEqual(
      fakeCollection.name
    )
  })

  it('should render a challenge icon', () => {
    expect(wrapper.find('ChallengeIcon').exists()).toEqual(true)
  })

  it('should not render challenge ChallengeSubHeader', () => {
    expect(wrapper.find('ChallengeSubHeader').exists()).toEqual(false)
  })

  it('should render TopRightChallengeButton', () => {
    expect(wrapper.find('TopRightChallengeButton').exists()).toEqual(true)
    expect(wrapper.find('TopRightChallengeButton').props().name).toEqual(
      'Challenge Settings'
    )
  })

  describe('collection is not a challenge', () => {
    beforeEach(() => {
      fakeCollection.collection_type = 'phase'
      props = {
        collection: fakeCollection,
        ...props,
      }
      rerender()
    })

    it('should not render challenge ChallengeSubHeader', () => {
      expect(wrapper.find('ChallengeSubHeader').exists()).toEqual(true)
    })
  })
})

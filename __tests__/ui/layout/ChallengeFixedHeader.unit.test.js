import ChallengeFixedHeader from '~/ui/layout/ChallengeFixedHeader'

import { fakeCollection } from '#/mocks/data'

let props, wrapper, rerender
describe('ChallengeFixedHeader', () => {
  beforeEach(() => {
    props = {
      collection: {
        ...fakeCollection,
        name: 'Reusable Cup Challenge',
        collection_type: 'challenge',
      },
      handleShowSettings: jest.fn(),
      challengeNavigationHandler: jest.fn(),
    }
    rerender = () => {
      wrapper = shallow(<ChallengeFixedHeader {...props} />)
    }
    rerender()
  })

  it('should render an inline EditableName with the chalenge name', () => {
    expect(wrapper.find('EditableName').props().inline).toEqual(true)
    expect(wrapper.find('EditableName').props().name).toEqual(
      'Reusable Cup Challenge'
    )
  })

  it('should render a challenge icon', () => {
    expect(wrapper.find('ChallengeIcon').exists()).toEqual(true)
  })

  it('should not render challenge ChallengeSubHeader', () => {
    expect(wrapper.find('ChallengeSubHeader').exists()).toEqual(false)
  })

  it('should render ChallengeSettingsButton', () => {
    expect(wrapper.find('ChallengeSettingsButton').exists()).toEqual(true)
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

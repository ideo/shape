import ChallengeFixedHeader from '~/ui/layout/ChallengeFixedHeader'
let props, wrapper, rerender
describe('ChallengeFixedHeader', () => {
  beforeEach(() => {
    props = {
      challengeName: 'Reusable Cup Challenge',
      collectionName: 'Reusable Cup Challenge',
      collectionType: 'challenge',
      challengeNavigationHandler: jest.fn(),
      onSettingsClick: jest.fn(),
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

  it('should render TopRightChallengeButton', () => {
    expect(wrapper.find('TopRightChallengeButton').exists()).toEqual(true)
    expect(wrapper.find('TopRightChallengeButton').props().name).toEqual(
      'Challenge Settings'
    )
  })

  describe('collection is not a challenge', () => {
    beforeEach(() => {
      props.collectionType = 'phase'
      rerender()
    })

    it('should not render challenge ChallengeSubHeader', () => {
      expect(wrapper.find('ChallengeSubHeader').exists()).toEqual(true)
    })
  })
})

import ChallengeFixedHeader from '~/ui/layout/ChallengeFixedHeader'
let props, wrapper, rerender
describe('ChallengeFixedHeader', () => {
  beforeEach(() => {
    props = {
      challengeName: 'Reusable Cup Challenge',
      collectionName: 'Reusable Cup Challenge Phase 1',
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
      'Reusable Cup Challenge Phase 1'
    )
  })

  it('should render a challenge icon', () => {
    expect(wrapper.find('ChallengeIcon').exists()).toEqual(true)
  })

  it('should render challenge ChallengeSubHeader', () => {
    expect(wrapper.find('ChallengeSubHeader').exists()).toEqual(true)
  })

  it('should render ChallengeSettingsButton', () => {
    expect(wrapper.find('ChallengeSettingsButton').exists()).toEqual(true)
  })
})

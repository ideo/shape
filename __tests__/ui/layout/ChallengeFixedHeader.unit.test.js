import ChallengeFixedHeader from '~/ui/layout/ChallengeFixedHeader'
let props, wrapper, rerender
describe('ChallengeFixedHeader', () => {
  beforeEach(() => {
    props = {
      challengeName: 'Reusable Cup Challenge',
      collectionType: 'challenge',
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

  it('should render a challenge settings Button', () => {
    expect(wrapper.find('Button').exists()).toEqual(true)
  })
})

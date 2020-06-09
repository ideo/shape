import ChallengeSubHeader from '~/ui/layout/ChallengeSubHeader'

let props, wrapper
describe('ChallengeSubHeader', () => {
  beforeEach(() => {
    props = {
      challengeName: 'Open Innovation Sustainability Challenge',
      challengeNavigationHandler: jest.fn(),
    }

    wrapper = shallow(<ChallengeSubHeader {...props} />)
  })

  it('should render the challenge navigation link with tooltip', () => {
    expect(wrapper.find('WithStyles(Tooltip)').props().title).toEqual(
      'go to challenge'
    )
    expect(wrapper.find('StyledSubHeaderLink').html()).toContain(
      'Open Innovation Sustainability Challenge'
    )
  })
})

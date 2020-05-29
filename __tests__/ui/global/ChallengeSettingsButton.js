import ChallengeSettingsButton from '~/ui/global/ChallengeSettingsButton'

let props, wrapper
describe('ChallengeSettingsButton', () => {
  beforeEach(() => {
    props = {
      onSettingsClick: jest.fn(),
    }

    wrapper = shallow(<ChallengeSettingsButton {...props} />)
  })

  it('should render a Button', () => {
    expect(wrapper.find('Button').exists()).toBeTruthy()
  })
})

import TopRightChallengeButton from '~/ui/global/TopRightChallengeButton'

let props, wrapper
describe('TopRightChallengeButton', () => {
  beforeEach(() => {
    props = {
      name: 'Challenge Settings',
      onClick: jest.fn(),
    }

    wrapper = shallow(<TopRightChallengeButton {...props} />)
  })

  it('should render a Button', () => {
    expect(wrapper.find('Button').exists()).toBeTruthy()
  })
})

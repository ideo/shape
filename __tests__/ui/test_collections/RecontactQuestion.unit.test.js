import RecontactQuestion from '~/ui/test_collections/RecontactQuestion'
import { fakeUser } from '#/mocks/data'
import { apiStore } from '~/stores'
jest.mock('../../../app/javascript/stores/index')

let wrapper, component, props
const fakeEv = { preventDefault: jest.fn() }
const rerender = () => {
  wrapper = shallow(<RecontactQuestion {...props} />)
  component = wrapper.instance()
}
describe('TestDesigner', () => {
  beforeEach(() => {
    props = {
      user: null,
      onAnswer: jest.fn().mockName('onAnswer'),
      sessionUid: '123-xyz',
    }
    rerender()
  })

  describe('default state with no user, no incentive', () => {
    it('asks if you would like to be recontacted', () => {
      const questionText = wrapper.find('QuestionText').at(0)
      expect(questionText.text()).toContain('Would you like to be contacted')
    })
  })

  describe('with no user, with an incentive', () => {
    beforeEach(() => {
      props.givesIncentive = true
      apiStore.createLimitedUser = jest
        .fn()
        .mockReturnValue(Promise.resolve({ data: fakeUser }))
      rerender()
    })

    it('first asks for your payment email', () => {
      const questionText = wrapper.find('StyledDisplayText').at(0)
      expect(questionText.text()).toContain('Please enter an email')
    })

    it('creates a limited user when filling out the form', () => {
      const contactInfo = 'email@isp.net'
      component.setState({
        contactInfo,
      })
      wrapper.find('form').simulate('submit', fakeEv)
      expect(apiStore.createLimitedUser).toHaveBeenCalledWith({
        contactInfo,
        sessionUid: props.sessionUid,
      })
    })
  })

  describe('with a user that has not yet answered', () => {
    beforeEach(() => {
      props.user = {
        ...fakeUser,
        feedback_contact_preference: 'feedback_contact_unanswered',
      }
      props.givesIncentive = true
      rerender()
    })

    it('asks if you would like to be recontacted', () => {
      const questionText = wrapper.find('QuestionText').at(0)
      expect(questionText.text()).toContain('Would you like to be contacted')
    })
    it('calls user.API_updateSurveyRespondent on click', () => {
      const yesButton = wrapper.find('EmojiButton').at(1)
      yesButton.simulate('click', fakeEv)
      expect(fakeUser.API_updateSurveyRespondent).toHaveBeenCalledWith(
        props.sessionUid,
        {
          feedback_contact_preference: 'feedback_contact_yes',
        }
      )
    })
  })
})

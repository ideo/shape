import UnresolvedButton from '~/ui/global/UnresolvedButton'
import { fakeTextItem } from '#/mocks/data'

import Tooltip from '~/ui/global/Tooltip'

jest.mock('../../../app/javascript/stores/index')

describe('UnresolvedButton', () => {
  let wrapper, props

  beforeEach(() => {
    props = {
      onClick: jest.fn(),
      hasNoOtherIcons: false,
      record: { ...fakeTextItem, can_edit: true, unresolved_count: 1 },
    }
    wrapper = shallow(<UnresolvedButton {...props} />)
  })

  describe('render', () => {
    it('should render a button with a Tooltip', () => {
      expect(wrapper.find('StyledUnresolvedButton').exists()).toBeTruthy()
      expect(wrapper.find(Tooltip).exists()).toBeTruthy()
    })
  })
})

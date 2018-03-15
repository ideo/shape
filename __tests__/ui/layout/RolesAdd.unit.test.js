import { observable, useStrict } from 'mobx'
import RolesAdd from '~/ui/layout/RolesAdd'

let props
let wrapper

describe('RolesAdd', () => {
  beforeEach(() => {
    useStrict(false)
    props = {
      onCreate: jest.fn(),
      onSearch: jest.fn(),
    }
    wrapper = shallow(
      <RolesAdd {...props} />
    )
  })

  describe('onSearch', () => {
    const user = { id: 2, name: 'Uncle Leo' }

    describe('when a user is found', () => {
      beforeEach(() => {
        props.onSearch.mockReturnValue(Promise.resolve(
          { data: [user] }
        ))
      })

      it('should map the data with a value and a user', () => {
        expect(wrapper.instance().onUserSearch('leo')).resolves.toEqual(
          [{ value: user, label: user.name }]
        )
      })
    })
  })
})

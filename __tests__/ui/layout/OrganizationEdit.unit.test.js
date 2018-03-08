import { observable, useStrict } from 'mobx'
import OrganizationEdit from '~/ui/layout/OrganizationEdit'

const props = {
  organization: {
    name: 'Space',
    save: jest.fn()
  }
}

let wrapper

describe('OrganizationEdit', () => {
  beforeEach(() => {
    useStrict(false)
    wrapper = mount(
      <OrganizationEdit {...props} />
    )
  })

  it('should allow editing the org name', () => {
    wrapper.find('[type="text"]').simulate('change',
      { target: { value: 'Earth' }})
    expect(wrapper.find('[type="text"]').props().value).toEqual('Earth')
  })

  it('should send a network request when you hit save with updated name',
    () => {
      wrapper.find('[type="text"]').simulate('change',
        { target: { value: 'Ocean' }})
      wrapper.find('[type="submit"]').simulate('click')
      expect(props.organization.save).toHaveBeenCalled()
    })

  it('should open the file loader when you click on the avatar', () => {

  })
})

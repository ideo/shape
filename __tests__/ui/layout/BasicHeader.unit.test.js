import BasicHeader from '~/ui/layout/BasicHeader'

let props, wrapper, rerender
describe('BasicHeader', () => {
  beforeEach(() => {
    props = {
      orgMenu: false,
    }
    rerender = () => {
      wrapper = shallow(<BasicHeader {...props} />)
    }
    rerender()
  })

  it('shows logo', () => {
    expect(wrapper.find('Logo').exists()).toEqual(true)
  })

  it('does not show org menu', () => {
    expect(wrapper.find('OrganizationMenu').exists()).toEqual(false)
  })

  describe('with org menu true', () => {
    beforeEach(() => {
      props = {
        orgMenu: true,
      }
      rerender()
    })

    it('shows org menu', () => {
      expect(
        wrapper.find('inject-OrganizationMenu-with-apiStore-uiStore').exists()
      ).toEqual(true)
    })
  })
})

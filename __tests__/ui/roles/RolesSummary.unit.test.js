import RolesSummary from '~/ui/roles/RolesSummary'

import { fakeRole, fakeUser } from '#/mocks/data'

const emptyProps = {
  roles: [],
  handleClick: jest.fn(),
  rolesMenuOpen: false,
}

const editorRole = { ...fakeRole }
const viewerRole = { ...fakeRole }
viewerRole.name = 'viewer'

const editorsAndViewersProps = {
  roles: [editorRole, viewerRole],
  rolesMenuOpen: false,
  handleClick: jest.fn(),
}

const canEditProps = {
  ...editorsAndViewersProps,
  canEdit: true,
}

let wrapper
describe('RolesSummary', () => {
  describe('with editors and viewers', () => {
    beforeEach(() => {
      wrapper = shallow(<RolesSummary {...editorsAndViewersProps} />)
    })

    it('renders editors', () => {
      expect(wrapper.find('[className="editor"]').length).toEqual(2)
    })

    it('renders viewers', () => {
      expect(wrapper.find('[className="viewer"]').length).toEqual(2)
    })

    it('does not render StyledAddUserBtn by default', () => {
      expect(wrapper.find('StyledAddUserBtn').exists()).toBe(false)
    })
  })

  describe('with only viewers', () => {
    beforeEach(() => {
      const onlyViewersProps = {
        ...emptyProps,
        roles: [viewerRole],
      }
      wrapper = shallow(<RolesSummary {...onlyViewersProps} />)
    })

    it('renders 2 viewers and label', () => {
      expect(wrapper.find('[className="viewer"]').length).toEqual(2)
    })

    it('does not render editors', () => {
      expect(wrapper.find('[className="editor"]').exists()).toBe(false)
    })
  })

  describe('with only editors', () => {
    beforeEach(() => {
      const newProps = {
        ...emptyProps,
        roles: [editorRole],
      }
      wrapper = shallow(<RolesSummary {...newProps} />)
    })

    it('renders 2 editors and label', () => {
      expect(wrapper.find('[className="editor"]').length).toEqual(2)
    })

    it('does not render viewers', () => {
      expect(wrapper.find('[className="viewer"]').exists()).toBe(false)
    })
  })

  describe('with more editors than should show', () => {
    beforeEach(() => {
      editorRole.users = [
        fakeUser,
        fakeUser,
        fakeUser,
        fakeUser,
        fakeUser,
        fakeUser,
      ]
      const newProps = {
        ...editorsAndViewersProps,
        roles: [editorRole],
      }
      wrapper = shallow(<RolesSummary {...newProps} />)
    })

    it('renders only 4 editors', () => {
      expect(wrapper.find('[className="editor"]').length).toEqual(4)
    })

    it('renders an additonal placeholder to indicate more', () => {
      expect(wrapper.find('[className="placeholder"]').length).toEqual(1)
    })

    it('does not render any viewers or viewer label', () => {
      expect(wrapper.find('[className="viewer"]').exists()).toBe(false)
      expect(wrapper.render().text()).not.toMatch(/viewer/i)
    })
  })

  describe('with no viewers or editors and canEdit', () => {
    beforeEach(() => {
      wrapper = shallow(<RolesSummary {...emptyProps} canEdit />)
    })

    it('does not render editor label', () => {
      expect(wrapper.render().text()).not.toMatch(/editors/i)
    })

    it('does not render viewer label', () => {
      expect(wrapper.render().text()).not.toMatch(/viewers/i)
    })

    it('does not render editors or viewers', () => {
      expect(wrapper.find('[className="editor"]').exists()).toBe(false)
      expect(wrapper.find('[className="viewer"]').exists()).toBe(false)
    })
  })

  describe('when user canEdit', () => {
    beforeEach(() => {
      wrapper = shallow(<RolesSummary {...canEditProps} />)
    })

    it('renders manage roles button with onClick', () => {
      expect(wrapper.find('StyledAddUserBtn').exists()).toBe(true)
      expect(wrapper.find('StyledAddUserBtn').props().onClick).toEqual(
        canEditProps.handleClick
      )
    })
  })
})

import { clone } from 'lodash'

import fakeApiStore from '#/mocks/fakeApiStore'
import AdminUsersSummary from '~/ui/admin/AdminUsersSummary'
import { fakeUser } from '#/mocks/data'

const waitForAsync = () => new Promise(resolve => setImmediate(resolve))

let wrapper, props
describe('AdminUsersSummary', () => {
  describe('with one Shape admin user', () => {
    beforeEach(async () => {
      props = {
        apiStore: fakeApiStore({
          requestResult: { data: [fakeUser] },
        }),
      }
      wrapper = shallow(<AdminUsersSummary.wrappedComponent {...props} />)
      await waitForAsync()
      wrapper.update()
    })

    it('renders an avatar for the Shape admin user', () => {
      expect(wrapper.find('Avatar').length).toEqual(1)
    })

    it('does not render a placeholder for additional users for only one admin user', () => {
      expect(wrapper.find('.placeholder').exists()).toBe(false)
    })

    it('renders an AddButton', () => {
      expect(wrapper.find('AddButton').exists()).toBe(true)
    })
  })

  describe('with five Shape admin users', () => {
    beforeEach(async () => {
      const fakeUser2 = clone(fakeUser)
      fakeUser2.id = '2'
      fakeUser2.first_name = 'Ana'
      fakeUser2.last_name = 'Gilardi'
      fakeUser2.name = 'Ana Gilardi'

      const fakeUser3 = clone(fakeUser)
      fakeUser3.id = '3'
      fakeUser3.first_name = 'Ulises'
      fakeUser3.last_name = 'Hanway'
      fakeUser3.name = 'Ulises Hanway'

      const fakeUser4 = clone(fakeUser)
      fakeUser4.id = '4'
      fakeUser4.first_name = 'Ham'
      fakeUser4.last_name = 'Shatford'
      fakeUser4.name = 'Ham Shatford'

      const fakeUser5 = clone(fakeUser)
      fakeUser5.id = '5'
      fakeUser5.first_name = 'Chance'
      fakeUser5.last_name = 'Schollar'
      fakeUser5.name = 'Chance Schollar'

      props = {
        apiStore: fakeApiStore({
          requestResult: {
            data: [fakeUser, fakeUser2, fakeUser3, fakeUser4, fakeUser5],
          },
        }),
      }
      wrapper = shallow(<AdminUsersSummary.wrappedComponent {...props} />)
      await waitForAsync()
      wrapper.update()
    })

    it('renders avatars for the Shape admin users', () => {
      expect(wrapper.find('.admin').length).toEqual(4)
    })

    it('renders a placeholder for the Shape admin users not shown', () => {
      expect(wrapper.find('.placeholder').length).toEqual(1)
    })
  })
})

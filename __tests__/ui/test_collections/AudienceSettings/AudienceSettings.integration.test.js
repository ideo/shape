const path = require('path')

import fetchMock from 'fetch-mock'
import { Provider } from 'mobx-react'

import { apiStore, uiStore } from '~/stores'
import AudienceSettings from '~/ui/test_collections/AudienceSettings'
import Collection from '~/stores/jsonApi/Collection'
import sleep from '~/utils/sleep'

describe('AudienceSettings', function() {
  describe('something', function() {
    // TODO factory here
    const currentOrganization = {
      id: '1',
      type: 'organizations',
      attributes: {
        active_users_count: 502,
        has_payment_method: true,
        in_app_billing: true,
        name: 'IDEO',
        price_per_user: 5,
        slug: 'ideo',
        trial_users_count: 25,
      },
    }
    const currentUser = {
      id: '22',
      type: 'users',
      attributes: {
        first_name: 'Marco',
        last_name: 'Segreto',
        email: 'msegreto@ideo.com',
        created_at: '2018-03-22T18:18:03.756Z',
        status: 'active',
        handle: 'msegreto',
        shape_circle_member: false,
        pic_url_square:
          'https://d278pcsqxz7fg5.cloudfront.net/assets/users/avatars/00ue7vtfoyXqL3a2Q0h7/square-1559174855.jpg',
        user_profile_collection_id: '5215',
        terms_accepted: true,
        notify_through_email: true,
        show_helper: false,
        show_move_helper: false,
        show_template_helper: false,
        mailing_list: false,
        feedback_contact_preference: 'feedback_contact_yes',
        feedback_terms_accepted: true,
        respondent_terms_accepted: true,
        current_user_collection_id: '84',
        is_super_admin: false,
        current_incentive_balance: 0,
        incentive_due_date: null,
      },
      relationships: {
        current_organization: { data: { type: 'organizations', id: '1' } },
        organizations: {
          data: [{ type: 'organizations', id: '1' }],
        },
        groups: {
          data: [{ type: 'groups', id: '1' }, { type: 'groups', id: '27' }],
        },
      },
    }

    // TODO factory here
    // const currentUser = {
    //   current_user_collection_id: '84',
    //   email: 'msegreto@ideo.com',
    //   first_name: 'Marco',
    //   handle: 'msegreto',
    //   last_name: 'Segreto',
    //   respondent_terms_accepted: true,
    //   status: 'active',
    //   terms_accepted: true,
    //   user_profile_collection_id: '5215',
    //   current_organization: currentOrganization,
    // }
    apiStore.add(currentOrganization, 'organizations')
    apiStore.add(currentUser, 'users')
    apiStore.__addSingle(currentUser, 'users')
    apiStore.currentUserId = '22'
    apiStore.currentUserOrganizationId = currentOrganization.id
    // console.log('12345', apiStore.currentUser.first_name)

    // TODO factory here
    const collection = new Collection(
      {
        name: 'testCollection',
        can_edit: true,
        can_edit_content: true,
        can_view: true,
        card_order: 'order',
        class_type: 'Collection::TestCollection',
        collection_card_count: 2,
        frontend_url: 'http://localhost:3000/ideo/collections/333690',
        launchable: true,
        organization_id: '1',
        test_status: 'draft',
        collection_to_test_id: null,
        is_submission_box_template_test: false,
      },
      apiStore
    )
    const props = {
      testCollection: collection,
    }
    const wrapper = mount(
      <Provider apiStore={apiStore} uiStore={uiStore}>
        <AudienceSettings {...props} />
      </Provider>
    )
    const audienceSettingsWidget = wrapper
      .find('AudienceSettingsWidget')
      .first()
    const widgetDesktop = audienceSettingsWidget.find('DesktopWrapper').first()

    fetchMock.get('express:/api/v1/organizations/:organizationId/audiences', {
      data: [
        {
          id: '1',
          type: 'audiences',
          attributes: {
            name: 'Share via Link',
            global_default: 1,
            age_list: [],
            children_age_list: [],
            country_list: [],
            education_level_list: [],
            gender_list: [],
            adopter_type_list: [],
            interest_list: [],
            publication_list: [],
            price_per_response: 0.0,
            order: 1,
            global: true,
          },
        },
        {
          id: '2',
          type: 'audiences',
          attributes: {
            name: 'All People (No Filters)',
            global_default: 2,
            age_list: [],
            children_age_list: [],
            country_list: [],
            education_level_list: [],
            gender_list: [],
            adopter_type_list: [],
            interest_list: [],
            publication_list: [],
            price_per_response: 3.75,
            order: 2,
            global: true,
          },
        },
      ],
      jsonapi: {
        version: '1.0',
      },
    })

    it('should render the widget', () => {
      expect(audienceSettingsWidget.length).toBe(1)
    })

    it('should render the total as $0 to start', () => {
      const totalQuery = widgetDesktop.find('[data-cy="audience-totalPrice"]')
      expect(totalQuery.length).toEqual(1)
      const total = totalQuery.first()
      expect(total.text()).toEqual('$0.00')
    })

    it('should render at least 2 global audiences', () => {
      const audiencesQuery = widgetDesktop.find('[data-cy="audience-current"]')
      console.log('testaudes', apiStore.findAll('audiences').length)
      console.log(widgetDesktop.debug())
      expect(audiencesQuery.length).toBeGreaterThan(1)
    })

    it('should render the modal if the add audience button is clicked', () => {
      const addAudienceButton = audienceSettingsWidget
        .find('AddAudienceButton')
        .first()
      addAudienceButton.simulate('click', { preventDefault: jest.fn() })
      expect(audienceSettingsWidget.find('AddAudienceModal').length).toEqual(1)
    })
  })
})

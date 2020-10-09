require 'rails_helper'

describe Organization, type: :model do
  context 'validations' do
    it { should validate_presence_of(:name) }
  end

  describe 'billable scope' do
    let!(:billable) do
      create(:organization, in_app_billing: true, deactivated: false, billable: true, active_users_count: Organization::FREEMIUM_USER_LIMIT + 2)
    end
    let!(:not_enough_users) do
      create(:organization, in_app_billing: true, deactivated: false, active_users_count: Organization::FREEMIUM_USER_LIMIT - 2)
    end
    let!(:in_app_billing_false) { create(:organization, in_app_billing: false, deactivated: false) }
    let!(:deactivated_true) { create(:organization, in_app_billing: true, deactivated: true) }

    it 'only includes organizations with in app billing that are not deactivated' do
      expect(Organization.billable.length).to be 1
      expect(Organization.billable).to include(billable)
      expect(Organization.billable).not_to include(not_enough_users)
      expect(Organization.billable).not_to include(deactivated_true)
      expect(Organization.billable).not_to include(deactivated_true)
    end
  end

  context 'associations' do
    it { should have_many :collections }
    it { should have_many :groups }
    it { should belong_to :primary_group }

    describe '#destroy' do
      let!(:organization) { create(:organization) }
      let!(:collection_list) { create_list(:collection, 2, organization: organization, num_cards: 3) }
      let(:collections) { organization.collections }
      let(:items) { organization.items }

      it 'should destroy all related cards and items' do
        expect(collections.count).to be >= 2
        expect(items.count).to eq 6
        organization.destroy
        expect(collections.count).to eq 0
        expect(items.count).to eq 0
      end
    end
  end

  context 'callbacks' do
    let(:organization) { create(:organization, name: 'Something Long to Test Longer Org Slugs') }
    let(:org_handle) { organization.name.parameterize.slice(0, 36) }
    let(:org_short_handle) { organization.name.parameterize.slice(0, 28) }

    describe '#initialize_primary_group' do
      it 'should create primary group with same name as org' do
        expect(organization.primary_group.persisted?).to be true
        expect(organization.primary_group.name).to eq(organization.name)
        expect(organization.primary_group.handle).to eq(org_handle)
      end
    end

    describe '#initialize_guest_group' do
      it 'should create guest group with same name as org + Guests' do
        expect(organization.guest_group.persisted?).to be true
        expect(organization.guest_group.name).to eq("#{organization.name} Guests")
        expect(organization.guest_group.handle).to eq("#{org_short_handle}-guests")
      end
    end

    describe '#initialize_admin_group' do
      it 'should create admin group with same name as org + Admins' do
        expect(organization.admin_group.persisted?).to be true
        expect(organization.admin_group.name).to eq("#{organization.name} Admins")
        expect(organization.admin_group.handle).to eq("#{org_short_handle}-admins")
      end
    end

    describe '#update_group_names' do
      it 'should update primary group if name changes', :vcr do
        expect(organization.primary_group.name).not_to eq('Org 2.0')
        organization.update_attributes(name: 'Org 2.0')
        expect(organization.primary_group.reload.name).to eq('Org 2.0')
      end

      it 'should update guest group if name changes', :vcr do
        expect(organization.guest_group.name).not_to eq('Org 2.0 Guests')
        organization.update_attributes(name: 'Org 2.0')
        expect(organization.guest_group.reload.name).to eq('Org 2.0 Guests')
      end

      it 'should update admin group if name changes', :vcr do
        expect(organization.admin_group.name).not_to eq('Org 2.0 Admins')
        organization.update_attributes(name: 'Org 2.0')
        expect(organization.admin_group.reload.name).to eq('Org 2.0 Admins')
      end
    end

    describe '#parse_domain_whitelist' do
      before do
        organization.update(domain_whitelist: 'ideo.com, ideo.org')
      end

      it 'should parse string of domains into an array list' do
        expect(organization.domain_whitelist).to match_array(['ideo.com', 'ideo.org'])
      end
    end

    describe '#check_guests_for_domain_match' do
      let(:user) { create(:user, email: 'email@domain.org') }
      let(:guest) { create(:user, email: 'email@gmail.com') }
      let(:organization) { create(:organization) }

      before do
        user.add_role(Role::MEMBER, organization.guest_group)
        guest.add_role(Role::MEMBER, organization.guest_group)
      end

      it 'should set up user matching domain as a org primary group member' do
        expect(user.has_role?(Role::MEMBER, organization.primary_group)).to be false
        expect(user.has_role?(Role::MEMBER, organization.guest_group)).to be true
        # update whitelist to include user's email
        organization.update(domain_whitelist: 'domain.org')
        user.reload
        expect(user.reload.has_role?(Role::MEMBER, organization.primary_group)).to be true
        expect(user.has_role?(Role::MEMBER, organization.guest_group)).to be false
      end

      it 'should not affect other guest memberships' do
        expect(guest.has_role?(Role::MEMBER, organization.guest_group)).to be true
        # update whitelist to include user's email
        organization.update(domain_whitelist: 'domain.org')
        guest.reload
        expect(guest.has_role?(Role::MEMBER, organization.guest_group)).to be true
      end
    end

    describe 'update subscription' do
      context 'in_app_billing changed to true' do
        let(:organization) { create(:organization, in_app_billing: false) }

        context 'payment method exists' do
          it 'creates a new subscription' do
            plan = double('plan', id: 123)
            payment_method = double('payment_method', id: 234)
            network_organization = double('network_organization', id: 345)

            allow(NetworkApi::Plan).to receive(:first).and_return(plan)

            allow(NetworkApi::PaymentMethod).to receive(:find).with(
              organization_id: network_organization.id,
              default: true,
            ).and_return([payment_method])

            allow(organization).to receive(:network_organization).and_return(network_organization)

            allow(NetworkApi::Subscription).to receive(:create)

            expect(NetworkApi::Subscription).to receive(:create).with(
              organization_id: network_organization.id,
              plan_id: plan.id,
              payment_method_id: payment_method.id,
            )

            expect(network_organization).to receive(:update_attributes).with(
              enterprise: false,
            )

            organization.update_attributes(in_app_billing: true)
          end
        end

        context 'payment method does not exist' do
          it 'creates a new subscription without payment method' do
            plan = double('plan', id: 123)
            network_organization = double('network_organization', id: 345)

            allow(NetworkApi::Plan).to receive(:first).and_return(plan)

            allow(NetworkApi::PaymentMethod).to receive(:find).with(
              organization_id: network_organization.id,
              default: true,
            ).and_return([])

            allow(organization).to receive(:network_organization).and_return(network_organization)

            expect(NetworkApi::Subscription).to receive(:create).with(
              organization_id: network_organization.id,
              plan_id: plan.id,
            )

            expect(network_organization).to receive(:update_attributes).with(
              enterprise: false,
            )

            organization.update_attributes(in_app_billing: true)
          end
        end
      end

      context 'in_app_billing changed to false' do
        let(:organization) { create(:organization, in_app_billing: true) }
        it 'cancels the existing subscription' do
          network_organization = double('network_organization', id: 123)
          subscription = double('subscription')
          payment_method = double('payment_method')

          allow(organization).to receive(:network_organization).and_return(network_organization)

          allow(NetworkApi::Subscription).to receive(:find).with(
            organization_id: network_organization.id,
            active: true,
          ).and_return([subscription])
          allow(NetworkApi::PaymentMethod).to receive(:find).with(
            organization_id: network_organization.id,
            default: true,
          ).and_return([payment_method])

          expect(subscription).to receive(:cancel).with(
            immediately: true,
          )
          expect(network_organization).to receive(:update_attributes).with(
            enterprise: true,
          )

          organization.update_attributes(in_app_billing: false)
        end
      end
    end

    describe 'update deactivated' do
      context 'changed to true' do
        let(:organization) { create(:organization, deactivated: false) }
        let(:network_organization) { double('network_organization', id: 345) }
        let(:subscription) { double('subscription') }

        before do
          allow(organization).to receive(:network_organization).and_return(network_organization)

          allow(NetworkApi::Subscription).to receive(:find).with(
            organization_id: network_organization.id,
            active: true,
          ).and_return([subscription])
        end

        it 'cancels the existing subscription' do
          expect(subscription).to receive(:cancel).with(
            immediately: true,
          )
          organization.update_attributes(deactivated: true)
        end
      end

      context 'changed to false' do
        let(:organization) { create(:organization, deactivated: true) }
        let(:network_organization) { double('network_organization', id: 345) }
        let(:plan) { double('plan', id: 123) }
        let(:payment_method) { double(id: 456) }

        before do
          allow(NetworkApi::Plan).to receive(:first).and_return(plan)
          allow(NetworkApi::PaymentMethod).to receive(:find).with(
            organization_id: network_organization.id,
            default: true,
          ).and_return([payment_method])
          allow(organization).to receive(:network_organization).and_return(network_organization)
        end

        it 'creates a new subscription with existing payment method' do
          expect(NetworkApi::Subscription).to receive(:create).with(
            organization_id: network_organization.id,
            plan_id: plan.id,
            payment_method_id: payment_method.id,
          )

          organization.update_attributes(deactivated: false)
        end
      end
    end

    describe '#friendly_id' do
      let(:organization) { create(:organization) }

      before do
        organization.save
      end

      it 'generates slug after primary group is saved' do
        expect(
          organization.reload.slug,
        ).to eq(
          organization.primary_group.handle.parameterize,
        )
      end
    end
  end

  describe '#setup_user_membership' do
    let(:user) { create(:user, email: 'jill@ideo.com') }
    let(:guest) { create(:user, email: 'jack@gmail.com') }
    let(:organization) { create(:organization, domain_whitelist: ['ideo.com']) }

    before do
      organization.setup_user_membership(user)
      organization.setup_user_membership(guest)
    end

    it 'adds as an org member if they match the domain' do
      expect(user.has_role?(Role::MEMBER, organization.primary_group)).to be true
      expect(user.has_role?(Role::MEMBER, organization.guest_group)).to be false
    end

    it 'adds as an org guest if they don\'t match the domain' do
      expect(guest.has_role?(Role::MEMBER, organization.primary_group)).to be false
      expect(guest.has_role?(Role::MEMBER, organization.guest_group)).to be true
    end
  end

  describe '#setup_user_membership_and_collections' do
    let(:user) { create(:user, email: 'jill@ideo.com') }
    let!(:organization) do
      create(:organization, domain_whitelist: ['ideo.com'])
    end
    let(:getting_started) { create(:global_collection, name: 'Getting Started', organization: organization) }
    let!(:subcollection_card) { create(:collection_card_collection, parent: getting_started) }
    let(:subcollection) { subcollection_card.collection }
    let!(:sub_subcollection_cards) { create_list(:collection_card_collection, 2, parent: subcollection) }
    let!(:item_cards) { create_list(:collection_card_text, 2, parent: getting_started) }
    let(:user_collection) { user.current_user_collection }

    before do
      # need this to match up for `getting_started?` to work
      organization.update(getting_started_collection: getting_started)
      organization.setup_user_membership_and_collections(user, synchronous: true)
    end

    it 'should copy all cards from getting started into the UserCollection' do
      # should copy all getting_started content (1 collection, 2 items) plus SharedWithMe
      expect(user_collection.collection_cards.count).to eq(4)
      # SharedWithMe card is hidden for now
      expect(user_collection.collection_cards.visible.count).to eq(3)
    end

    it 'should set the Getting Started copy collections to getting_started_shell' do
      gs_copy = user_collection.collections.where(type: nil).last
      expect(gs_copy.cloned_from.parent).to eq getting_started
      # all collections in the copy should be marked with the getting_started_shell attr
      expect(gs_copy.collections.map(&:getting_started_shell).all?).to eq true
    end

    it 'adds as an org member if they match the domain' do
      expect(user.has_role?(Role::MEMBER, organization.primary_group)).to be true
    end

    it 'should set the user to be on the current organization' do
      expect(user.current_organization).to eq(organization)
      expect(user.current_user_collection_id).not_to be nil
    end

    context 'with existing user' do
      it 'should not re-copy all the getting started content' do
        # assume the user has archived their initial content
        user_collection.collection_cards.visible.each(&:archive!)
        expect(user_collection.collection_cards.visible.count).to eq(0)
        # call this again, which will happen e.g. in MassAssign
        organization.setup_user_membership_and_collections(user, synchronous: true)
        expect(user.current_user_collection.collection_cards.visible.count).to eq(0)
      end
    end
  end

  describe '#setup_bot_user_membership' do
    let(:application) { create(:application) }
    let(:user) { application.user }
    let(:organization) { create(:organization) }
    let!(:application_collection) do
      # must have an ApplicationCollection to successfully switch to the org
      Collection::ApplicationCollection.find_or_create_for_bot_user(user, organization)
    end

    it 'should add bot user to the organization' do
      expect(user.has_role?(Role::APPLICATION_USER, organization)).to be false
      organization.setup_bot_user_membership(user)
      expect(user.reload.has_role?(Role::APPLICATION_USER, organization)).to be true
    end

    it 'should set current_organization if none assigned' do
      expect(user.current_organization).to be_nil
      organization.setup_bot_user_membership(user)
      expect(user.current_organization).to eq(organization)
    end
  end

  describe '#remove_user_membership' do
    let(:organization) { create(:organization) }
    let!(:other_org) { create(:organization, member: user) }
    let(:user) { create(:user) }

    before do
      # NOTE: because this call is mocked, we are not *actually* removing them from the org
      allow(Roles::RemoveUserRolesFromOrganization).to receive(:call).and_return(true)
    end

    it 'should call the remove from organization service' do
      expect(Roles::RemoveUserRolesFromOrganization).to receive(:call).with(
        organization,
        user,
      )
      organization.remove_user_membership(user)
    end

    it 'should switch to their first organization' do
      organization.remove_user_membership(user)
      expect(user.current_organization).to eq other_org
    end

    context 'with user profile' do
      let!(:profile) { create(:user_profile, organization: organization, user: user) }

      before do
        # profile_template needs to be present for Collection::UserProfile methods to be called
        organization.update(
          profile_template: create(:collection, master_template: true),
        )
      end

      it 'should archive their profile' do
        organization.remove_user_membership(user)
        expect(profile.reload.archived).to be true
      end

      it 'should unarchive their profile if they rejoin' do
        organization.remove_user_membership(user)
        organization.setup_user_membership(user)
        expect(profile.reload.archived).to be false
      end
    end
  end

  describe '#users.active' do
    let(:member) { create(:user) }
    let(:guest) { create(:user) }
    let(:organization) { create(:organization, member: member, guest: guest) }

    it 'should count the number of users' do
      expect(organization.users.active.count).to eq 2
    end
  end

  describe '#network_organization' do
    let(:organization) { create(:organization) }
    let(:network_organization) { double('network organization') }
    before do
      allow(NetworkApi::Organization).to receive(:find_by_external_id).with(organization.id).and_return(network_organization)
    end

    it 'uses the network api to find the organization' do
      expect(organization.find_or_create_on_network).to equal(network_organization)
    end

    it 'caches the result' do
      expect(NetworkApi::Organization).to receive(:find_by_external_id).once
      organization.find_or_create_on_network
      organization.find_or_create_on_network
    end
  end

  describe '#create_network_organization' do
    let!(:organization) { create(:organization) }

    before do
      allow(NetworkApi::Organization).to receive(:create)
    end

    context 'admin user passed' do
      it 'creates the network organization' do
        admin_user = create(:user)
        organization.create_network_organization(admin_user)
        expect(NetworkApi::Organization).to have_received(:create).with(
          external_id: organization.id,
          name: organization.name,
          admin_user_uid: admin_user.uid,
          enterprise: false,
        )
      end
    end

    context 'admin user not passed' do
      it 'creates the network organization' do
        organization.create_network_organization
        expect(NetworkApi::Organization).to have_received(:create).with(
          external_id: organization.id,
          name: organization.name,
          admin_user_uid: '',
          enterprise: false,
        )
      end
    end
  end

  describe '#find_or_create_on_network' do
    let!(:organization) { create(:organization) }
    let!(:network_organization) { double('network_organization') }

    before do
      allow(NetworkApi::Organization).to receive(:create)
    end

    context 'network organization present' do
      before do
        allow(organization).to receive(:network_organization).and_return(network_organization)
      end

      it 'returns the existing network organization' do
        allow(organization).to receive(:create_network_organization)
        expect(organization.find_or_create_on_network).to eql(network_organization)
        expect(organization).not_to have_received(:create_network_organization)
      end
    end

    context 'network organization not present' do
      it 'creates and returns a new network organization' do
        allow(organization).to receive(:network_organization).and_return(nil)
        allow(organization).to receive(:create_network_organization).and_return(network_organization)
        expect(organization.find_or_create_on_network).to eql(network_organization)
      end
    end
  end

  describe '#create_network_subscription', :vcr do
    let!(:organization) { create(:organization) }
    let!(:network_organization) { double('network_organization', id: 234) }
    let!(:plan) { double('plan', id: 123) }

    before do
      allow(NetworkApi::Plan).to receive(:first).and_return(plan)
      allow(organization).to receive(:network_organization).and_return(network_organization)
    end

    context 'has a payment method' do
      let(:payment_method) { double('payment_method', id: 234) }
      before do
        allow(NetworkApi::PaymentMethod).to receive(:find).with(
          organization_id: network_organization.id,
          default: true,
        ).and_return([payment_method])
      end
      it 'creates a network subscription with the first plan' do
        expect(NetworkApi::Subscription).to receive(:create).with(
          organization_id: network_organization.id,
          plan_id: plan.id,
          payment_method_id: payment_method.id,
        )
        organization.create_network_subscription
      end
    end

    context 'does not have a payment method' do
      before do
        allow(NetworkApi::PaymentMethod).to receive(:find).with(
          organization_id: network_organization.id,
          default: true,
        ).and_return([])
      end

      it 'creates a network subscription with the first plan' do
        expect(NetworkApi::Subscription).to receive(:create).with(
          organization_id: network_organization.id,
          plan_id: plan.id,
        )
        organization.create_network_subscription
      end
    end
  end

  describe 'updating organization name' do
    let!(:organization) { create(:organization) }
    let!(:network_organization) { spy('network_organization') }

    before do
      allow(organization).to receive(:network_organization).and_return(network_organization)
    end

    context 'network organization exists' do
      before do
        allow(network_organization).to receive(:present?).and_return(true)
      end
      it 'updates the name on the network as well' do
        expect(network_organization).to receive(:name=)
        expect(network_organization).to receive(:save)
        organization.update_attributes(name: 'new name')
      end
    end
    context 'network organization does not exist' do
      before do
        allow(organization).to receive(:present?).and_return(false)
      end
      it 'does not try to update the network organization' do
        expect(network_organization).not_to receive(:name=)
        expect(network_organization).not_to receive(:save)
        organization.update_attribute(:name, 'new name')
      end
    end
  end

  describe '#within_trial_period?' do
    let(:organization) { create(:organization) }
    context 'trial_ends_at is set' do
      context 'trial_ends_at is in the future' do
        it 'returns true' do
          organization.trial_ends_at = 1.day.from_now
          expect(organization.within_trial_period?).to be true
        end
      end
      context 'trial_ends_at is in the past' do
        it 'returns false' do
          organization.trial_ends_at = 1.day.ago
          expect(organization.within_trial_period?).to be false
        end
      end
    end
    context 'trial_ends_at is not set' do
      it 'returns false' do
        organization.trial_ends_at = nil
        expect(organization.within_trial_period?).to be false
      end
    end
  end

  describe '#trial_users_exceeded?' do
    it 'returns true when there are more active users than trial users' do
      organization = create(:organization, trial_users_count: 5, active_users_count: 6)
      expect(organization.trial_users_exceeded?).to be true
    end

    it 'returns true when there are the same number of active users and trial users' do
      organization = create(:organization, trial_users_count: 5, active_users_count: 5)
      expect(organization.trial_users_exceeded?).to be false
    end

    it 'returns false when there are fewer active users than trial users' do
      organization = create(:organization, trial_users_count: 6, active_users_count: 5)
      expect(organization.trial_users_exceeded?).to be false
    end
  end

  describe '#update_payment_status' do
    let(:network_organization) { double(id: 123) }

    context 'default payment method exists' do
      let(:organization) { create(:organization, has_payment_method: false, overdue_at: 2.days.ago) }

      before do
        allow(organization).to receive(:network_organization).and_return(network_organization)
        allow(NetworkApi::PaymentMethod).to receive(:find).with(
          organization_id: network_organization.id,
          default: true,
        ).and_return(['a payment method'])
      end

      it 'sets has_payment_method to true' do
        organization.update_payment_status
        expect(organization.has_payment_method).to be true
        expect(organization.overdue_at).to be nil
      end

      it 'sets overdue_at to nil' do
      end
    end

    context 'default payment method does not exist' do
      let(:organization) { create(:organization, has_payment_method: true, overdue_at: 2.days.ago) }

      before do
        allow(organization).to receive(:network_organization).and_return(network_organization)
        allow(NetworkApi::PaymentMethod).to receive(:find).with(
          organization_id: network_organization.id,
          default: true,
        ).and_return([])
      end

      it 'sets has_payment_method to false' do
        organization.update_payment_status
        expect(organization.has_payment_method).to be false
      end

      it 'does not change overdue_at' do
        expect { organization.update_payment_status }.not_to change { organization.overdue_at.round }
      end
    end
  end

  describe '#can_view?' do
    let(:organization) { create(:organization) }
    let(:user) { create(:user) }

    it 'returns true if user has application user role' do
      expect(organization.can_view?(user)).to be false
      user.add_role(Role::APPLICATION_USER, organization)
      expect(organization.can_view?(user)).to be true
    end
  end

  describe '#add_shared_with_org_collections' do
    let(:organization) { create(:organization) }
    let(:user) { create(:user) }
    let(:collection) { create(:collection, organization: organization, shared_with_organization: true) }

    it 'links the collection to the user\'s My Collection' do
      expect(LinkToSharedCollectionsWorker).to receive(:perform_async).with(
        [user.id],
        [],
        [collection.id],
        [],
      )
      organization.add_shared_with_org_collections(user)
    end
  end

  describe '#days_before_payment_added' do
    let(:organization) { create(:organization, has_payment_method: true, created_at: 48.hours.ago) }
    let(:network_organization) { double('network_organization', id: 345) }
    let(:payment_method) { double('payment_method', id: 234, created_at: Time.zone.now) }

    before do
      allow(organization).to receive(:network_organization).and_return(network_organization)
      allow(NetworkApi::PaymentMethod).to receive(:find).with(
        organization_id: network_organization.id,
        default: true,
      ).and_return([payment_method])
    end

    context 'when there is a payment method' do
      it 'returns the number of days between creating org and adding payment method' do
        expect(organization.days_before_payment_added).to eq 2
      end
    end
  end

  describe '#most_used_template_ids' do
    let(:organization) { create(:organization) }
    let(:template) do
      create(:collection,
             add_editors: [organization.primary_group],
            )
    end

    context 'with a template used by org' do
      before do
        ActivityAndNotificationBuilder.new(
          actor: create(:user),
          target: create(:collection),
          action: :template_used,
          source: template,
          organization: organization,
          async: false,
        ).call
      end

      it 'should pull one collection id' do
        expect(organization.most_used_template_ids).to eq([template.id])
      end
    end
  end

  describe '#cache_most_used_template_ids!' do
    let(:organization) { create(:organization) }

    context 'with no templates used yet but templates existing' do
      let!(:template) do
        create(:collection,
               add_editors: [organization.primary_group],
               master_template: true,
               organization: organization,
              )
      end

      before do
        organization.cache_most_used_template_ids!
      end

      it 'should pull set the one template as cached result' do
        expect(organization.reload.cached_5_most_used_template_ids).to eq([template.id])
      end
    end
  end
end

require 'rails_helper'

describe Organization, type: :model do
  context 'validations' do
    it { should validate_presence_of(:name) }
  end

  describe 'billable scope' do
    it 'only includes organizations with in app billing that are not deactivated' do
      billable = create(:organization, in_app_billing: true, deactivated: false)
      in_app_billing_false = create(:organization, in_app_billing: false, deactivated: false)
      deactivated_true = create(:organization, in_app_billing: true, deactivated: true)

      expect(Organization.billable.length).to be 1
      expect(Organization.billable).to include(billable)
      expect(Organization.billable).not_to include(in_app_billing_false)
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
    let(:organization) { create(:organization) }

    describe '#initialize_primary_group' do
      it 'should create primary group with same name as org' do
        expect(organization.primary_group.persisted?).to be true
        expect(organization.primary_group.name).to eq(organization.name)
        expect(organization.primary_group.handle).to eq(organization.name.parameterize)
      end
    end

    describe '#initialize_guest_group' do
      it 'should create guest group with same name as org + Guests' do
        expect(organization.guest_group.persisted?).to be true
        expect(organization.guest_group.name).to eq("#{organization.name} Guests")
        expect(organization.guest_group.handle).to eq("#{organization.name.parameterize}-guest")
      end
    end

    describe '#initialize_admin_group' do
      it 'should create admin group with same name as org + Admins' do
        expect(organization.admin_group.persisted?).to be true
        expect(organization.admin_group.name).to eq("#{organization.name} Admins")
        expect(organization.admin_group.handle).to eq("#{organization.name.parameterize}-admins")
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

        context 'payment method exits' do
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
    let(:getting_started) { create(:global_collection) }
    let!(:subcollection_cards) { create_list(:collection_card_collection, 2, parent: getting_started) }
    let!(:item_cards) { create_list(:collection_card_text, 2, parent: getting_started) }
    let!(:marked_collection) { create(:collection, shared_with_organization: true, organization: organization) }
    let!(:organization) do
      # adding `member: user` will call user.setup_user_membership_and_collections
      marked_collection.update(shared_with_organization: true)
      create(:organization, domain_whitelist: ['ideo.com'], getting_started_collection: getting_started, member: user)
    end

    it 'should create a UserCollection, SharedWithMeCollection, shared with organization collection and Getting Started collection for the user' do
      expect(user.collections.size).to eq(3)
      # SharedWithMe and Getting Started live within the user collection
      expect(user.current_user_collection.collections.size).to eq(3)
    end

    it 'should set the Getting Started copy collections to getting_started_shell' do
      gs_copy = user.current_user_collection.collections.last
      expect(gs_copy.cloned_from).to eq getting_started
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
  end

  describe '#remove_user_membership' do
    let(:organization) { create(:organization) }
    let(:other_org) { create(:organization) }
    let(:user) { create(:user) }

    before do
      user.add_role(Role::MEMBER, other_org.primary_group)
      other_org.setup_user_membership(user)
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

  describe '#calculate_active_users_count!' do
    let(:organization) { create(:organization) }
    let(:pending_user) do
      create(:user, :recently_active, current_organization: organization, status: User.statuses[:pending], first_name: 'pending_user')
    end
    let(:deleted_user) do
      create(:user, :recently_active, current_organization: organization, status: User.statuses[:deleted], first_name: 'deleted_user')
    end
    let(:recently_active_user) do
      create(:user, :recently_active, current_organization: organization, first_name: 'recently_active_user')
    end
    let(:recently_active_guest_user) do
      create(:user, :recently_active, current_organization: organization, first_name: 'recently_active_guest_user')
    end
    let(:not_recently_active_user) { create(:user, first_name: 'not_recently_active_user') }
    let(:not_recently_active_guest_user) { create(:user, first_name: 'not_recently_active_guest_user') }

    before do
      pending_user.add_role(Role::MEMBER, organization.primary_group)
      deleted_user.add_role(Role::MEMBER, organization.primary_group)
      recently_active_user.add_role(Role::MEMBER, organization.primary_group)
      recently_active_guest_user.add_role(Role::ADMIN, organization.guest_group)
      not_recently_active_user.add_role(Role::MEMBER, organization.primary_group)
      not_recently_active_guest_user.add_role(Role::ADMIN, organization.guest_group)
    end

    it 'updates active users count' do
      organization.calculate_active_users_count!
      expect(organization.active_users_count).to eql(2)
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

  describe '#create_network_usage_record' do
    let(:organization) { create(:organization, in_app_billing: true) }
    before do
      allow(organization).to receive(:calculate_active_users_count!)
    end

    context 'in app billing is disabled' do
      it 'does not create a network usage record' do
        organization = create(:organization, in_app_billing: false)
        expect(organization).to receive(:calculate_active_users_count!)
        expect(NetworkApi::UsageRecord).not_to receive(:create)
        expect(organization.create_network_usage_record).to be true
      end
    end

    context 'within trial period with fewer users than limit' do
      before do
        organization.update_attributes(trial_ends_at: 1.day.from_now)
      end
      it 'does not create the network usage record' do
        expect(NetworkApi::UsageRecord).not_to receive(:create)
        expect(organization.create_network_usage_record).to be true
      end
    end

    context 'within trial period with more users than limit' do
      let(:active_users_count) { 100 }
      let(:trial_users_count) { 50 }
      before do
        organization.update_attributes(trial_ends_at: 1.day.from_now, active_users_count: active_users_count)
      end

      it 'creates the network usage record, active_users_count - quantity trial user count' do
        stub_const('Organization::DEFAULT_TRIAL_USERS_COUNT', trial_users_count)
        allow(NetworkApi::UsageRecord).to receive(:create)
        organization.create_network_usage_record
        expect(NetworkApi::UsageRecord).to have_received(:create).with(
          quantity: active_users_count - trial_users_count,
          timestamp: Time.current.end_of_day.to_i,
          external_organization_id: organization.id,
        )
      end
    end

    context 'outside of trial limit' do
      before do
        organization.update_attributes(trial_ends_at: 1.day.ago)
        allow(NetworkApi::UsageRecord).to receive(:create)
        allow(organization).to receive(:calculate_active_users_count!)
      end

      context 'usage record created successfully' do
        it 'returns true' do
          allow(organization).to receive(:active_users_count).and_return(123)
          expect(organization).to receive(:calculate_active_users_count!)
          allow(NetworkApi::UsageRecord).to receive(:create).and_return(true)
          expect(organization.create_network_usage_record).to be true
          expect(NetworkApi::UsageRecord).to have_received(:create).with(
            quantity: 123,
            timestamp: Time.current.end_of_day.to_i,
            external_organization_id: organization.id,
          )
        end
      end

      context 'usage record not created successfully' do
        it 'returns false' do
          allow(organization).to receive(:calculate_active_users_count!)
          allow(organization).to receive(:active_users_count).and_return('bad value')
          allow(NetworkApi::UsageRecord).to receive(:create).and_return(false)
          expect(organization.create_network_usage_record).to be false
        end
      end

      context 'network error' do
        it 'returns false' do
          allow(organization).to receive(:active_users_count).and_return(123)
          allow(NetworkApi::UsageRecord).to receive(:create)
            .and_raise(JsonApiClient::Errors::ServerError.new('an error'))
          expect(organization.create_network_usage_record).to be false
        end
      end
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
end

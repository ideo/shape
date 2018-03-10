require 'rails_helper'

RSpec.describe RoleAssigner, type: :service do
  let(:organization) { create(:organization) }
  let(:item) { create(:item_text) }
  let(:editor) { create(:user) }
  let(:viewer) { create(:user) }
  let(:emails) { [Faker::Internet.email, Faker::Internet.email] }

  # TODO: write test
end

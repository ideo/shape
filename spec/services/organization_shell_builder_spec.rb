require 'rails_helper'

RSpec.describe OrganizationShellBuilder, type: :service do
  describe '#save' do
    let(:builder) do
      OrganizationShellBuilder.new(true)
    end

    it 'should assign an incremented shell name' do
      builder.save
      expect(builder.organization.name).to eq 'shell-0'

      builder = OrganizationShellBuilder.new(true)
      builder.save
      expect(builder.organization.name).to eq 'shell-1'
    end

    it 'should create a blank org' do
      builder.save
      expect(builder.organization.blank).to be true
    end

    it 'should set the active users count to 1' do
      expect(builder.organization.active_users_count).to eq 1
    end
  end
end

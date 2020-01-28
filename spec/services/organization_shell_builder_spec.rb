require 'rails_helper'

RSpec.describe OrganizationShellBuilder, type: :service do
  describe '#save' do
    let(:builder) do
      OrganizationShellBuilder.new
    end

    it 'should assign an incremented shell name' do
      builder.save
      expect(builder.organization.name).to eq 'shell-0'

      builder = OrganizationShellBuilder.new
      builder.save
      expect(builder.organization.name).to eq 'shell-1'
    end

    it 'should create a shell org' do
      builder.save
      expect(builder.organization.shell).to be true
    end

    it 'should create an unassigned user collection' do
      builder.save
      user_collection = Collection::UserCollection.find_by(
        organization: builder.organization,
      )
      expect(user_collection.present?).to be true
    end

    it 'should call organization templates' do
      expect(OrganizationTemplates).to receive(:call).with(
        instance_of(Organization), nil
      )
      builder.save
    end
  end
end

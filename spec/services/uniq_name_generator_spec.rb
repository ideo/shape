require 'rails_helper'

RSpec.describe UniqNameGenerator do
  let(:disallowed_names) { %w[John Mark Paul] }
  let(:generator) { UniqNameGenerator.new(disallowed_names: disallowed_names) }

  context 'when disallowed_names is blank' do
    let(:disallowed_names) { [] }
    before do
      allow(Faker::Name)
        .to receive(:first_name)
        .and_return('Jane')
    end

    it 'should return that name' do
      expect(generator.call).to eq 'Jane'
    end
  end

  context 'when faker picks a uniq name' do
    before do
      allow(Faker::Name)
        .to receive(:first_name)
        .and_return('Jane')
    end

    it 'should return that name' do
      expect(generator.call).to eq 'Jane'
    end
  end

  context 'when faker picks a non-uniq name the first time' do
    before do
      allow(Faker::Name)
        .to receive(:first_name)
        .and_return('Mark', 'Simon')
    end

    it 'should return that name' do
      expect(generator.call).to eq 'Simon'
    end
  end

  context 'when faker returns only non-uniq names' do
    before do
      allow(Faker::Name)
        .to receive(:first_name)
        .and_return('John', 'Mark', 'Paul', 'Mark')
    end

    it 'should return the last try' do
      expect(generator.call).to eq 'Mark'
    end
  end
end

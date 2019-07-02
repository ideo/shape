require 'rails_helper'

describe Commentable, type: :concern do
  it 'should have concern included' do
    expect(Item.ancestors).to include(Commentable)
    expect(Collection.ancestors).to include(Commentable)
  end
end

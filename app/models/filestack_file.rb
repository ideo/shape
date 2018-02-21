class FilestackFile < ApplicationRecord
  has_one :item

  validates :url, :handle, presence: true

  after_destroy :delete_on_filestack

  private

  def delete_on_filestack
    # TODO: write method
  end
end

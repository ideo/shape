class FilestackFile < ApplicationRecord
  has_one :item

  validates :url, :handle, presence: true

  after_create :process_image, if: :image?
  after_destroy :delete_on_filestack

  amoeba do
    enable
  end

  def duplicate!
    ff = amoeba_dup
    ff.save
    ff
  end

  def filename_without_extension
    return if filename.blank?

    filename.sub(/\.\w+$/, '')
  end

  def image?
    mimetype.include?('image')
  end

  private

  def process_image
    # TODO: We will want do decide what kind of post-processing to do on uploaded files
    # docs: https://www.filestack.com/docs/image-transformations
  end

  def delete_on_filestack
    # TODO: write this method
    # docs: https://www.filestack.com/docs/rest-api/remove
  end
end

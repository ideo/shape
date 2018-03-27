class FilestackFile < ApplicationRecord
  has_one :item
  has_one :group
  has_one :organization

  validates :url, :handle, :mimetype, presence: true

  after_create :process_image, if: :image?
  after_destroy :delete_on_filestack

  amoeba do
    enable
    exclude_association :item
    exclude_association :group
    exclude_association :organization
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

  # Create a new filestack file from an external asset
  def self.create_from_url(external_url)
    filelink = api_client.upload(external_url: external_url)
    metadata = filelink.metadata
    create(
      url: filelink.url,
      handle: filelink.handle,
      mimetype: metadata['mimetype'],
      size: metadata['size'],
    )
  end

  # private

  # Docs: https://www.filestack.com/docs/sdks?ruby
  def api_client
    @api_client ||= FilestackClient.new(ENV['FILESTACK_API_KEY'], filestack_security)
  end

  def filestack_security
    FilestackSecurity.new(ENV['FILESTACK_API_SECRET'], options: { call: %w[read store pick] })
  end

  def filestack_filelink
    @filelink ||= FilestackFilelink.new(
      handle: handle,
      apikey: ENV['FILESTACK_API_KEY'],
      security: filestack_security,
    )
  end

  def process_image
    # TODO: We will want do decide what kind of post-processing to do on uploaded files
    # docs: https://www.filestack.com/docs/image-transformations
  end

  def delete_on_filestack
    filestack_filelink.delete
  end
end

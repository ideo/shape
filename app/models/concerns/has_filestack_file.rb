module HasFilestackFile
  extend ActiveSupport::Concern

  included do
    # Removing `dependent: :destroy` because multiple items can share the same filestack_file reference
    belongs_to :filestack_file, optional: true

    accepts_nested_attributes_for :filestack_file

    delegate :url, to: :filestack_file, prefix: true, allow_nil: true
  end

  class_methods do
    def has_filestack_file_options(options)
      if options[:required]
        validates :filestack_file, presence: true
      end
    end

    def filestack_file_attributes_whitelist
      %i[
        url
        handle
        filename
        size
        mimetype
      ]
    end

    def add_filestack_file_column!
      connection.add_column table_name, :filestack_file_id, :integer
    end

    def remove_filestack_file_column!
      connection.remove_column table_name, :filestack_file_id
    end
  end

  def filestack_file_duplicate!(object)
    return object if filestack_file.blank?
    object.filestack_file = filestack_file.duplicate!
    object
  end
end

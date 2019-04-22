class Item
  class FileItem < Item
    has_filestack_file_options required: true
    # e.g. for replace action
    before_update :generate_name, unless: :name_present?

    def image_url
      filestack_file_url
    end

    # TODO: may get rid of this since we're returning the related filestack record?
    def cache_attributes
      if cached_filestack_file_url != filestack_file_url
        self.cached_filestack_file_url = filestack_file_url
      end
      super
    end

    def requires_roles?
      return false if parent.test_collection?
      true
    end

    def mime_base_type
      filestack_file && filestack_file.mimetype.split('/').first
    end

    def mime_ext_type
      filestack_file && filestack_file.mimetype.split('/').last
    end

    def image?
      filestack_file && mime_base_type == 'image'
    end

    def video?
      filestack_file && mime_base_type == 'video'
    end

    def transcode!
      return if filestack_file.blank?
      return if mime_ext_type == 'mp4'
      response = HTTParty.get(filestack_file.video_conversion_url)
      conversion_result = JSON.parse(response.body)
      update(
        pending_transcoding_uuid: conversion_result['uuid'],
      )
    end

    def self.find_by_transcoding_uuid(uuid)
      where("cached_attributes->>'pending_transcoding_uuid' = '#{uuid}'").first
    end

    private

    # on_create callback
    def generate_name
      self.name = filestack_file.filename_without_extension
      truncate_name
    end
  end
end

# == Schema Information
#
# Table name: items
#
#  id                         :bigint(8)        not null, primary key
#  archive_batch              :string
#  archived                   :boolean          default(FALSE)
#  archived_at                :datetime
#  background_color           :string
#  background_color_opacity   :float            default(1.0)
#  breadcrumb                 :jsonb
#  cached_attributes          :jsonb
#  content                    :text
#  data_content               :jsonb
#  data_settings              :jsonb
#  data_source_type           :string
#  icon_url                   :string
#  last_broadcast_at          :datetime
#  legend_search_source       :integer
#  name                       :string
#  question_type              :integer
#  report_type                :integer
#  style                      :jsonb
#  thumbnail_url              :string
#  type                       :string
#  unarchived_at              :datetime
#  url                        :string
#  created_at                 :datetime         not null
#  updated_at                 :datetime         not null
#  cloned_from_id             :bigint(8)
#  data_source_id             :bigint(8)
#  filestack_file_id          :integer
#  legend_item_id             :integer
#  roles_anchor_collection_id :bigint(8)
#
# Indexes
#
#  index_items_on_archive_batch                        (archive_batch)
#  index_items_on_breadcrumb                           (breadcrumb) USING gin
#  index_items_on_cloned_from_id                       (cloned_from_id)
#  index_items_on_created_at                           (created_at)
#  index_items_on_data_source_type_and_data_source_id  (data_source_type,data_source_id)
#  index_items_on_question_type                        (question_type)
#  index_items_on_roles_anchor_collection_id           (roles_anchor_collection_id)
#

class Item
  class FileItem < Item
    has_filestack_file_options required: true
    # e.g. for replace action
    before_update :generate_name, unless: :name_present?

    def image_url
      filestack_file_url
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
      find_by("cached_attributes->>'pending_transcoding_uuid' = '#{uuid}'")
    end

    private

    # on_create callback
    def generate_name
      self.name = filestack_file.filename_without_extension
      truncate_name
    end
  end
end

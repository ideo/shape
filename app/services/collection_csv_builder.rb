require 'csv'

class CollectionCSVBuilder < SimpleService
  include Rails.application.routes.url_helpers
  include ApplicationHelper

  def initialize(collection)
    @collection = collection
  end

  def call
    CSV.generate do |csv|
      csv << %w[
        id
        type
        name
        created_by_name
        created_by_email
        content
        data_content
        col
        row
        height
        width
        url
        image_url
        shape_url
        shape_csv_url
      ]

      row = [
        @collection.id,
        @collection.type || 'Collection',
        @collection.name,
        @collection.created_by&.name,
        @collection.created_by&.email,
        nil,
        nil,
        nil,
        nil,
        nil,
        nil,
        nil,
        nil,
        url_for(@collection),
        csv_url_for(@collection),
      ]

      csv << row

      @collection.collection_cards.find_each do |card|
        csv << card_row(card)
      end

      next unless @collection.is_a?(Collection::SubmissionBox)

      @collection.submissions_collection.collection_cards.find_each do |card|
        csv << card_row(card)
      end
    end
  end

  private

  def card_row(card)
    record = card.record
    record_type = record&.type
    record_type = record.class.name if record_type.nil? && record.present?

    [
      card.id,
      record_type,
      card.name,
      record.try(:created_by)&.name,
      record.try(:created_by)&.email,
      record.try(:content),
      record.try(:data_content),
      card.col,
      card.row,
      card.height,
      card.width,
      record.try(:url),
      record.try(:image_url),
      url_for(record),
      csv_url_for(record),
    ]
  end

  def org_slug
    @org_slug ||= @collection.organization.slug
  end

  def url_for(obj)
    return nil unless obj.present?

    frontend_url_for(obj, slug: org_slug)
  end

  def csv_url_for(coll)
    return nil unless coll&.is_a?(Collection)

    "#{root_url}api/v1/collections/#{coll.id}/csv"
  end

  def default_url_options
    Rails.application.config.action_mailer.default_url_options
  end
end

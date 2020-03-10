require "google/cloud/language"

class CollectionAutotagger < SimpleService
  MIN_TEXT_LENGTH = 20
  MIN_SALIENCE = 0.10

  def initialize(collection)
    @collection = collection
  end

  def call
    @collection.collection_cards.includes(:item, :collection).each do |card|
      if card.collection.present?
        collection = card.collection
        collection.tag_list = collection.tag_list | tags_for_collection(collection)
        collection.update_cached_tag_lists
        collection.save
      else
        item = card.item
        item.tag_list = item.tag_list | tags_for_item(item)
        item.save
      end
    end
  end

  private

  def tags_for_item(item)
    # We currently don't pull any metadata for a file item so analyzing it isn't very effective
    return [] if Item.is_a?(Item::FileItem)

    text = text_from_item(item)
    return [] if text.blank? || text.size < MIN_TEXT_LENGTH

    entities_for_text(
      text_from_item(item),
    ).map(&:name).map(&:downcase)
  end

  def tags_for_collection(collection)
    collection.items.map do |item|
      tags_for_item(item)
    end.flatten.compact
  end

  def text_from_item(item)
    content = item.is_a?(Item::TextItem) ? item.plain_content : item.content

    [item.name, content].compact.join(' ')
  end

  def entities_for_text(text)
    # entities have name, type, salience, metadata["wikipedia_url"]
    entities = client.analyze_entities(content: text, type: :PLAIN_TEXT).entities.first(5)
    # Reject if salience (relevance) is too low
    entities.select do |entity|
      entity.salience >= MIN_SALIENCE &&
        # Ignore people, unless it's a famous person with a wikipedia_url
        (entity.type != :PERSON || entity.metadata['wikipedia_url'].present?)
    end
  end

  def client
    @client ||= Google::Cloud::Language.new(credentials: google_auth_credentials)
  end

  def google_auth_credentials
    Google::Auth::Credentials.new(
      JSON.parse(ENV['GOOGLE_CLOUD_KEYFILE']),
      scope: %w[
        https://www.googleapis.com/auth/cloud-platform
        https://www.googleapis.com/auth/cloud-language
        https://www.googleapis.com/auth/identitytoolkit
        https://www.googleapis.com/auth/userinfo.email
      ],
    )
  end
end

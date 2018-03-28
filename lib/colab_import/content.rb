# Imports CoLab concept database

module ColabImport
  class CreateCollections
    attr_reader :collections, :failed

    def initialize(path_to_json:, organization:, template_collection:, editor:)
      @data = JSON.parse(File.read(path_to_json))
      @template_collection = template_collection
      @editor = editor
      @failed = []
      @collections = []
    end

    def call(only_uids = [])
      concepts_to_copy = concepts_by_session(only_uids)
      create_collections_for_concepts(concepts_to_copy)
    end

    private

    def create_collections_for_concepts(concepts_by_session)
      concepts_by_session.each do |session_name, concepts|
        # Create collection for session
        create_collection!(session_name)

        concepts.each do |concept|
          # Create the card for this sub-collection
          create_collection_card!(session_collection)

          # Clone the template for this sub-collection
          cloned = clone_template!

          # Create card for this subcollection
          puts "Adding concept: #{concept['uid']} - #{concept['title']}"
          media = media_items(concept['media'].values)
          concept = CreateConcept.new(
            data: concept,
            collection: cloned,
            media_items: media,
          )
          if concept.call
            @collections << cloned
          else
            @failed << concept
          end
        end
      end
    end

    def create_collection!(name)
      collection = Collection.create(
        organization: organization,
        name: session,
      )

      unless collection.persisted?
        raise_error("Failed to create collection named #{name}", collection)
      end

      collection
    end

    def create_collection_card!(collection)
      card = CollectionCardBuilder.new(
        params: {},
        collection: collection,
        user: @editor,
      ).create

      unless card.persisted?
        raise_error('Failed to create card for sub-collection', card)
      end

      card
    end

    def clone_template_to_card!(card)
      collection = template_collection.duplicate!(
        for_user: @editor,
        copy_parent_card: false,
      )

      unless collection.persisted?
        raise_error('Failed to clone template', collection)
      end

      unless card.update_attributes(collection: collection)
        raise_error('Failed to update card with new cloned collection', card)
      end

      collection
    end

    def concepts_by_session(only_uids = [])
      data['concepts'].values.each_with_object({}) do |concept, h|
        next if only_uids.present? &&
                !only_uids.include?(concept['uid'])

        h[concept.session_year_quarter] ||= []
        h[concept.session_year_quarter] << concept
      end
    end

    # media is in the format:
    # key => { key => { item}, key => { item } }
    def media_items(with_names)
      data['media'].each_with_object({}) do |(key, values), h|
        next unless with_names.include?(data['key'])

        values.each_value do |k, v|
          h[k] = v
        end
      end
    end

    # Not in use at the moment
    def articles
      data['articles']
    end

    def raise_error(message, object)
      StandardError.new("#{message}: #{object.errors.full_messages.join('. ')}")
    end
  end

  class CreateConcept
    def initialize(data:, collection:, media_items: [])
      @data = data
      @collection = collection
      @media_items = media_items
    end

    def call
      update_collection_cards_with_data &&
        add_media &&
        update_title &&
        add_tags
    end

    def uid
      @data['uid']
    end

    # e.g. Q3 2016
    def session_year_quarter
      "#{@data['session']['season']} #{@data['session']['year']}"
    end

    def media_item_names
      @data['media'].values
    end

    # private

    def add_tags
      @collection.update_attributes(
        tag_list: tags.join(', '),
      )
    end

    def update_title
      @collection.update_attributes(
        title: title,
      )
    end

    def add_media
      return true unless @media_items.present?

      @media_items.all? do |item|
        card = CollectionCardBuilder.new(
          params: {},
          collection: @collection,
        )
        unless card.create
          raise "Could not create card for media: #{card.errors.join('. ')}"
        end

        # Add this media item to the card
        media_item = item.create(card)

        unless media_item.persisted?
          raise "Could not create media item on card: #{media_item.errors.full_messages.join('. ')}"
        end

        true
      end
    end

    def update_collection_cards_with_data
      i = -1
      collection_cards.all? do |card|
        update_method = "update_card_#{i += 1}".to_sym
        unless respond_to?(update_method)
          raise "ColabConcept needs to implement update_card_#{i}"
        end
        send(update_method, card)
      end
    end

    def collection_cards
      @collection
        .collection_cards
        .ordered
        .includes(:item)
    end

    # Desc
    def update_card_0(card)
      html_elements = ["<p>#{description}</p>"]
      update_text_item(card.item, html_elements)
    end

    # Hero Image
    def update_card_1(card)
      card.item.update_attributes(
        name: image_alt,
        filestack_file: FilestackFile.upload_and_create(image_url),
      )
    end

    # Links + github url
    def update_card_2(card)
      html_elements = "<h3>Links></h3>"
      html_elements += links.map do |title, url|
        "<p><a href=\"#{url}\">#{title}</a></p>"
      end
      if github_url.present?
        # Note: this may be other urls, like drive or dropbox
        html_elements << "<p><a href=\"#{github_url}\">#{github_url}</a></p>"
      end
      update_text_item(card.item, html_elements)
    end

    # How might we
    def update_card_3(card)
      html_elements = ["<h3>#{how_might_we}</h3>"]
      update_text_item(card.item, html_elements)
    end

    # What did we learn?
    def update_card_4(card)
      html_elements = ['<h3>What Did We Learn?</h3>']
      html_elements += insights.map { |insight| "<p>#{insight}</p>" }
      update_text_item(card.item, html_elements)
    end

    # Why did we build it?
    def update_card_5(card)
      html_elements = ['<h3>Why Did We Build It?</h3>']
      html_elements += "<p>#{why_did_we_build_it}</p>"
      update_text_item(card.item, html_elements)
    end

    # Video
    def update_card_6(card)
      # TODO: what should we put in this card if no video?
      return true unless video_url.present?

      card.item.update_attributes(
        name: video_alt,
        url: video_url,
        thumbnail_url: video_image_url,
        # TODO: once we make video covers filestack files, create it here:
        # filestack_file: FilestackFile.upload_and_create(video_image_url),
      )
    end

    # The Story
    def update_card_7(card)
      html_elements = ['<h3>The Story</h3>', "<p>#{content_body}</p>"]
      update_text_item(card.item, html_elements)
    end

    # The Team
    def update_card_8(card)
      html_elements = ['<h3>Team</h3>']
      html_elements += team_member_names.map { |name| "<p>#{name}</p>" }
      update_text_item(card.item, html_elements)
    end

    def update_text_item(item, html_elements)
      item.content = html_elements.join('')
      inserts = html_elements.map { |html| { 'insert': html } }
      item.text_data = { 'ops': inserts }
      item.save
    end

    # e.g. BOS: Food + Future
    def session_location_title
      "#{@data['session']['location']}: #{@data['session']['title']}"
    end

    def title
      @data['title']
    end

    def subtitle
      @data['subtitle']
    end

    def insights
      @data['content']['insights'].values
    end

    # Short description
    def description
      @data['card']['desc'] || @data['desc']
    end

    # Longer description
    def content_body
      @data['content']['body']
    end

    # aka the 'how might we'
    def how_might_we
      @data['content']['calloutBody']
    end

    # Returns hash of { title: url } - title may also be URL
    def links
      vals = @data['content']['links']

      return [] if vals.blank?
      return vals if vals.is_a?(Hash)

      # Links is an array, so build a hash
      @data['content']['links'].each_with_object({}) do |link, h|
        h[link] = link
      end
    end

    def why_did_we_build_it
      @data['content']['why']
    end

    def tags
      return [] if @data['tags'].blank?
      @data['tags'].split('#').map(&:strip)
    end

    def image_url
      @data['card']['thumb']
    end

    def image_alt
      @data['card']['thumbAlt']
    end

    def video_url
      @data['hero']['video'] # has attrs: image, imageAlt, title, video (often null)
    end

    def video_alt
      @data['hero']['imageAlt']
    end

    def video_image_url
      @data['hero']['image']
    end

    def github_url
      @data['content']['github']
    end

    def team_member_names
      @data['team'].values
    end

    # e.g. health, core tech
    def domains
      @data['domains'].values
    end

    def tech
      # e.g. IOT, AI
      return [] if @data['tech'].blank?
      @data['tech'].values
    end
  end

  class BuildMediaItem
    attr_reader :item

    def initialize(data:)
      @data = data
      @item = nil
    end

    # Creates a new item for a given collection card
    def create(collection_card)
      raise "Unsupported media item type: #{type}" unless type == 'image'

      @item = collection_card.create_item(
        name: name,
        filestack_file: FilestackFile.upload_and_create(image_url),
      )
    end

    private

    # All 'types' seemed to be image
    def type
      @data['type']
    end

    def image_url
      @data['source']
    end

    def name
      @data['desc']
    end
  end
end

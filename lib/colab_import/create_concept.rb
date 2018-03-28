module ColabImport
  class CreateConcept
    def initialize(data:, collection:, media_items: [])
      @data = data
      @collection = collection
      @media_items = media_items
    end

    def call
      return false if skip_import?
      update_collection_cards_with_data &&
        create_and_add_media &&
        update_name &&
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

    def skip_import?
      @data['content'].blank? ||
      @data['card'].blank? ||
      @data['hero'].blank?
    end

    def add_tags
      @collection.update_attributes(
        tag_list: tags.join(', '),
      )
    end

    def update_name
      @collection.update_attributes(
        name: title,
      )
    end

    def create_and_add_media
      return true unless @media_items.present?

      @media_items.all? do |item|
        create_item = CreateMediaItem.new(data: item)

        unless create_item.call
          raise "Could not create image item on card: #{create_item.errors.full_messages.join('. ')}"
        end

        builder = CollectionCardBuilder.new(
          params: { item_id: create_item.item.id },
          parent_collection: @collection,
        )
        unless builder.create
          raise "Could not create card for media: #{builder.errors.full_messages.join('. ')}"
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
        .active
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
        filestack_file: FilestackFile.first # FilestackFile.create_from_url(image_url),
      )
    end

    # Links + github url
    def update_card_2(card)
      html_elements = ["<h3>Links></h3>"]
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
      html_elements << "<p>#{why_did_we_build_it}</p>"
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
        # filestack_file: FilestackFile.create_from_url(video_image_url),
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
      return [] if @data['content']['insights'].blank?
      @data['content']['insights']
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
      @data['team'].try(:values) || []
    end
  end
end

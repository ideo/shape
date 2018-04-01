module ColabImport
  class CreateConcept
    def initialize(data:, collection:, media_items: [])
      @data = data
      @collection = collection
      @media_items = media_items
    end

    def call
      return false if skip_import?
      update_name_and_tags &&
        update_collection_cards_with_data &&
        create_and_add_media &&
        recalculate_breadcrumbs
    end

    def summary
      return "UID: #{uid} -- Skipping import" if skip_import?
      "UID: #{uid}
      Title: #{title}
      Desc: #{(description || '').first(40)}
      Hero Image: #{image_url}
      Video URL: #{video_url}
      HMW: #{(how_might_we || '').first(40)}
      Tags: #{tags.join(', ')}
      "
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

    private

    def skip_import?
      @data['content'].blank? ||
        @data['card'].blank? ||
        @data['hero'].blank?
    end

    def update_name_and_tags
      @collection.name = "#{title} | #{uid}"
      @collection.tag_list = tags.join(', ') unless tags.blank?
      @collection.save
    end

    def create_and_add_media
      return true unless @media_items.present?

      order = collection_cards.last.order

      @media_items.each do |item|
        create_item = CreateMediaItem.new(data: item)

        unless create_item.call
          raise_error("Could not create image item on card: #{create_item.errors.full_messages.join('. ')}")
        end

        builder = CollectionCardBuilder.new(
          params: { item_id: create_item.item.id, order: order += 1 },
          parent_collection: @collection,
        )
        unless builder.create
          raise_error("Could not create card for media: #{builder.errors.full_messages.join('. ')}")
        end
      end

      # We've had many issues importing them, so return true no matter what
      true
    end

    def recalculate_breadcrumbs
      @collection.reload
      @collection.recalculate_breadcrumb!
      @collection.items.each(&:recalculate_breadcrumb!)
      true
    end

    def update_collection_cards_with_data
      i = -1
      collection_cards.all? do |card|
        update_method = "update_card_#{i += 1}".to_sym
        unless respond_to?(update_method, true)
          raise_error("needs to implement update_card_#{i}")
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

    ## BEGIN content replacement methods

    # Desc
    def update_card_0(card)
      text_ops = build_text_operations(content: description)
      update_text_item(card.item, text_ops)
    end

    # Hero Image
    def update_card_1(card)
      if image_url.present? && UrlExists.new(image_url).call
        card.item.update_attributes(
          name: image_alt,
          filestack_file: FilestackFile.create_from_url(image_url),
        )
      else
        change_card_to_placeholder(card)
      end
    end

    # Links + github url
    def update_card_2(card)
      if links.blank? && github_url.blank?
        change_card_to_placeholder(card)
      else
        text_ops = build_text_operations(content: 'Links', header: true)
        links.each do |title, url|
          text_ops += build_text_operations(content: title, url: url)
        end
        if github_url.present?
          # Note: this may be other urls, like drive or dropbox
          text_ops += build_text_operations(content: github_url, url: github_url)
        end
        update_text_item(card.item, text_ops)
      end
    end

    # How might we
    def update_card_3(card)
      return change_card_to_placeholder(card) if how_might_we.blank?

      # Add three newlines above text
      text_ops = Array.new(3) { build_text_operations }.flatten
      text_ops += build_text_operations(content: how_might_we, header: true)
      update_text_item(card.item, text_ops)
    end

    # What did we learn?
    def update_card_4(card)
      return change_card_to_placeholder(card) if insights.blank?

      text_ops = build_text_operations(content: 'What Did We Learn?', header: true)
      insights.each do |insight|
        text_ops += build_text_operations(content: insight)
      end
      update_text_item(card.item, text_ops)
    end

    # Why did we build it?
    def update_card_5(card)
      return change_card_to_placeholder(card) if why_did_we_build_it.blank?

      text_ops = build_text_operations(content: 'Why Did We Build It?', header: true)
      text_ops += build_text_operations(content: why_did_we_build_it)
      update_text_item(card.item, text_ops)
    end

    # Video
    def update_card_6(card)
      return change_card_to_placeholder(card, 'video') if video_url.blank?

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
      return change_card_to_placeholder(card) if content_body.blank?

      text_ops = build_text_operations(content: 'The Story', header: true)
      text_ops += build_text_operations(content: content_body)
      update_text_item(card.item, text_ops)
    end

    # The Team
    def update_card_8(card)
      return change_card_to_placeholder(card) if team_member_names.blank?

      text_ops = build_text_operations(content: 'Team', header: true)
      team_member_names.each do |name|
        text_ops += build_text_operations(content: name)
      end
      update_text_item(card.item, text_ops)
    end

    ## END content replacement methods

    def update_text_item(item, text_operations)
      return true if text_operations.blank?
      item.content = text_operations_to_html(text_operations)
      item.text_data = { 'ops' => text_operations }
      # Use only the first line for the name
      item.name = item.plain_content(only_first_line: true)
      item.save
    end

    def build_text_operations(content: nil, header: false, url: nil)
      ops = []

      if content.present?
        # Add content, stripping any existing html tags
        # For some reason the string is frozen, so need to dupe it
        content = { 'insert' => StripTags.new(content.dup).call }
        content['attributes'] = { 'link' => url } if url.present?
        ops << content
      end

      newline = { 'insert' => "\n" }
      newline['attributes'] = { 'header' => 3 } if header
      ops << newline

      ops
    end

    def change_card_to_placeholder(card, placeholder_image_name = nil)
      placeholder_image_url = random_placeholder_image_url(placeholder_image_name)
      # Previously I had tried destroying the item and creating a new one,
      # but then you have to copy over roles - so just clear out the item
      item = card.item.becomes(Item::ImageItem)
      item.type = 'Item::ImageItem'
      item.name = 'CoLab'
      item.breadcrumb = item.content = item.image = item.url = item.text_data = item.thumbnail_url = nil
      item.filestack_file = FilestackFile.create_from_url(placeholder_image_url)
      item.save
      card.item = item
      card.save
      true
    end

    # Use if we don't have content for an item
    # Makes sure it doesn't return the same image twice in a row
    # Placeholders that exist: 1.png, 2.png, 3.png, 4.png and video.png
    def random_placeholder_image_url(placeholder_image_name = nil)
      if placeholder_image_name.blank?
        # Generate a random name, and ensure it is unique
        placeholder_image_name = generate_random_name
        while placeholder_image_name == @last_random_name
          placeholder_image_name = generate_random_name
        end
        @last_random_name = placeholder_image_name
      end

      "https://s3-us-west-2.amazonaws.com/assets.shape.space/colab/placeholders/#{placeholder_image_name}.png"
    end

    def generate_random_name
      rand(1..4)
    end

    def text_operations_to_html(text_operations)
      text_operations.map do |op|
        if op['insert'] == "\n"
          nil
        elsif op['attributes'].blank?
          "<p>#{op['insert']}</p>"
        elsif op['attributes']['header'].present?
          "<h3>#{op['insert']}</h3>"
        elsif op['attributes']['link'].present?
          "<a href=\"#{op['attributes']['link']}\">#{op['insert']}</a>"
        end
      end.compact.join("\n")
    end

    # e.g. BOS: Food + Future
    def session_location_title
      "#{@data['session']['location']}: #{@data['session']['title']}"
    end

    def title
      @data['title'] || @data['uid']
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
      return if @data['content'].blank?
      @data['content']['calloutBody']
    end

    # Returns hash of { title: url } - title may also be URL
    def links
      vals = @data['content']['links']

      return [] if vals.blank?
      return vals if vals.is_a?(Hash)

      # Links is an array, so build a hash
      @data['content']['links'].each_with_object({}) do |link, h|
        # Note: links can be malformed, and be title : url
        if link.include?(': h')
          title, url = link.split(' : ').map(&:strip)
        else
          title, url = [link, link]
        end
        h[title] = url
      end
    end

    def why_did_we_build_it
      @data['content']['why']
    end

    def tags
      return [] if @data['tags'].blank?
      @data['tags'].split('#').delete_if(&:blank?).map(&:strip)
    end

    def image_url
      @data['card']['thumb']
    end

    def image_alt
      @data['card']['thumbAlt']
    end

    def video_url
      return if @data['hero'].blank?
      @data['hero']['video'] # has attrs: image, imageAlt, title, video (often null)
    end

    def video_alt
      return if @data['hero'].blank?
      @data['hero']['imageAlt']
    end

    def video_image_url
      return if @data['hero'].blank?
      @data['hero']['image']
    end

    def github_url
      @data['content']['github']
    end

    def team_member_names
      return [] if @data['team'].blank?
      @data['team']
    end

    def raise_error(message)
      raise "#{self.class.name} #{message}"
    end
  end
end

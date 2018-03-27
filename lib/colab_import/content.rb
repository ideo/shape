# Imports CoLab concept database

module ColabImport
  class CreateCollections
    attr_reader :collections, :failed

    def initialize(path_to_json:, template_collection:, editor:)
      @data = JSON.parse(File.read(path_to_json))
      @template_collection = template_collection
      @editor = editor
      @failed = []
      @collections = []
    end

    def call(only_uids = [])
      concepts_to_copy = concepts(only_uids)
      create_collections_for_concepts(concepts_to_copy)
    end

    private

    def create_collections_for_concepts(concepts)
      concepts.each do |concept|
        cloned = clone_template!
        unless cloned.persisted?
          raise "Failed to clone template: #{cloned.errors.full_messages.join(' ')}"
        end
        puts "Adding concept: #{concept['uid']} - #{concept['title']}"
        if CreateConcept.new(
          data: concept,
          collection: cloned,
        ).call
          @collections << cloned
        else
          @failed << concept
        end
      end
    end

    def clone_template!
      template_collection.duplicate!(
        for_user: @editor,
        copy_parent_card: false,
      )
    end

    def concepts(only_uids = [])
      data['concepts'].values.select do |concept|
        only_uids.blank? ||
          only_uids.include?(concept['uid'])
      end
    end

    def articles
      data['articles']
    end

    def media
      data['media']
    end
  end

  class CreateConcept
    def initialize(data:, collection:)
      @data = data
      @collection = collection
    end

    def call
      return false unless update_collection_cards_with_data
      add_tags
    end

    def uid
      @data['uid']
    end

    # private

    def add_tags
      @collection.update_attributes(
        tag_list: tags.join(', '),
      )
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

    # Title & Desc
    def update_card_0(card)
      html_elements = ["<h3>#{title}</h3>", "<p>#{description}</p>"]
      update_text_item(card.item, html_elements)
    end

    # Hero Image
    def update_card_1(card)
      card.item.update_attributes(
        name: image_alt,
        filestack_file: create_filestack_file(image_url),
      )
    end

    # How might we
    def update_card_2(card)
      html_elements = ["<h3>#{how_might_we}</h3>"]
      update_text_item(card.item, html_elements)
    end

    # Links + github url
    def update_card_3(card)
      html_elements = links.each do |title, url|
        "<p><a href=\"#{url}\">#{title}</a></p>"
      end
      if github_url.present?
        html_elements << "<p><a href=\"#{github_url}\">#{github_url}</a></p>"
      end
      update_text_item(card.item, html_elements)
    end

    # Video
    def update_card_4(card)
      # TODO: what should we put in this card if no video?
      return true unless video_url.present?

      card.item.update_attributes(
        name: video_alt,
        url: video_url,
        thumbnail_url: video_image_url,
        filestack_file: create_filestack_file(video_image_url),
      )
    end

    # The Story
    def update_card_5(card)
      html_elements = ['<h3>The Story</h3>', "<p>#{content_body}</p>"]
      update_text_item(card.item, html_elements)
    end

    # What did we learn?
    def update_card_6(card)
      html_elements = ['<h3>What Did We Learn?</h3>']
      html_elements += insights.map { |insight| "<p>#{insight}</p>" }
      update_text_item(card.item, html_elements)
    end

    # Why did we build it?
    def update_card_7(card)
      html_elements = ['<h3>Why Did We Build It?</h3>']
      html_elements += "<p>#{why_did_we_build_it}</p>"
      update_text_item(card.item, html_elements)
    end

    def update_text_item(item, html_elements)
      item.content = html_elements.join('')
      inserts = html_elements.map { |html| { 'insert': html } }
      item.text_data = { 'ops': inserts }
      item.save
    end

    def create_filestack_file(url)
      FilestackFile.upload_and_create(url)
    end

    # e.g. Q3 2016
    def session_year_quarter
      "#{@data['session']['season']} #{@data['session']['year']}"
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
end

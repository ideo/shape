# Imports CoLab concept database

module ColabImport
  class Content
    def initialize(json_string:, template_collection:, editor:)
      @data = Hashie::JSON.parse(json_string)
      @template_collection = template_collection
      @editor = editor
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
        if cloned.persisted?
          puts "Adding concept: #{concept}"
          concept.populate_collection(cloned)
          @collections << cloned
        else
          raise "Failed to clone template: #{cloned.errors.full_messages.join(' ')}"
        end
      end
    end

    def clone_template!
      template_collection.duplicate!(
        for_user: @editor,
        copy_parent_card: false
      )
    end

    def concepts(only_uids = [])
      data['concepts'].values.map do |concept|
        next if only_uids.present? &&
             !only_uids.include?(concept.uid)
        Concept.new(concept)
      end
    end

    def articles
      data['articles']
    end

    def media
      data['media']
    end
  end

  class Concept
    def initialize(concept:)
      @concept = concept
    end

    def populate_collection(collection)
      update_collection_cards(collection)
      collection.tag_list = tags.join(', ')
      collection.save
      collection
    end

    def to_s
      "#{uid} - #{title}"
    end

    def uid
      @concept['uid']
    end

    # private

    def update_collection_cards
      collection
      .collection_cards
      .ordered
      .includes(:item)
      .each_with_index do |card, i|
        method = "update_card_#{i}".to_sym
        if respond_to?(method)
          send("update_card_#{i}", card)
        else
          raise "ColabConcept needs to implement update_card_#{i}"
        end
      end
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
        filestack_file: create_filestack_file(image_url)
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
      if video_url.present?
        card.item.update_attributes(
          name: video_alt,
          url: video_url,
          thumbnail_url: video_image_url,
          filestack_file: create_filestack_file(video_image_url)
        )
      else
        # ???
      end
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
      "#{@concept['session']['season']} #{@concept['session']['year']}"
    end

    # e.g. BOS: Food + Future
    def session_location_title
      "#{@concept['session']['location']}: #{@concept['session']['title']}"
    end

    def title
      @concept['title']
    end

    def subtitle
      @concept['subtitle']
    end

    def insights
      @concept['content']['insights'].values
    end

    # Short description
    def description
      @content['card']['desc'] || @concept['desc']
    end

    # Longer description
    def content_body
      @concept['content']['body']
    end

    # aka the 'how might we'
    def how_might_we
      @concept['content']['calloutBody']
    end

    # Returns hash of { title: url } - title may also be URL
    def links
      vals = @concept['content']['links']

      return [] if vals.blank?
      return vals if vals.is_a?(Hash)

      # Links is an array, so build a hash
      @concept['content']['links'].each_with_object({}) do |link,h|
        h[link] = link
      end
    end

    def why_did_we_build_it
      @concept['content']['why']
    end

    def tags
      return [] if @concept['tags'].blank?
      @concept['tags'].split('#').map(&:strip)
    end

    def image_url
      @concept['card']['thumb']
    end

    def image_alt
      @concept['card']['thumbAlt']
    end

    def video_url
      @concept['hero']['video'] # has attrs: image, imageAlt, title, video (often null)
    end

    def video_alt
      @concept['hero']['imageAlt']
    end

    def video_image_url
      @concept['hero']['image']
    end

    def github_url
      @concept['content']['github']
    end

    def team_member_names
      @concept['team'].values
    end

    # e.g. health, core tech
    def domains
      @concept['domains'].values
    end

    def tech
      # e.g. IOT, AI
      return [] if @concept['tech'].blank?
      @concept['tech'].values
    end
  end
end

# Imports CoLab concept database

module ColabImport
  class CreateCollections
    attr_reader :collections, :root_collection, :failed

    def initialize(path_to_json:, organization:, template_collection:, editor:, only_uids: [], root_collection: nil)
      @data = JSON.parse(File.read(path_to_json))
      @template_collection = template_collection
      @organization = organization
      @editor = editor
      @root_collection = root_collection
      @concepts_by_session = find_concepts_by_session(only_uids)
      @session_collections_by_name = {}
      @failed = []
      @collections = []
    end

    def call
      create_root_collection unless @root_collection.present?
      assign_roles_to_root
      find_or_create_session_collections
      create_collections_for_concepts
      @root_collection
    end

    def print_concepts
      @concepts_by_session.each do |session_name, concepts|
        puts "SESSION: #{session_name}\n\n"
        concepts.each do |concept|
          puts CreateConcept.new(
            data: concept,
            collection: Collection.new,
          ).summary
          puts '-' * 10
        end
        puts "\n\n\n"
      end
    end

    private

    def create_collections_for_concepts
      @concepts_by_session.each do |session_name, concepts|
        session_collection = @session_collections_by_name[session_name]
        concepts.each do |concept_data|
          concept = CreateConcept.new(
            data: concept_data,
            template: @template_collection,
            editor: @editor,
          )
          existing_collection = session_collection.collections.find_by(name: concept.name)
          if existing_collection.present?
            @collections << existing_collection
          else
            # Update the collection and all it's items
            media = media_items(concept.media_item_names)
            if concept.call(media_items: media)
              concept_collection = concept.collection
              # Create the card for this sub-collection
              create_collection_card(parent: session_collection, collection: concept_collection)
              @collections << concept_collection
            else
              @failed << concept.collection
            end
          end
        end
      end
    end

    def create_root_collection
      collection = Collection.create(
        organization: @organization,
        name: "Concept Database - #{Time.now.to_s}",
      )

      unless collection.persisted?
        raise_error("Failed to create root collection", collection)
      end

      @root_collection = collection
    end

    def find_or_create_session_collections
      session_names = @concepts_by_session.keys
      @session_collections_by_name = session_names.each_with_object({}) do |name, h|
        session_collection = root_collection.collections.find_by_name(name)
        session_collection ||= create_session_collection(name)
        h[name] = session_collection
      end
    end

    def create_session_collection(name)
      collection = Collection.create(
        organization: @organization,
        name: name,
      )

      unless collection.persisted?
        raise_error("Failed to create collection named #{name}", collection)
      end

      builder = CollectionCardBuilder.new(
        params: { collection_id: collection.id },
        parent_collection: @root_collection,
        user: @editor,
      )

      unless builder.create
        raise_error("Failed to create card for session collection named #{name}", builder.collection_card)
      end

      collection
    end

    def create_collection_card(parent:, collection:)
      card = CollectionCardBuilder.new(
        params: { collection_id: collection.id },
        parent_collection: parent,
        user: @editor,
      )

      unless card.create
        raise_error('Failed to create card for sub-collection', card)
      end

      card
    end

    def assign_roles_to_root
      # Copy roles from template collection to root
      @template_collection.roles.each do |role|
        assign_role = Roles::MassAssign.new(
          object: @root_collection,
          role_name: role.name,
          users: role.users,
          propagate_to_children: true,
          synchronous: true,
        )
        unless assign_role.call
          raise "Could not assign role to items: #{role.name}"
        end
      end
    end

    def find_concepts_by_session(only_uids = [])
      @data['concepts'].values.each_with_object({}) do |concept, h|
        next if only_uids.present? &&
                !only_uids.include?(concept['uid'])

        session_year_quarter = "#{concept['session']['season']} #{concept['session']['year']}"
        h[session_year_quarter] ||= []
        h[session_year_quarter] << concept
      end
    end

    # media is in the format:
    # key => { key => { item}, key => { item } }
    def media_items(with_names)
      @data['media'].map do |(key, values)|
        next unless with_names.include?(key)

        values.map do |k, v|
          v
        end
      end.flatten.compact
    end

    # Not in use at the moment
    def articles
      @data['articles']
    end

    def raise_error(message, object)
      raise "#{self.class.name} #{message}: #{object.errors.full_messages.join('. ')}"
    end
  end
end

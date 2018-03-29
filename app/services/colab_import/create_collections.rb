# Imports CoLab concept database

module ColabImport
  class CreateCollections
    attr_reader :collections, :root_collection, :failed

    def initialize(path_to_json:, organization:, template_collection:, editor:)
      @data = JSON.parse(File.read(path_to_json))
      @template_collection = template_collection
      @organization = organization
      @editor = editor
      @root_collection = nil
      @failed = []
      @collections = []
    end

    def call(only_uids = [])
      concepts_to_copy = concepts_by_session(only_uids)
      create_root_collection
      assign_roles_to_root
      create_collections_for_concepts(concepts_to_copy)
      @root_collection
    end

    private

    def create_collections_for_concepts(concepts_by_session)
      concepts_by_session.each do |session_name, concepts|
        # Create collection for session
        session_collection = create_session_collection(session_name)

        concepts.each do |concept|
          # Clone the template for this sub-collection
          cloned = clone_template

          # Create the card for this sub-collection
          card = create_collection_card(parent: session_collection, collection: cloned)

          # Create card for this subcollection
          Rails.logger.info "Adding concept: #{concept['uid']} - #{concept['title']}"

          media_item_names = concept['media'].is_a?(Hash) ? concept['media'].values : concept['media']
          media = media_items(media_item_names)
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
        assign_role = Roles::AssignToUsers.new(
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

    def clone_template
      collection = @template_collection.duplicate!(
        for_user: @editor,
        copy_parent_card: false,
      )

      unless collection.persisted?
        raise_error('Failed to clone template', collection)
      end

      collection
    end

    def concepts_by_session(only_uids = [])
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

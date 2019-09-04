module CardDuplicator
  class DuplicateFilestackFiles
    include Interactor
    # include Interactor::Schema
    #
    # require_in_context :cards
    # delegate_to_context :cards

    def call
      context.filestack_files = duplicate_filestack_files
    end

    private

    def duplicate_filestack_files
      filestack_files = []
      context.cards.each do |card|
        item = card.item
        next unless item.present? && item.filestack_file.present?

        dupe = item.filestack_file.amoeba_dup
        dupe.original_item_id = item.id
        filestack_files << dupe
      end

      FilestackFile.import(filestack_files)
      filestack_files
    end
  end
end

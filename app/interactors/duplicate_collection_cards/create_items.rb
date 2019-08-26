module DuplicateCollectionCards
  class CreateRecords
    include Interactor
    require_in_context :duplicated_cards, :user_initiated
    delegate_to_context :duplicated_cards, :user_initiated

    def call
      create_records
    end

    private

    def create_records
      duplicated_items = []
      duplicated_collections = []
      context.duplicated_cards.each do |card|

      end
    end

    def item_attrs_to_copy
      %i[
        name
        content
        data_content
        icon_url
        legend_search_source
        question_type
        report_type
        thumbnail_url
        type
        url
        filestack_file_id
      ]
    end
  end
end

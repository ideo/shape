class Collection
  class TestDesign < Collection
    delegate :test_status, to: :parent

    # override parent method to always include all cards (roles don't matter)
    def collection_cards_viewable_by(*)
      collection_cards.includes(:item, :collection)
    end
  end
end

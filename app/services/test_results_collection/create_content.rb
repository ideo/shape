module TestResultsCollection
  class CreateContent
    include Interactor
    include Interactor::Schema

    schema :test_results_collection,
           :created_by,
           :idea,
           :message

    require_in_context :test_results_collection

    delegate :test_results_collection, :created_by,
             to: :context

    before do
      @legend = test_results_collection.legend_item
    end

    def call
      items.each_with_index do |item, i|
        attrs = {
          test_results_collection: test_results_collection,
          item: item,
          legend_item: @legend_item,
          created_by: created_by,
          order: i,
        }
        if item.scale_question?
          result = TestResultsCollection::CreateResponseGraph.call!(attrs)
          @legend_item ||= result.legend_item
        elsif item.question_open?
          TestResultsCollection::CreateOpenResponseCollection.call!(attrs)
        elsif item.question_idea?
          TestResultsCollection::CreateIdeaCollection.call!(attrs)
        elsif item.question_media? || !item.is_a?(Item::QuestionItem)
          TestResultsCollection::CreateMediaItemLink.call!(attrs)
        end
      end
    end

    private

    def items
      test_results_collection.test_collection.items
    end
  end
end

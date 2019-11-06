module TestResultsCollection
  class CreateResponseGraphs
    include Interactor
    include Interactor::Schema
    include CollectionCardBuilderHelpers

    schema :test_results_collection,
           :created_by,
           :message

    require_in_context :test_results_collection

    delegate :test_results_collection, :created_by,
             to: :context

    delegate :question_items, to: :test_results_collection

    before do
      @legend_item = test_results_collection.legend_item
    end

    def call
      scale_question_items.each do |question_item|
        # TODO: better way to identify if we've created a response graph
        # As question-item datasets can also be linked to other data items
        # when they are being used in comparisons

        # TODO: need to check if there is a data item per-idea
        next if question_item.question_dataset.data_items.present?

        result = TestResultsCollection::CreateResponseGraph.call!(
          test_results_collection: test_results_collection,
          question_item: question_item,
          legend_item: @legend_item,
          created_by: created_by,
        )

        # Capture legend item from first record
        @legend_item ||= result.legend_item
      end
    end

    private

    def scale_question_items
      question_items.scale_questions
                    .includes(:test_data_item)
    end
  end
end

class TestComparison < SimpleService
  def initialize(collection:, comparison_collection:)
    @collection = collection
    @comparison_collection = comparison_collection
  end

  def self.add(*args)
    new(*args).add
  end

  def self.remove(*args)
    new(*args).remove
  end

  def add
    return if same_collection?
    # @collection.data_items.report_type_question_item.includes(datasets: [:data_source]).each do |data_item|
    @collection.data_items.report_type_question_item.each do |data_item|
      # TODO: assign question_type on question items datasets?
      question_item_type = data_item.datasets.first.data_source.question_type
      maximum_order = data_item.data_items_datasets.maximum(:order)
      comparable = comparison_datasets_by_question_type[question_item_type]
      next if comparable.nil?
      comparable.each do |comparison_dataset|
        data_item.data_items_datasets.create(
          dataset: comparison_dataset,
          order: maximum_order += 1,
          selected: true,
        )
      end
    end
  end

  def remove
    return if same_collection?
  end

  private

  def question_items_by_question_type
    @question_items_by_question_type ||= @collection.question_items.scale_questions.each_with_object({}) do |question_item, h|
      h[question_item.question_type] ||= []
      h[question_item.question_type].push(question_item)
    end
  end

  def comparison_datasets_by_question_type
    # @comparison_datasets_by_question_type ||= @comparison_collection.includes(:dataset).question_items.scale_questions.each_with_object({}) do |question_item, h|
    @comparison_datasets_by_question_type ||= @comparison_collection.question_items.scale_questions.each_with_object({}) do |question_item, h|
      h[question_item.question_type] ||= []
      h[question_item.question_type].push(question_item.dataset)
    end
  end

  def same_collection?
    @collection == @comparison_collection
  end

  def find_by_question_type(question_type)
    @collection.question_items.scale_questions.where(question_type: question_type)
  end
end

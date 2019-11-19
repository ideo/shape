class TestComparison < SimpleService
  attr_reader :errors

  def initialize(collection:, comparison_collection:)
    @collection = collection
    @comparison_collection = comparison_collection
    @maximum_order = 0
    @errors = []
  end

  def add
    return false if same_collection? || @comparison_collection.test_results_collection.blank?

    collection_question_data_items.includes(primary_dataset: :question_item).each do |data_item|
      question_item = data_item.primary_dataset.question_item
      @maximum_order = data_item.data_items_datasets.maximum(:order)
      datasets = comparison_question_datasets_by_question_type[question_item.question_type]
      datasets = [find_or_create_empty_dataset_for_comparison] if datasets.blank?
      add_comparable_datasets(
        data_item: data_item,
        comparable_datasets: datasets,
      )
    end
    # break any collection caching
    @collection.touch
    errors.blank?
  end

  def remove
    return false if same_collection?

    collection_question_data_items.includes(data_items_datasets: :dataset).each do |data_item|
      data_item.data_items_datasets.each do |data_items_dataset|
        dataset = data_items_dataset.dataset
        is_empty_for_comparison = dataset.is_a?(Dataset::Empty) && dataset.data_source == @comparison_collection
        next unless comparison_collection_datasets.include?(dataset) || is_empty_for_comparison

        # If this question dataset comes from the comparison, remove it
        unless data_items_dataset.destroy
          errors.push('Could not remove a dataset')
        end
      end
    end
    # break any collection caching
    @collection.touch
    errors.blank?
  end

  private

  def add_comparable_datasets(data_item:, comparable_datasets:)
    comparable_datasets.each do |comparison_dataset|
      data_items_dataset = data_item.data_items_datasets.find_by(
        dataset_id: comparison_dataset.id,
      )
      # If it already exists, make sure it is selected
      if data_items_dataset.present?
        data_items_dataset.update(
          selected: true,
        )
      else
        data_items_dataset = data_item.data_items_datasets.create(
          dataset: comparison_dataset,
          order: @maximum_order += 1,
          selected: true,
        )
        if data_items_dataset.errors.present?
          errors.push(data_items_dataset.errors.full_messages)
        end
      end
    end
  end

  def find_or_create_empty_dataset_for_comparison
    existing = Dataset::Empty.find_by(
      data_source_type: @comparison_collection.class.base_class.name,
      data_source_id: @comparison_collection.id,
    )
    return existing if existing.present?

    Dataset::Empty.create_for_collection(
      collection: @comparison_collection,
      chart_type: :bar,
    )
  end

  def collection_question_data_items
    @collection
      .test_results_collection
      .data_items
      .report_type_question_item
      .includes(primary_dataset: :question_item)
  end

  def comparison_question_datasets_by_question_type
    @comparison_question_datasets_by_question_type ||= @comparison_collection
                                                       .question_items
                                                       .scale_questions
                                                       .each_with_object({}) do |question_item, h|
      h[question_item.question_type] ||= []
      h[question_item.question_type].push(question_item.question_dataset)
    end
  end

  def comparison_collection_datasets
    comparison_question_datasets_by_question_type.values.flatten
  end

  def same_collection?
    @collection == @comparison_collection
  end
end

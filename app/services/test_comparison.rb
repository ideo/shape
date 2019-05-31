class TestComparison < SimpleService
  attr_reader :errors

  def initialize(collection:, comparison_collection:)
    @collection = collection
    @comparison_collection = comparison_collection
    @errors = []
  end

  def add
    return false if same_collection?
    collection_question_data_items.includes(primary_dataset: :question_item).each do |data_item|
      question_item = data_item.primary_dataset.question_item
      maximum_order = data_item.data_items_datasets.maximum(:order)
      comparable_datasets = comparison_question_datasets_by_question_type[question_item.question_type]
      if comparable_datasets.blank?
        data_items_dataset = data_item.data_items_datasets.create(
          dataset: empty_dataset_for_comparison,
          order: maximum_order += 1,
          selected: true,
        )
        if data_items_dataset.errors.present?
          errors.push(data_items_dataset.errors.full_messages)
        end
      else
        comparable_datasets.each do |comparison_dataset|
          data_items_dataset = data_item.data_items_datasets.create(
            dataset: comparison_dataset,
            order: maximum_order += 1,
            selected: true,
          )
          if data_items_dataset.errors.present?
            errors.push(data_items_dataset.errors.full_messages)
          end
        end
      end
    end
    errors.blank?
  end

  def remove
    return false if same_collection?
    collection_question_data_items.includes(data_items_datasets: :dataset).each do |data_item|
      data_item.data_items_datasets.each do |data_items_dataset|
        dataset = data_items_dataset.dataset
        next unless comparison_collection_datasets.include?(dataset)
        # If this question dataset comes from the comparison, remove it
        unless data_items_dataset.destroy
          errors.push('Could not remove a dataset')
        end
      end
    end
    errors.blank?
  end

  private

  def empty_dataset_for_comparison
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
      h[question_item.question_type].push(question_item.dataset)
    end
  end

  def comparison_collection_datasets
    comparison_question_datasets_by_question_type.values.flatten
  end

  def same_collection?
    @collection == @comparison_collection
  end
end

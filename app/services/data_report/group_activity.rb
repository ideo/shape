# Right now this has been used to generate a report of "all groups" within Moon
module DataReport
  class GroupActivity < SimpleService
    def initialize(dataset:, start_date_limit: nil)
      @dataset = dataset
      if start_date_limit.present?
        @dataset.start_date_limit = start_date_limit
      end
      @data = {}
    end

    def call
      merge_total_data
      merge_group_data
      generate_csv
    end

    private

    def groups
      # don't include the main org groups; just the created ones
      @groups ||= @dataset.organization.groups.active.reject(&:org_group?)
    end

    def merge_total_data
      # first with no group
      @dataset.groupings = []
      data = @dataset.data
      merge_data(data, key: 'total')
    end

    def merge_group_data
      groups.each do |group|
        self.dataset_group = group
        data = @dataset.data
        merge_data(data, key: group.id)
      end
    end

    def merge_data(data, key:)
      data.each do |val|
        @data[val[:date]] ||= {}
        @data[val[:date]][key] = val[:value]
      end
    end

    def dataset_group=(group)
      @dataset.groupings = [{ 'type': 'Group', 'id': group.id }]
    end

    def generate_csv
      CSV.generate do |csv|
        # headers
        csv << %w[date total] + groups.map(&:name)

        # body
        @data.sort.each do |date, vals|
          row = [date]
          row << vals['total'] || 0
          groups.each do |group|
            row << vals[group.id] || 0
          end
          csv << row
        end
      end
    end
  end
end

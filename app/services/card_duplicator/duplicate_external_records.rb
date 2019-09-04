module CardDuplicator
  class DuplicateExternalRecords
    include Interactor
    require_in_context :duplicated_cards
    delegate_to_context :duplicated_cards

    def call
      duplicate_external_records
    end

    private

    def duplicate_external_records
      external_records = []
      duplicated_cards.each do |card|
        record = card.record
        cloned_from = record.cloned_from
        next unless cloned_from.present? && cloned_from.external_records.present?

        external_records += cloned_from.external_records.map do |er|
          dupe = er.amoeba_dup
          dupe.externalizable = record
          dupe
        end
      end

      ExternalRecord.import(external_records)
    end
  end
end

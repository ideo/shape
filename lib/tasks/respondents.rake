namespace :respondents do
  desc 'Import current respondents into INA'
  task :import, [:filepath] => [:environment] do |_, args|
    imported = 0
    skipped = 0
    errors = 0

    CSV.foreach(args[:filepath], headers: true, header_converters: :symbol) do |row|
      puts "Importing #{row[:email]}"

      if row[:can_we_contact_again] != 'YES' || row[:valid_response_or_gibberish].present?
        skipped += 1
        next
      end

      begin
        phone = row[:mobile].present? ? Phony.normalize(row[:mobile]) : nil
      rescue Phony::NormalizationError
        phone = nil
      end

      user_info = {
        first_name: row[:first_name],
        last_name: row[:last_name],
      }
      user_info[:phone] = phone if phone.present?

      success = LimitedUserCreator.call(
        contact_info: row[:email],
        user_info: user_info,
        date_of_participation: Date.parse(row[:date_of_participation]),
      )

      if success
        imported += 1
      else
        errors += 1
      end
    end

    puts "Imported: #{imported}"
    puts "Skipped: #{skipped}"
    puts "Errors: #{errors}"
  end
end

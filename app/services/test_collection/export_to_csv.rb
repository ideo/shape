module TestCollection
  class ExportToCsv < SimpleService
    def initialize(test_collection)
      @test_collection = test_collection
    end

    def call
      generate_csv
    end

    private

    def answerable_questions
      @test_collection.question_items.answerable
    end

    def generate_csv
      CSV.generate do |csv|
        csv << csv_headers
        @test_collection.survey_responses.includes(:user, :question_answers).each do |response|
          row = [
            response.user&.id,
            response.user&.email,
            response.id,
            response.status,
            response.created_at,
            response.updated_at,
          ]
          answerable_questions.each do |q|
            answer = response.question_answers.select { |qa| qa.question_id == q.id }.first
            next unless answer.present?

            row << (answer.answer_text || answer.answer_number)
          end
          csv << row
        end
      end
    end

    def csv_headers
      headers = %w[
        user_id
        email
        survey_response_id
        status
        created_at
        updated_at
      ]
      answerable_questions.each do |q|
        # get the name of the question
        headers << (q.content || q.question_description)
      end
      headers
    end
  end
end

module Slack
  class Unfurl
    include Interactor

    delegate_to_context :event, :client
    require_in_context :event #, :client
    delegate :channel, :message_ts, :links, to: :event

    def call
      return unless run?

      client.chat_unfurl(
        channel: channel,
        ts: message_ts,
        unfurls: modified_links.to_json,
      )
    end

    private

    def modified_links
      unfurls = {}
      links.each do |link|
        url = link[:url]
        unpacked = url.split('/')
        id = unpacked.last.to_i
        record_type = (unpacked & %w[items collections]).first
        next if record_type.nil?

        klass = record_type.classify.safe_constantize
        record = klass.find(id)
        unfurls[url] = message_data(record, url)
      end
      unfurls
    end

    def translate_string(string = nil)
      return string if string.blank?

      IdeoTranslation::TranslateString.call(
        string: string,
      )
    end

    def message_data(record, url)
      cover = record.try(:cached_cover) || {}
      image_url = ''
      image_handle = cover['image_handle']
      if record.is_a?(Item::FileItem)
        image_handle = record.filestack_file.handle
      end
      if image_handle
        process_url = "https://process.filestackapi.com/#{ENV['FILESTACK_API_KEY']}/resize=width:300/"
        image_url = "#{process_url}/#{image_handle}"
      end
      cover_text = ''
      unless cover['subtitle_hidden']
        cover_text = cover['hardcoded_subtitle'] || cover['text'] || ''
      end
      {
        mrkdwn_in: %w[text pretext],
        author_name: 'Shape',
        author_icon: 'https://s3-us-west-2.amazonaws.com/assets.shape.space/logo-no-text_2x-sq.png',
        color: '#5698ae',
        title: translate_string(record.name),
        text: translate_string(cover_text),
        title_link: url,
        image_url: image_url,
      }
    end

    def run?
      event.type == 'link_shared'
    end
  end
end

class ApplicationMailer < ActionMailer::Base
  include Roadie::Rails::Automatic
  include ApplicationHelper

  default from: 'Shape <hello@shape.space>'
  layout 'mailer'

  def mail(**args)
    if args[:users].present? && ENV['SHAPE_APP'] == 'staging'
      products_group_user_ids = Group.find(::IDEO_PRODUCTS_GROUP_ID).user_ids
      args[:to] = args[:users].select { |u| products_group_user_ids.include?(u.id) }.map(&:email)
      if args[:to].empty?
        return
      end
    end
    args.delete :users
    super(args)
  rescue ActiveRecord::RecordNotFound
    logger.error 'Products group not found.'
  end
end

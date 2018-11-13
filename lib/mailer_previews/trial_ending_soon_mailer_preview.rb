class TrialEndingSoonMailerPreview < ActionMailer::Preview
  def notify_2_days
    TrialEndingSoonMailer.notify(Organization.last, 2)
  end

  def notify_1_week
    TrialEndingSoonMailer.notify(Organization.last, 7)
  end

  def notify_2_weeks
    TrialEndingSoonMailer.notify(Organization.last, 14)
  end
end

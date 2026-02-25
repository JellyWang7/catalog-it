class Comment < ApplicationRecord
  belongs_to :user
  belongs_to :list

  validates :body, presence: true, length: { maximum: 500 }
  validate :body_is_age_friendly

  before_validation :sanitize_body

  private

  def body_is_age_friendly
    return unless body.present?
    return unless ContentModeration.inappropriate?(body)

    errors.add(:base, ContentModeration::ERROR_MESSAGE)
  end

  def sanitize_body
    return unless body.present?

    self.body = Sanitize.fragment(body, Sanitize::Config::BASIC)
  end
end

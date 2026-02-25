class Comment < ApplicationRecord
  belongs_to :user
  belongs_to :list

  validates :body, presence: true, length: { maximum: 500 }

  before_validation :sanitize_body

  private

  def sanitize_body
    return unless body.present?

    self.body = Sanitize.fragment(body, Sanitize::Config::BASIC)
  end
end

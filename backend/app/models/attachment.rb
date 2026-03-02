class Attachment < ApplicationRecord
  ALLOWED_MIME_TYPES = %w[
    image/jpeg
    image/png
    image/webp
    application/pdf
    text/plain
  ].freeze

  MAX_FILE_SIZE_BYTES = 10.megabytes

  belongs_to :user
  belongs_to :attachable, polymorphic: true

  has_one_attached :asset

  validates :kind, inclusion: { in: %w[link image file] }
  validates :title, presence: true, length: { maximum: 120 }
  validates :url, presence: true, if: :link?
  validate :https_url_for_link
  validate :asset_required_for_file_or_image
  validate :asset_mime_type_allowed
  validate :asset_size_allowed

  before_validation :assign_asset_metadata

  def link?
    kind == 'link'
  end

  def file_or_image?
    %w[file image].include?(kind)
  end

  private

  def https_url_for_link
    return unless link?

    uri = URI.parse(url)
    return if uri.is_a?(URI::HTTPS) && uri.host.present?

    errors.add(:url, 'must be a valid https link')
  rescue URI::InvalidURIError
    errors.add(:url, 'must be a valid https link')
  end

  def asset_required_for_file_or_image
    return unless file_or_image?
    return if asset.attached?

    errors.add(:asset, 'must be attached for file/image uploads')
  end

  def asset_mime_type_allowed
    return unless asset.attached?
    return if ALLOWED_MIME_TYPES.include?(asset.blob.content_type)

    errors.add(:asset, 'type is not allowed')
  end

  def asset_size_allowed
    return unless asset.attached?
    return if asset.blob.byte_size <= MAX_FILE_SIZE_BYTES

    errors.add(:asset, 'size exceeds 10MB limit')
  end

  def assign_asset_metadata
    return unless asset.attached?

    self.mime_type = asset.blob.content_type
    self.size_bytes = asset.blob.byte_size
    self.storage_key = asset.blob.key
  end
end

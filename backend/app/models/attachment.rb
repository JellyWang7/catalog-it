class Attachment < ApplicationRecord
  ALLOWED_MIME_TYPES = %w[
    image/jpeg
    image/png
    image/webp
    application/pdf
    text/plain
    application/zip
    application/x-zip-compressed
  ].freeze

  MAX_FILE_SIZE_BYTES = 5.megabytes
  MAX_BODY_LENGTH = 5000

  belongs_to :user
  belongs_to :attachable, polymorphic: true

  has_one_attached :asset

  validates :kind, inclusion: { in: %w[link image file note] }
  validates :title, length: { maximum: 120 }, allow_blank: true
  validates :body, length: { maximum: MAX_BODY_LENGTH }, allow_blank: true
  validates :body, presence: true, if: :note?
  validate :https_url_for_link
  validate :asset_required_for_file_or_image
  validate :asset_mime_type_allowed
  validate :asset_size_allowed

  before_validation :assign_defaults_and_strip
  before_validation :assign_asset_metadata

  def link?
    kind == 'link'
  end

  def note?
    kind == 'note'
  end

  def file_or_image?
    %w[file image].include?(kind)
  end

  # Text shown in API/UI for notes (body is primary)
  def note_text
    body.to_s.strip
  end

  private

  def assign_defaults_and_strip
    self.title = title.to_s.strip if title.present?

    if note?
      self.body = Sanitize.fragment(body.to_s.strip, Sanitize::Config::BASIC)
    elsif body.present?
      self.body = body.to_s.strip
    end

    if link? && title.blank? && url.present?
      begin
        uri = URI.parse(url)
        self.title = uri.host&.sub(/\Awww\./, "") || "Link"
      rescue URI::InvalidURIError
        self.title = "Link"
      end
    end

    if file_or_image? && asset.attached? && title.blank?
      self.title = asset.filename.to_s
    end
  end

  def assign_asset_metadata
    return unless asset.attached?

    self.mime_type = asset.blob.content_type
    self.size_bytes = asset.blob.byte_size
    self.storage_key = asset.blob.key
  end

  def https_url_for_link
    return unless link?
    if url.blank?
      errors.add(:url, "can't be blank")
      return
    end

    uri = URI.parse(url)
    return if uri.is_a?(URI::HTTPS) && uri.host.present?

    errors.add(:url, "must be a valid https link")
  rescue URI::InvalidURIError
    errors.add(:url, "must be a valid https link")
  end

  def asset_required_for_file_or_image
    return unless file_or_image?
    return if asset.attached?

    errors.add(:asset, "must be attached for file/image uploads")
  end

  def asset_mime_type_allowed
    return unless asset.attached?
    return if ALLOWED_MIME_TYPES.include?(asset.blob.content_type)

    errors.add(:asset, "type is not allowed. Allowed: JPG, PNG, WEBP, PDF, TXT, ZIP")
  end

  def asset_size_allowed
    return unless asset.attached?
    return if asset.blob.byte_size <= MAX_FILE_SIZE_BYTES

    errors.add(:asset, "size exceeds 5MB limit")
  end
end

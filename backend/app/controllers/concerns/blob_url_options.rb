# frozen_string_literal: true

# Correct Active Storage blob URLs when the API runs behind CloudFront/proxies.
# `rails_blob_url(..., host: request.base_url)` is invalid (host must be a hostname, not a full URL).
module BlobUrlOptions
  extend ActiveSupport::Concern

  private

  # Options for url helpers so <img src> / browser fetches hit the public origin (e.g. CloudFront).
  def blob_url_options
    raw = ENV["PUBLIC_APP_URL"].presence || ENV["FRONTEND_URL"].presence
    if raw.present?
      uri = URI.parse(raw.start_with?("http") ? raw : "https://#{raw}")
      return { host: uri.host, protocol: uri.scheme || "https", port: blob_port(uri) }.compact
    end

    { host: request.host, protocol: request.scheme, port: request.port }
  end

  def blob_port(uri)
    return if uri.port.blank?

    return if (uri.scheme == "https" && uri.port == 443) || (uri.scheme == "http" && uri.port == 80)

    uri.port
  end

  # Never raise from JSON serialization: a bad/missing host would turn a successful
  # upload into a 500. Log and return nil so the row still saves and clients can refresh.
  def rails_blob_url_for_attachment(blob)
    rails_blob_url(blob, **blob_url_options)
  rescue ArgumentError, ActionController::UrlGenerationError, URI::InvalidURIError => e
    Rails.logger.warn(
      "[ActiveStorage] rails_blob_url failed for blob_id=#{blob&.id}: #{e.class}: #{e.message}"
    )
    nil
  end
end

class ContentModeration
  ERROR_MESSAGE = 'Content contains inappropriate language.'.freeze

  # Extra strict checks for slurs/hate speech (including obfuscated variants).
  BLOCKED_SLUR_PATTERNS = [
    /nigg(?:a|er|ers|as)/i,
    /faggot/i,
    /kike/i,
    /chink/i,
    # "chingchong" does not contain substring "chink"; block phrase (compact text has no spaces)
    /ching[\s_-]*chong/i,
    /gook/i,
    /spic/i,
    /whitepower/i
  ].freeze

  LEET_MAP = {
    '0' => 'o',
    '1' => 'i',
    '3' => 'e',
    '4' => 'a',
    '5' => 's',
    '@' => 'a',
    '$' => 's',
    '!' => 'i',
    '|' => 'i'
  }.freeze

  def self.inappropriate?(text)
    return false if text.blank?

    mapped = leet_normalize(text.to_s.downcase)
    dictionary_safe_text = mapped.gsub(/[^a-z0-9\s]/, ' ')
    compact_text = mapped.gsub(/[^a-z0-9]/, '')

    Obscenity.profane?(dictionary_safe_text) ||
      BLOCKED_SLUR_PATTERNS.any? { |pattern| compact_text.match?(pattern) }
  end

  def self.leet_normalize(text)
    text.chars.map { |char| LEET_MAP.fetch(char, char) }.join
  end
end

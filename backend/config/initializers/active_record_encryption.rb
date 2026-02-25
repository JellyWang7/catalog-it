Rails.application.config.active_record.encryption.primary_key = ENV.fetch(
  "ACTIVE_RECORD_ENCRYPTION_PRIMARY_KEY",
  "868BUt38eAyc29q1SEGSJB1u1dPQvFuh"
)
Rails.application.config.active_record.encryption.deterministic_key = ENV.fetch(
  "ACTIVE_RECORD_ENCRYPTION_DETERMINISTIC_KEY",
  "lfFIvJDHSpAFqhSzZ74KC1rB6E2FtkUg"
)
Rails.application.config.active_record.encryption.key_derivation_salt = ENV.fetch(
  "ACTIVE_RECORD_ENCRYPTION_KEY_DERIVATION_SALT",
  "P2O1lYQGzhoeIKnJKVPeFQLZIBIKONdR"
)

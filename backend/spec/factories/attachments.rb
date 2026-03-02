FactoryBot.define do
  factory :attachment do
    association :user
    association :attachable, factory: :list
    kind { 'link' }
    title { 'Reference' }
    url { 'https://example.com' }
    mime_type { nil }
    size_bytes { nil }
    storage_key { nil }
  end
end

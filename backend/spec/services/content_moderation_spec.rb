# frozen_string_literal: true

require "rails_helper"

RSpec.describe ContentModeration do
  describe ".inappropriate?" do
    it "returns false for blank text" do
      expect(described_class.inappropriate?("")).to be false
      expect(described_class.inappropriate?(nil)).to be false
    end

    it "flags chingchong (not matched by chink substring alone)" do
      expect(described_class.inappropriate?("chingchong")).to be true
      expect(described_class.inappropriate?("CHINGCHONG")).to be true
    end

    it "flags spaced / punctuated variants" do
      expect(described_class.inappropriate?("ching chong")).to be true
      expect(described_class.inappropriate?("ching-chong")).to be true
    end

    it "flags gook" do
      expect(described_class.inappropriate?("gook")).to be true
    end

    it "allows normal discussion text" do
      expect(described_class.inappropriate?("Great list, thanks for sharing!")).to be false
      expect(described_class.inappropriate?("Chinese food recommendations")).to be false
    end
  end
end

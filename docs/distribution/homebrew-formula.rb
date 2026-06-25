class Sharekit < Formula
  desc "Share your AI coding setup — install profiles from GitHub with one command"
  homepage "https://github.com/LucasSantana-Dev/sharekit"
  license "MIT"
  version "0.5.0"

  on_macos do
    on_arm do
      url "https://github.com/LucasSantana-Dev/sharekit/releases/download/v#{version}/sharekit-macos-arm64"
      sha256 "PLACEHOLDER" # auto-filled by release-brew CI job
    end
    on_intel do
      url "https://github.com/LucasSantana-Dev/sharekit/releases/download/v#{version}/sharekit-macos-x64"
      sha256 "PLACEHOLDER"
    end
  end

  on_linux do
    on_arm do
      url "https://github.com/LucasSantana-Dev/sharekit/releases/download/v#{version}/sharekit-linux-arm64"
      sha256 "PLACEHOLDER"
    end
    on_intel do
      url "https://github.com/LucasSantana-Dev/sharekit/releases/download/v#{version}/sharekit-linux-x64"
      sha256 "PLACEHOLDER"
    end
  end

  def install
    # stable.url is the platform-specific binary URL selected by Homebrew
    bin.install stable.url.split("/").last => "sharekit"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/sharekit --version")
  end
end

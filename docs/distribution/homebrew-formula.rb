class Sharekit < Formula
  desc "Share your AI coding setup — install profiles from GitHub with one command"
  homepage "https://github.com/LucasSantana-Dev/sharekit"
  license "MIT"
  version "0.5.0"

  on_macos do
    on_arm do
      url "https://github.com/LucasSantana-Dev/sharekit/releases/download/v#{version}/sharekit-macos-arm64"
      sha256 "PLACEHOLDER_MACOS_ARM64" # replace with: shasum -a 256 sharekit-macos-arm64
    end
    on_intel do
      url "https://github.com/LucasSantana-Dev/sharekit/releases/download/v#{version}/sharekit-macos-x64"
      sha256 "PLACEHOLDER_MACOS_X64" # replace with: shasum -a 256 sharekit-macos-x64
    end
  end

  on_linux do
    on_arm do
      url "https://github.com/LucasSantana-Dev/sharekit/releases/download/v#{version}/sharekit-linux-arm64"
      sha256 "PLACEHOLDER_LINUX_ARM64"
    end
    on_intel do
      url "https://github.com/LucasSantana-Dev/sharekit/releases/download/v#{version}/sharekit-linux-x64"
      sha256 "PLACEHOLDER_LINUX_X64"
    end
  end

  def install
    binary = "sharekit-#{Hardware::CPU.arch == :arm ? 'arm64' : 'x64'}"
    bin.install binary => "sharekit"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/sharekit --version")
  end
end

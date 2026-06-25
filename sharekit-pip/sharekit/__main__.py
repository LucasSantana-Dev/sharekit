"""Entry point: resolve binary and exec into it."""
import os
import sys

from .install import ensure_binary


def main() -> None:
    try:
        binary = ensure_binary()
        os.execv(binary, [binary] + sys.argv[1:])
    except Exception as e:
        print(f"sharekit: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()

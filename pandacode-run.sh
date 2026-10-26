#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")/o-one-mobile"
export CI=1
export BROWSER=none
# pandacode-preview: http://127.0.0.1:8081
exec npx expo start --web --port 8081

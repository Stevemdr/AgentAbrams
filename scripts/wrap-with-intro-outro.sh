#!/bin/bash
# Wrap any video with Agent Abrams intro and outro
# Usage: ./wrap-with-intro-outro.sh <input.mp4> [output.mp4]
#
# If output is not specified, creates <input>-wrapped.mp4
# Handles resolution/codec normalization automatically.

set -e

ASSETS="/root/Projects/goodquestion-ai/assets/video"
INTRO="$ASSETS/agent-abrams-intro.mp4"
OUTRO="$ASSETS/agent-abrams-outro.mp4"

if [ -z "$1" ]; then
  echo "Usage: $0 <input.mp4> [output.mp4]"
  echo ""
  echo "Wraps video with Agent Abrams intro (~9s, Aria voice) and outro (~12s, Aria voice)"
  exit 1
fi

INPUT="$1"
if [ ! -f "$INPUT" ]; then
  echo "Error: Input file not found: $INPUT"
  exit 1
fi

# Output path
if [ -n "$2" ]; then
  OUTPUT="$2"
else
  BASENAME="${INPUT%.*}"
  OUTPUT="${BASENAME}-wrapped.mp4"
fi

TMPDIR=$(mktemp -d)
trap "rm -rf $TMPDIR" EXIT

echo "=== Agent Abrams Video Wrapper ==="
echo "  Input:  $INPUT"
echo "  Output: $OUTPUT"
echo ""

# Step 1: Normalize main video to 1920x1080, h264+aac (match intro/outro specs)
echo "  [1/3] Normalizing main video..."
ffmpeg -y -i "$INPUT" \
  -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:black" \
  -c:v libx264 -preset fast -crf 23 -pix_fmt yuv420p \
  -c:a aac -b:a 128k -ac 2 -ar 44100 \
  -r 30 \
  "$TMPDIR/main-normalized.mp4" 2>/dev/null

# Step 2: Re-encode intro and outro to ensure matching fps/audio params
echo "  [2/3] Preparing segments..."
ffmpeg -y -i "$INTRO" -r 30 -c:v libx264 -preset fast -crf 23 -pix_fmt yuv420p \
  -c:a aac -b:a 128k -ac 2 -ar 44100 "$TMPDIR/intro.mp4" 2>/dev/null
ffmpeg -y -i "$OUTRO" -r 30 -c:v libx264 -preset fast -crf 23 -pix_fmt yuv420p \
  -c:a aac -b:a 128k -ac 2 -ar 44100 "$TMPDIR/outro.mp4" 2>/dev/null

# Step 3: Concat with demuxer
echo "  [3/3] Concatenating intro + main + outro..."
cat > "$TMPDIR/concat.txt" <<EOF
file 'intro.mp4'
file 'main-normalized.mp4'
file 'outro.mp4'
EOF

ffmpeg -y -f concat -safe 0 -i "$TMPDIR/concat.txt" \
  -c copy \
  "$OUTPUT" 2>/dev/null

# Report
DURATION=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$OUTPUT" 2>/dev/null)
SIZE=$(du -h "$OUTPUT" | cut -f1)
echo ""
echo "=== Done ==="
echo "  Output:   $OUTPUT"
echo "  Duration: ${DURATION}s (intro ~9s + main + outro ~12s)"
echo "  Size:     $SIZE"

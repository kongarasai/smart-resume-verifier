import json

gradle_lines = []

with open('eas_build_logs_decoded.txt', 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            # Check if this line belongs to RUN_GRADLEW phase
            if data.get('phase') == 'RUN_GRADLEW':
                msg = data.get('msg', '')
                # Clean up non-ASCII characters to prevent console crashes
                clean_msg = ''.join(c if ord(c) < 128 else '?' for c in msg)
                gradle_lines.append(clean_msg)
        except Exception:
            pass

# Save gradlew logs
with open('gradlew_logs.txt', 'w', encoding='utf-8') as f:
    f.write('\n'.join(gradle_lines))

print("Extracted", len(gradle_lines), "Gradlew build log lines.")
# Print the last 40 lines which usually contain the compilation error
print("\n--- LAST 40 LINES OF GRADLEW LOG ---")
for line in gradle_lines[-40:]:
    print(line)

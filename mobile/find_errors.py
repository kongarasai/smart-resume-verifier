with open('eas_build_logs_decoded.txt', 'r', encoding='utf-8') as f:
    lines = f.readlines()

output_lines = []

for i, line in enumerate(lines):
    if any(keyword in line.lower() for keyword in ['error', 'failed', 'exception', 'fatal']):
        start = max(0, i - 5)
        end = min(len(lines), i + 6)
        output_lines.append(f"--- Line {i+1} ---")
        for j in range(start, end):
            # Clean non-ASCII characters for easy terminal/text reading
            clean_line = ''.join(c if ord(c) < 128 else '?' for c in lines[j])
            output_lines.append(f"{j+1}: {clean_line.strip()}")
        output_lines.append("-" * 30)

with open('matched_errors.txt', 'w', encoding='utf-8') as f:
    f.write('\n'.join(output_lines))

print("Search completed. Matched errors written to matched_errors.txt")

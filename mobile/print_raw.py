with open('eas_build_logs_decoded.txt', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace any character outside standard ASCII with space to avoid console encoding crashes
ascii_text = ''.join(c if ord(c) < 128 else '?' for c in text)

print("--- LOG FILE HEAD ---")
print(ascii_text[:1500])
print("--- LOG FILE TAIL ---")
print(ascii_text[-1500:])

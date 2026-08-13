import urllib.request
import gzip
import brotli

url = 'https://storage.googleapis.com/eas-workflows-production/logs/7832e1fc-b978-4d30-b910-693fa8464ad7/d4058b27-bb55-4a8c-908f-6f820de4292b/2026-08-13T05%3A02%3A53Z-f10b5b81-5bed-4319-9150-a859282ab284.txt?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=www-production%40exponentjs.iam.gserviceaccount.com%2F20260813%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20260813T050907Z&X-Goog-Expires=900&X-Goog-SignedHeaders=host&X-Goog-Signature=72567bbc1b7326dc7cb8d25e9a46c7f2f5d81f754875fdbaab65525d43a89c26df13989411528d64882548ec19cb6ba427db6c856264e2cdb5ae497c6a7498d58b76cb950c9d081ee8a19e0c3bceef7ff64bd677a905fc5859cb52bf3b1958ec39fccc09acc86a055af6446d8e4a2b3fea4a1313b2ad46bf029ef191cde85db82790d7994b2ed7321e8133dee41d577ecb16e1da9e9a1442a3532c1ce72a5f93a61752cee72f60c16eb2f2a993b6b17e03604b4122f8eb03222c1b5e8035a8ff2a2d41c926c9fe7573463476e734170a1ba60c5428adffef184f1f79b6f3f4395129ca4a0a4706e5f145515bc8ca595d0c66bf00de04ac63a235755887ccb2b1'

try:
    response = urllib.request.urlopen(url)
    content = response.read()
    
    # Try brotli first
    try:
        decompressed = brotli.decompress(content)
        print("Successfully decompressed with Brotli! Length:", len(decompressed))
        text = decompressed.decode('utf-8', errors='ignore')
    except Exception as e_br:
        print("Brotli decompression failed:", e_br)
        # Try gzip
        try:
            decompressed = gzip.decompress(content)
            print("Successfully decompressed with Gzip! Length:", len(decompressed))
            text = decompressed.decode('utf-8', errors='ignore')
        except Exception as e_gz:
            print("Gzip decompression failed:", e_gz)
            # Try raw decoding
            text = content.decode('utf-8', errors='ignore')

    # Save to file
    with open('eas_build_logs_decoded.txt', 'w', encoding='utf-8') as f:
        f.write(text)
        
    print("Logs saved to eas_build_logs_decoded.txt")
except Exception as e:
    print("Error:", e)

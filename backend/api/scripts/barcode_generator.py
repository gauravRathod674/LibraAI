import random
import string
import barcode
from barcode.writer import ImageWriter

# Set to keep track of generated codes
generated_barcodes = set()

def generate_random_code(length=12):
    """Generates a random alphanumeric string."""
    return ''.join(random.choices(string.digits, k=length))

def generate_unique_barcode(output_dir='barcodes', prefix='BC', count=5):
    """
    Generates unique barcodes and saves them as images.
    
    :param output_dir: Directory to save barcode images
    :param prefix: Barcode file prefix
    :param count: Number of unique barcodes to generate
    """
    import os
    os.makedirs(output_dir, exist_ok=True)

    for i in range(count):
        while True:
            code = generate_random_code()
            if code not in generated_barcodes:
                generated_barcodes.add(code)
                break

        # Generate barcode (Code128 format allows alphanumeric)
        barcode_class = barcode.get_barcode_class('code128')
        my_barcode = barcode_class(code, writer=ImageWriter())

        filename = os.path.join(output_dir, f"{prefix}_{code}")
        my_barcode.save(filename)
        print(f"[✔] Saved: {filename}.png")

# Example usage:
generate_unique_barcode(count=10)

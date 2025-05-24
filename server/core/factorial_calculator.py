""" Factorial calculator module """

import os
import signal
import sys

sys.set_int_max_str_digits(1000000)

def signal_handler(sig, frame):
    print("\nExiting gracefully...")
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)

def get_last_factorial():
    """Get the last factorial value and its index using only file cursor operations"""
    if not os.path.exists("server/core/factorial_result.py"):
        # Create file with initial factorial
        with open("server/core/factorial_result.py", "w", encoding='utf-8') as file:
            file.write("pre_calc = [\n")
            file.write("    1\n")
            file.write("]\n")
        return 0, 1
    
    # Open the file and find the last value using cursor operations
    with open("server/core/factorial_result.py", "r", encoding='utf-8') as file:
        # Go to the end of the file
        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        
        if file_size <= 0:
            return 0, 1
        
        # Move backwards to find the last number
        pos = file_size - 1
        line_start = 0
        found_number = False
        number_line = ""
        
        while pos >= 0 and not found_number:
            file.seek(pos)
            char = file.read(1)
            
            if char == '\n':
                line_start = pos + 1
                file.seek(line_start)
                line = file.readline().strip()
                
                # Skip the closing bracket
                if line == "]":
                    pos -= 1
                    continue
                
                # Try to parse the line as a number
                try:
                    # Remove trailing comma and spaces, if any
                    clean_line = line.rstrip(",").strip()
                    last_value = int(clean_line)
                    found_number = True
                    number_line = clean_line
                    break
                except ValueError:
                    # If it's not a number, move to the previous line
                    pos = line_start - 2
            else:
                pos -= 1
        
        if not found_number:
            return 0, 1
        
        # Count how many numbers are in the file to determine the index
        file.seek(0)
        content = file.readlines(1024)  # Read first chunk to find array start
        
        # Check if file is empty or doesn't contain our array
        if not content or "pre_calc = [" not in ''.join(content):
            return 0, 1
            
        # Count the numbers in the file
        file.seek(0)  # Start from beginning
        number_count = 0
        in_array = False
        
        # Read the file in chunks to count numbers
        while True:
            chunk = file.read(8192)
            if not chunk:
                break
                
            for i, char in enumerate(chunk):
                # Start counting after we find the array start
                if not in_array and "pre_calc = [" in chunk[:i+1]:
                    in_array = True
                    continue
                    
                if in_array and char == ',':
                    number_count += 1
                    
                # Stop if we reach the end of the array
                if in_array and char == ']':
                    # Add 1 for the last number (which doesn't have a comma after it)
                    return number_count, int(number_line)
        
    # If we couldn't determine the count, but have a value, return a safe default
    if found_number:
        return 0, int(number_line)
    return 0, 1

def append_next_factorial(last_idx, last_value):
    """Calculate and append the next factorial to the file"""
    next_idx = last_idx + 1
    next_value = last_value * next_idx
    
    with open("server/core/factorial_result.py", "r+", encoding='utf-8') as file:
        # Navigate to right before the closing bracket
        file.seek(0, os.SEEK_END)
        pos = file.tell() - 1
        
        # Find the closing bracket by moving backward
        while pos >= 0:
            file.seek(pos)
            char = file.read(1)
            if char == ']':
                # Found the closing bracket
                file.seek(pos)
                break
            pos -= 1
        
        # If we couldn't find the closing bracket, the file may be corrupt
        if pos < 0:
            # Create file from scratch with the value we have
            file.seek(0)
            file.truncate(0)
            file.write("pre_calc = [\n")
            file.write(f"    {last_value}\n")
            file.write("]\n")
            return last_idx, last_value
        
        # Insert a comma after the last number if needed
        file.seek(pos - 1)
        char_before_bracket = file.read(1)
        
        file.seek(pos)
        file.truncate()  # Remove the closing bracket
        
        if char_before_bracket not in [',', '\n']:
            file.write(",\n")
        elif char_before_bracket == ',':
            file.write("\n")
            
        # Append the new factorial and close the list
        file.write(f"    {next_value}\n")
        file.write("]\n")
        
        return next_idx, next_value

# Get the last calculated factorial
last_idx, last_value = get_last_factorial()
print(f"Starting with factorial {last_idx}")

try:
    current_idx = last_idx
    current_value = last_value
    
    while True:
        # Calculate and append the next factorial
        current_idx, current_value = append_next_factorial(current_idx, current_value)
        
        # Show progress
        print(f"Factorial of {current_idx} calculated")
        
except Exception as e:
    print(f"Error occurred: {e}")
    import traceback
    traceback.print_exc()

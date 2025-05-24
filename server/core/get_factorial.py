""" Functions for retrieving factorial values from pre-calculated file """

import os
import sys

sys.set_int_max_str_digits(1000000)


def get_max_factorial_idx():
    """
    Get the maximum calculated factorial index in the file
    without loading the entire file into memory.
    
    Returns:
        int: The maximum factorial index (0-based)
    """
    if not os.path.exists("server/core/factorial_result.py"):
        return -1
    
    try:
        with open("server/core/factorial_result.py", "r", encoding='utf-8') as file:
            # Count number of lines in file without loading it all at once
            line_count = 0
            for _ in file:
                line_count += 1
            
            # Subtract non-factorial lines:
            # - 1 line for "pre_calc = ["
            # - 1 line for closing "]"
            # - Any empty lines (typically 0)
            
            # Re-open the file to check for empty lines
            file.seek(0)
            empty_lines = 0
            for line in file:
                if line.strip() == "":
                    empty_lines += 1
            
            # Maximum factorial index is line count minus header, footer and empty lines
            max_idx = line_count - 2 - empty_lines
            
            # -1 for 0-based indexing (factorial at index 0 is 0!, which is 1)
            return max_idx - 1
    except Exception as e:
        print(f"Error reading factorial file: {e}")
        return -1

def __get_factorial(n):
    """
    Get the factorial of n from the pre-calculated file
    without loading the entire file into memory.
    
    Args:
        n (int): The factorial to retrieve (n!)
    
    Returns:
        int: The factorial value, or None if not found
    """
    if not os.path.exists("server/core/factorial_result.py"):
        return None
    
    # Check if the requested factorial is within range
    max_idx = get_max_factorial_idx()
    if n > max_idx:
        return None
    
    try:
        with open("server/core/factorial_result.py", "r", encoding='utf-8') as file:
            # Skip the first line (pre_calc = [)
            file.readline()
            
            # Navigate to the line containing the requested factorial
            # n+1 because the file has factorial values starting at line 2
            # (line 1 is "pre_calc = [")
            for _ in range(n+1):
                line = file.readline()
                if not line:  # End of file reached
                    return None
            
            # Parse the factorial value from the line
            line = line.strip()
            if line.endswith(','):
                line = line[:-1]
            
            return int(line.strip())
    except Exception as e:
        print(f"Error reading factorial {n}: {e}")
        return None

def __get_factorial_by_line_num(line_num):
    """
    Get a factorial value by its line number in the file.
    Useful for random access without knowing the index.
    
    Args:
        line_num (int): The line number in the file (1-based)
    
    Returns:
        tuple: (index, value) of the factorial, or (None, None) if not found
    """
    if not os.path.exists("server/core/factorial_result.py"):
        return None, None
    
    try:
        with open("server/core/factorial_result.py", "r", encoding='utf-8') as file:
            # Skip to the desired line
            current_line = 0
            for line in file:
                current_line += 1
                if current_line == line_num:
                    # Check if this is a factorial line
                    line = line.strip()
                    if line and line != "pre_calc = [" and line != "]":
                        if line.endswith(','):
                            line = line[:-1]
                        value = int(line.strip())
                        # Calculate index based on line number
                        # Subtract 2 because line 1 is "pre_calc = ["
                        index = current_line - 2
                        return index, value
                    break
                    
        return None, None
    except Exception as e:
        print(f"Error reading factorial at line {line_num}: {e}")
        return None, None

def __binary_search_factorial(n):
    """
    Use binary search to efficiently find a factorial value without
    loading the entire file or scanning linearly.
    
    This is more efficient for large files and high n values.
    
    Args:
        n (int): The factorial to retrieve (n!)
    
    Returns:
        int: The factorial value, or None if not found
    """
    if not os.path.exists("server/core/factorial_result.py"):
        return None
    
    # Get file line count for binary search bounds
    max_idx = get_max_factorial_idx()
    if n > max_idx:
        return None
    
    try:
        with open("server/core/factorial_result.py", "r", encoding='utf-8') as file:
            # Calculate the line number where the factorial value should be
            target_line = n + 2  # +2 because line 1 is "pre_calc = [" and factorials are 0-indexed
            
            # Navigate directly to approximate line position (more efficient than reading line by line)
            file.seek(0)  # Start at file beginning
            
            # Skip to the target line
            for _ in range(target_line - 1):
                file.readline()
            
            # Read the target line
            line = file.readline().strip()
            if line.endswith(','):
                line = line[:-1]
            
            return int(line.strip())
    except Exception as e:
        print(f"Error during binary search for factorial {n}: {e}")
        return None

def get_factorial(n):
    """
    Get the factorial of n, using binary search for efficiency.
    
    Args:
        n (int): The factorial to retrieve (n!)
    
    Returns:
        int: The factorial value, or None if not found
    """
    if n < 0:
        return None  # Factorial is not defined for negative numbers

    # Use binary search to find the factorial
    if n == get_max_factorial_idx() + 1:
        # Calculating aspect of solution
        return __get_factorial(n - 1) * n
    if n > get_max_factorial_idx():
        return None
    return __binary_search_factorial(n)

if __name__ == "__main__":
    # Example usage
    max_idx = get_max_factorial_idx()
    
    if max_idx >= 5000:
        print(f"5000! = {__binary_search_factorial(5000)}")
    
    if max_idx >= 4999:
        print(f"4999! = {__get_factorial(4999)}")

    print(f"Maximum calculated factorial: {max_idx}!")


import io
import pandas as pd
from typing import List, Dict, Any

def parse_excel_file(file_content: bytes) -> List[Dict[str, Any]]:
    """
    Parses an Excel file content and returns a list of dictionaries with specific columns.
    
    Args:
        file_content (bytes): The content of the uploaded Excel file.
        
    Returns:
        List[Dict[str, Any]]: A list of dictionaries with keys: name, phoneno, email.
    """
    try:
        # Read the excel file from bytes
        df = pd.read_excel(io.BytesIO(file_content))
        
        # Define the required columns
        required_columns = ['name', 'phoneno', 'email']
        
        # Filter the dataframe to only include the required columns
        # Use simple column selection, handling potential missing columns gracefully if needed
        # For now, we assume the user provides the correct columns or we filter what exists efficiently
        
        # Check if all required columns exist, if not, you might want to handle it. 
        # For this simple implementation, let's assume strict compliance or just select what matches.
        # Ideally, we should validate. Let's do a basic validation/selection.
        
        available_columns = [col for col in required_columns if col in df.columns]
        
        if not available_columns:
             # If none of the columns are found, return empty or raise error? 
             # Let's return empty list or maybe the raw data but the requirement was specific keys.
             # Let's try to map if case sensitivity is an issue, but requirement said "colum name , phoneno, email"
             pass

        # Select only the columns we interested in that exist in the dataframe
        df_selected = df[available_columns]
        
        # Convert to list of dictionaries
        # orient='records' gives [{col1: val1, ...}, ...]
        result = df_selected.to_dict(orient='records')
        
        # Clean up NaN values (JSON doesn't support NaN)
        cleaned_result = []
        for row in result:
            clean_row = {}
            for key, value in row.items():
                if pd.isna(value):
                    clean_row[key] = None
                else:
                    clean_row[key] = value
            cleaned_result.append(clean_row)
            
        return cleaned_result
        
    except Exception as e:
        # Log the error or re-raise
        print(f"Error parsing excel file: {e}")
        return []

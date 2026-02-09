#!/bin/bash

# Parameters
ENV_STRING=$1
PROJECT_NAME=$2
MAIN_DIR=${3:-"./"} # Defaults to ./ if not provided

# Construct the target path
TARGET_PATH="/var/www/${PROJECT_NAME}/${MAIN_DIR}"

echo "Syncing environment variables for project: ${PROJECT_NAME}..."

# 1. Navigate to the project directory
if [ -d "$TARGET_PATH" ]; then
    cd "$TARGET_PATH" || { echo "Failed to enter directory $TARGET_PATH"; exit 1; }
else
    echo "Error: Directory $TARGET_PATH does not exist."
    exit 1
fi

# 2. Check for .env file and process
ENV_FILE=".env"

if [ ! -f "$ENV_FILE" ]; then
    echo "Creating new .env file..."
    # Interpret backslash escapes (\n) to create a formatted file
    echo -e "$ENV_STRING" > "$ENV_FILE"
    echo ".env file created successfully."
else
    echo ".env file exists. Updating/Adding values..."
    # Convert the input string into lines and loop through them
    echo -e "$ENV_STRING" | while IFS= read -r line || [[ -n "$line" ]]; do
        # Skip empty lines
        [[ -z "$line" ]] && continue
        
        # Extract the key (everything before the =)
        KEY=$(echo "$line" | cut -d '=' -f 1)
        
        # Check if the key already exists in the file
        if grep -q "^${KEY}=" "$ENV_FILE"; then
            # Update the existing key
            # Uses sed to find the line starting with KEY= and replace the whole line
            sed -i "s|^${KEY}=.*|${line}|" "$ENV_FILE"
            echo "Updated: $KEY"
        else
            # Append the new key
            echo "$line" >> "$ENV_FILE"
            echo "Added: $KEY"
        fi
    done
fi

echo "Environment sync complete."
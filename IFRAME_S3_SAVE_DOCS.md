# S3 File Save API Documentation for Iframe Project

## Overview

This document describes how to implement S3 file saving functionality in the iframe project. The parent VibeGame application will handle receiving SB3 files from the iframe and saving them to S3 bucket, updating the current project file.

## Implementation for Iframe Project

### 1. Save SB3 File to S3

When the user wants to save their project, the iframe should send a message to the parent window with the SB3 file data.

#### Message Format

```javascript
const saveFile = async (sb3FileData, filename = 'project.sb3') => {
    return new Promise((resolve, reject) => {
        const requestId = `save_${Date.now()}_${Math.random()}`;
        
        const handleResponse = (event) => {
            if (event.data.source === 'alpha-parent' && event.data.requestId === requestId) {
                window.removeEventListener('message', handleResponse);
                if (event.data.error) {
                    reject(new Error(event.data.error));
                } else {
                    resolve(event.data.result);
                }
            }
        };

        window.addEventListener('message', handleResponse);
        
        // Send save request to parent
        window.parent.postMessage({
            source: 'alpha-iframe',
            action: 'saveSb3File',
            payload: {
                fileData: sb3FileData, // Base64 encoded SB3 file data
                filename: filename      // Optional filename, defaults to 'project.sb3'
            },
            requestId
        }, '*');
        
        // Timeout after 30 seconds
        setTimeout(() => {
            window.removeEventListener('message', handleResponse);
            reject(new Error('Save request timeout'));
        }, 30000);
    });
};
```

#### Usage Example

```javascript
// Example: Save current project
async function saveCurrentProject() {
    try {
        // Get the SB3 file data from your Scratch project
        // This should be the complete SB3 file as base64 string
        const sb3Data = await getScratchProjectAsSb3Base64();
        
        const result = await saveFile(sb3Data, 'my-project.sb3');
        
        console.log('✅ File saved successfully:', result);
        // result = {
        //     success: true,
        //     message: 'File saved successfully',
        //     fileKey: 'user-wallet/project-timestamp.sb3',
        //     timestamp: '2023-12-01T10:30:00.000Z'
        // }
        
        // Show success message to user
        showSuccessMessage('Project saved successfully!');
        
    } catch (error) {
        console.error('❌ Save failed:', error);
        showErrorMessage(`Save failed: ${error.message}`);
    }
}

// Function to get Scratch project as SB3 base64 data
async function getScratchProjectAsSb3Base64() {
    // This is project-specific implementation
    // You need to export your Scratch project as SB3 blob, then convert to base64
    
    // Example implementation:
    const projectBlob = await exportProjectAsSb3Blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result.split(',')[1]; // Remove data:application/... prefix
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(projectBlob);
    });
}
```

### 2. Error Handling

The parent will return different types of errors:

```javascript
try {
    await saveFile(sb3Data);
} catch (error) {
    switch (error.message) {
        case 'No wallet connected':
            showMessage('Please connect your wallet to save projects');
            break;
        case 'Missing file data':
            showMessage('No project data to save');
            break;
        case 'No valid authentication token found. Please refresh the page and reconnect your wallet.':
            showMessage('Session expired. Please refresh the page and reconnect your wallet.');
            break;
        case 'Invalid project URL format':
            showMessage('Current project URL is invalid');
            break;
        default:
            showMessage(`Save error: ${error.message}`);
    }
}
```

### 3. UI Integration

#### Save Button Implementation

```javascript
// Add save button to your UI
function createSaveButton() {
    const saveButton = document.createElement('button');
    saveButton.textContent = '💾 Save Project';
    saveButton.className = 'save-button';
    saveButton.onclick = async () => {
        saveButton.disabled = true;
        saveButton.textContent = '💾 Saving...';
        
        try {
            await saveCurrentProject();
            saveButton.textContent = '✅ Saved!';
            setTimeout(() => {
                saveButton.textContent = '💾 Save Project';
                saveButton.disabled = false;
            }, 2000);
        } catch (error) {
            saveButton.textContent = '❌ Save Failed';
            setTimeout(() => {
                saveButton.textContent = '💾 Save Project';
                saveButton.disabled = false;
            }, 3000);
        }
    };
    
    return saveButton;
}

// Add to your toolbar
const toolbar = document.querySelector('.scratch-toolbar');
toolbar.appendChild(createSaveButton());
```

#### Auto-save Implementation

```javascript
let autoSaveTimeout;
let lastSavedData = null;

function scheduleAutoSave() {
    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(async () => {
        try {
            const currentData = await getScratchProjectAsSb3Base64();
            
            // Only save if data has changed
            if (currentData !== lastSavedData) {
                await saveFile(currentData, 'autosave.sb3');
                lastSavedData = currentData;
                console.log('📱 Auto-saved project');
                showAutoSaveIndicator();
            }
        } catch (error) {
            console.warn('Auto-save failed:', error);
        }
    }, 5000); // Auto-save after 5 seconds of inactivity
}

// Call this whenever the project changes
function onProjectChange() {
    scheduleAutoSave();
}

// Hook into Scratch's project change events
// This depends on your Scratch implementation
vm.on('PROJECT_CHANGED', onProjectChange);
```

### 4. Status Messages

```javascript
function showSuccessMessage(message) {
    const toast = document.createElement('div');
    toast.className = 'save-toast success';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function showErrorMessage(message) {
    const toast = document.createElement('div');
    toast.className = 'save-toast error';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 5000);
}

function showAutoSaveIndicator() {
    const indicator = document.querySelector('.autosave-indicator') || 
                     document.createElement('div');
    indicator.className = 'autosave-indicator';
    indicator.textContent = '✅ Auto-saved';
    
    if (!indicator.parentNode) {
        document.body.appendChild(indicator);
    }
    
    setTimeout(() => {
        indicator.textContent = '';
    }, 2000);
}
```

### 5. CSS Styles

```css
.save-button {
    background: #4CAF50;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    margin: 4px;
}

.save-button:hover {
    background: #45a049;
}

.save-button:disabled {
    background: #cccccc;
    cursor: not-allowed;
}

.save-toast {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 24px;
    border-radius: 4px;
    color: white;
    font-weight: bold;
    z-index: 10000;
    animation: slideIn 0.3s ease-out;
}

.save-toast.success {
    background: #4CAF50;
}

.save-toast.error {
    background: #f44336;
}

.autosave-indicator {
    position: fixed;
    bottom: 20px;
    left: 20px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 12px;
    z-index: 10000;
}

@keyframes slideIn {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}
```

## Important Notes

1. **File Format**: The `fileData` must be a base64-encoded SB3 file
2. **Authentication**: Users must have a connected wallet and valid JWT token
3. **File Update**: This will update the existing project file in S3, not create a new one
4. **Size Limits**: Be aware of browser message size limits for large projects
5. **Error Handling**: Always implement proper error handling and user feedback
6. **Auto-save**: Consider implementing auto-save for better user experience

## Testing

To test the implementation:

1. Open the editor page with a project
2. Make changes in the iframe
3. Trigger the save functionality
4. Check browser console for success/error messages
5. Verify the file was updated in S3 bucket

## Support

If you need help implementing this functionality, check:

1. Browser console for detailed error messages
2. Network tab for API request/response details
3. Ensure wallet is connected and authenticated
4. Verify the project URL format is correct 
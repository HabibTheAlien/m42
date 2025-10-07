// =============================================================================
// CONFIGURATION - UPDATE THESE VALUES FOR YOUR REPOSITORY
// =============================================================================

// Replace with your GitHub username and repository name
const REPO_OWNER = 'habibthealien';
const REPO_NAME = 'm42';

// Replace with your GitHub Personal Access Token (classic)
// IMPORTANT: This token must have repo permissions
// WARNING: This token will be visible in client-side code
// Consider creating a token with minimal permissions for security
const GITHUB_TOKEN = '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';

// Replace with your desired password for the upload section
const UPLOAD_PASSWORD = '1418705422';

// Folder in your repository where files will be uploaded
const UPLOAD_FOLDER = 'uploads';

// =============================================================================
// END OF CONFIGURATION
// =============================================================================

// API endpoints
const GITHUB_API_BASE = 'https://api.github.com';
const REPO_CONTENTS_URL = `${GITHUB_API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/contents`;
const UPLOAD_FOLDER_URL = `${REPO_CONTENTS_URL}/${UPLOAD_FOLDER}`;

// DOM elements
const uploadSection = document.getElementById('uploadSection');
const passwordSection = document.getElementById('passwordSection');
const passwordInput = document.getElementById('passwordInput');
const passwordButton = document.getElementById('passwordButton');
const fileInput = document.getElementById('fileInput');
const uploadButton = document.getElementById('uploadButton');
const uploadStatus = document.getElementById('uploadStatus');
const fileList = document.getElementById('fileList');
const fileCount = document.getElementById('fileCount');

// State
let isUploadUnlocked = false;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Load the file list
    loadFileList();
    
    // Set up event listeners
    passwordButton.addEventListener('click', handlePasswordSubmit);
    passwordInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') handlePasswordSubmit();
    });
    
    uploadButton.addEventListener('click', handleFileUpload);
});

// Handle password submission
function handlePasswordSubmit() {
    const password = passwordInput.value.trim();
    
    if (password === UPLOAD_PASSWORD) {
        isUploadUnlocked = true;
        uploadSection.classList.remove('hidden');
        passwordSection.classList.add('hidden');
        uploadStatus.textContent = 'Upload unlocked. You can now upload files.';
        uploadStatus.className = 'success';
    } else {
        uploadStatus.textContent = 'Incorrect password. Please try again.';
        uploadStatus.className = 'error';
    }
    
    passwordInput.value = '';
}

// Load and display the file list from GitHub
async function loadFileList() {
    try {
        fileList.innerHTML = '<p>Loading files...</p>';
        
        const response = await fetch(UPLOAD_FOLDER_URL, {
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to fetch files: ${response.status}`);
        }
        
        const files = await response.json();
        
        if (!Array.isArray(files) || files.length === 0) {
            fileList.innerHTML = '<p>No files uploaded yet.</p>';
            fileCount.textContent = '0 files';
            return;
        }
        
        // Group files by date
        const groupedFiles = await groupFilesByDate(files);
        
        // Display files
        displayFileList(groupedFiles);
        
        // Update file count
        fileCount.textContent = `${files.length} file${files.length !== 1 ? 's' : ''}`;
        
    } catch (error) {
        console.error('Error loading file list:', error);
        fileList.innerHTML = `<p class="error">Error loading files: ${error.message}</p>`;
        fileCount.textContent = 'Error loading files';
    }
}

// Group files by their upload date
async function groupFilesByDate(files) {
    const grouped = {};
    
    for (const file of files) {
        if (file.type !== 'file') continue;
        
        // Get commit date for the file
        const commitDate = await getFileCommitDate(file.path);
        const dateKey = formatDate(commitDate);
        
        if (!grouped[dateKey]) {
            grouped[dateKey] = [];
        }
        
        grouped[dateKey].push({
            name: file.name,
            downloadUrl: file.download_url,
            size: file.size
        });
    }
    
    return grouped;
}

// Get the commit date for a file
async function getFileCommitDate(filePath) {
    try {
        const response = await fetch(
            `${GITHUB_API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/commits?path=${filePath}&per_page=1`,
            {
                headers: {
                    'Authorization': `token ${GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );
        
        if (!response.ok) {
            // If we can't get the commit date, use the current date as fallback
            return new Date();
        }
        
        const commits = await response.json();
        
        if (commits.length > 0) {
            return new Date(commits[0].commit.committer.date);
        }
        
        return new Date();
    } catch (error) {
        console.error('Error getting commit date:', error);
        return new Date();
    }
}

// Format date as "DD Month, YYYY"
function formatDate(date) {
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// Display the file list grouped by date
function displayFileList(groupedFiles) {
    if (Object.keys(groupedFiles).length === 0) {
        fileList.innerHTML = '<p>No files uploaded yet.</p>';
        return;
    }
    
    // Sort dates in descending order (newest first)
    const sortedDates = Object.keys(groupedFiles).sort((a, b) => {
        return new Date(b) - new Date(a);
    });
    
    let html = '';
    
    sortedDates.forEach((date, dateIndex) => {
        html += `<div class="file-group">`;
        html += `<div class="file-date">${date}</div>`;
        
        // Sort files by name within each date group
        const sortedFiles = groupedFiles[date].sort((a, b) => 
            a.name.localeCompare(b.name)
        );
        
        sortedFiles.forEach((file, fileIndex) => {
            const fileExtension = file.name.split('.').pop().toLowerCase();
            const fileIcon = getFileIcon(fileExtension);
            
            html += `
                <div class="file-item">
                    <a href="${file.downloadUrl}" class="file-link" download>
                        <span class="file-icon">${fileIcon}</span>
                        ${fileIndex + 1}. ${file.name}
                    </a>
                </div>
            `;
        });
        
        html += `</div>`;
    });
    
    fileList.innerHTML = html;
}

// Get appropriate icon for file type
function getFileIcon(extension) {
    switch (extension) {
        case 'csv':
            return '📊';
        case 'dta':
            return '📈';
        case 'sav':
            return '📋';
        default:
            return '📄';
    }
}

// Handle file upload
async function handleFileUpload() {
    if (!isUploadUnlocked) {
        uploadStatus.textContent = 'Please unlock upload section first.';
        uploadStatus.className = 'error';
        return;
    }
    
    const files = fileInput.files;
    
    if (files.length === 0) {
        uploadStatus.textContent = 'Please select at least one file to upload.';
        uploadStatus.className = 'error';
        return;
    }
    
    uploadButton.disabled = true;
    uploadStatus.textContent = 'Uploading files...';
    uploadStatus.className = '';
    
    try {
        let successCount = 0;
        let errorCount = 0;
        
        // Upload each file
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            try {
                await uploadFileToGitHub(file);
                successCount++;
                
                // Update status during upload
                uploadStatus.textContent = `Uploading... (${successCount}/${files.length} completed)`;
            } catch (error) {
                console.error(`Error uploading ${file.name}:`, error);
                errorCount++;
            }
        }
        
        // Final status message
        if (successCount === files.length) {
            uploadStatus.textContent = `Successfully uploaded ${successCount} file${successCount !== 1 ? 's' : ''}.`;
            uploadStatus.className = 'success';
        } else if (successCount > 0) {
            uploadStatus.textContent = `Uploaded ${successCount} file${successCount !== 1 ? 's' : ''}, ${errorCount} failed.`;
            uploadStatus.className = errorCount > 0 ? 'error' : 'success';
        } else {
            uploadStatus.textContent = 'All uploads failed. Please try again.';
            uploadStatus.className = 'error';
        }
        
        // Clear file input
        fileInput.value = '';
        
        // Reload the file list
        await loadFileList();
        
    } catch (error) {
        console.error('Upload error:', error);
        uploadStatus.textContent = `Upload failed: ${error.message}`;
        uploadStatus.className = 'error';
    } finally {
        uploadButton.disabled = false;
    }
}

// Upload a single file to GitHub
async function uploadFileToGitHub(file) {
    // Convert file to base64
    const base64Content = await fileToBase64(file);
    
    // Prepare the API request
    const uploadUrl = `${UPLOAD_FOLDER_URL}/${file.name}`;
    const commitMessage = `Upload ${file.name}`;
    
    const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            message: commitMessage,
            content: base64Content.split(',')[1] // Remove data URL prefix
        })
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Upload failed with status ${response.status}`);
    }
    
    return await response.json();
}

// Convert a file to base64 encoding
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });

}

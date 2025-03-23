document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const selectFileBtn = document.getElementById('selectFileBtn');
    const editorContainer = document.getElementById('editorContainer');
    const previewImage = document.getElementById('previewImage');
    const originalSizeEl = document.getElementById('originalSize');
    const newSizeEl = document.getElementById('newSize');
    const fileSizeEl = document.getElementById('fileSize');
    const widthInput = document.getElementById('widthInput');
    const heightInput = document.getElementById('heightInput');
    const maintainAspectRatio = document.getElementById('maintainAspectRatio');
    const formatSelect = document.getElementById('formatSelect');
    const qualitySlider = document.getElementById('qualitySlider');
    const qualityValue = document.getElementById('qualityValue');
    const processBtn = document.getElementById('processBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const resetBtn = document.getElementById('resetBtn');
    const presetButtons = document.querySelectorAll('.preset-buttons button');  // Keep this declaration
    const showGuideBtn = document.getElementById('showGuideBtn');
    const closeGuideBtn = document.getElementById('closeGuideBtn');
    const userGuide = document.getElementById('userGuide');
    const rotateLeft = document.getElementById('rotateLeft');
    const rotateRight = document.getElementById('rotateRight');
    const enableCropUI = document.getElementById('enableCropUI');
    const cropPreviewContainer = document.getElementById('cropPreviewContainer');
    const cropPreview = document.getElementById('cropPreview');
    const flipHorizontalBtn = document.getElementById('flipHorizontal');
    const flipVerticalBtn = document.getElementById('flipVertical');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    let cropper = null;

    // Add loading indicator elements
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading';
    loadingIndicator.innerHTML = '<div class="loading-spinner"></div>';
    document.body.appendChild(loadingIndicator);

    // Add error message container
    const errorMessage = document.createElement('div');
    errorMessage.className = 'error-message';
    editorContainer.appendChild(errorMessage);

    // Initialize crop-related elements
    if (cropPreviewContainer && cropPreview) {
        cropPreviewContainer.style.display = 'none';
        cropPreview.style.display = 'none';
    }

    // Variables
    let historyIndex = 0;
    let originalImage = null;
    let processedImage = null;
    let originalWidth = 0;
    let originalHeight = 0;
    let aspectRatio = 0;
    let processedBlob = null;
    let imageHistory = []; // Store image processing history for undo/redo
    let rotationAngle = 0; // Track image rotation in degrees
    let flipHorizontal = false; // Track horizontal flip state
    let flipVertical = false; // Track vertical flip state
    let isCropEnabled = false; // Track crop mode state

    // Initialize crop functionality
    if (enableCropUI) {
        enableCropUI.addEventListener('click', () => {
            isCropEnabled = !isCropEnabled;
            if (isCropEnabled && previewImage.src) {
                if (!cropper) {
                    cropper = new Cropper(previewImage, {
                        viewMode: 1,
                        dragMode: 'move',
                        autoCropArea: 0.8,
                        restore: false,
                        guides: true,
                        center: true,
                        highlight: false,
                        cropBoxMovable: true,
                        cropBoxResizable: true,
                        toggleDragModeOnDblclick: false
                    });
                }
                enableCropUI.classList.add('active');
            } else {
                if (cropper) {
                    cropper.destroy();
                    cropper = null;
                }
                enableCropUI.classList.remove('active');
            }
            redrawPreview();
        });
    }

    // Event Listeners
    uploadArea.addEventListener('click', () => fileInput.click());
    selectFileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.click();
    });
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.backgroundColor = 'rgba(74, 108, 247, 0.2)';
    });
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.backgroundColor = 'rgba(74, 108, 247, 0.05)';
    });
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.backgroundColor = 'rgba(74, 108, 247, 0.05)';
        if (e.dataTransfer.files.length) {
            handleFileUpload(e.dataTransfer.files[0]);
        }
    });
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length) {
            handleFileUpload(fileInput.files[0]);
        }
    });

    widthInput.addEventListener('input', () => {
        if (maintainAspectRatio.checked && aspectRatio > 0) {
            heightInput.value = Math.round(widthInput.value / aspectRatio);
        }
        updateNewSize();
        redrawPreview();
    });

    heightInput.addEventListener('input', () => {
        if (maintainAspectRatio.checked && aspectRatio > 0) {
            widthInput.value = Math.round(heightInput.value * aspectRatio);
        }
        updateNewSize();
        redrawPreview();
    });

    // Undo/Redo Button Selection start
    document.addEventListener("DOMContentLoaded", function () {
        const undoBtn = document.getElementById("undoBtn");
        const redoBtn = document.getElementById("redoBtn");
        const widthInput = document.getElementById("widthInput");
        const heightInput = document.getElementById("heightInput");
        const processBtn = document.getElementById("processBtn");
        const presetButtons = document.querySelectorAll(".preset-buttons button");
        const previewImage = document.getElementById("previewImage");
    
        let history = [];
        let redoStack = [];
    
        function saveState() {
            if (previewImage.src) {
                history.push({
                    imageSrc: previewImage.src,
                    width: widthInput.value,
                    height: heightInput.value,
                });
                redoStack = []; // Clear redo stack after new change
                updateUndoRedoButtons();
            }
        }
    
        function updateUndoRedoButtons() {
            undoBtn.disabled = history.length <= 1;
            redoBtn.disabled = redoStack.length === 0;
    
            undoBtn.classList.toggle("disabled", history.length <= 1);
            redoBtn.classList.toggle("disabled", redoStack.length === 0);
        }
    
        undoBtn.addEventListener("click", function () {
            if (history.length > 1) {
                redoStack.push(history.pop()); // Move last state to redo
                const lastState = history[history.length - 1];
                previewImage.src = lastState.imageSrc;
                widthInput.value = lastState.width;
                heightInput.value = lastState.height;
                updateUndoRedoButtons();
            }
        });
    
        redoBtn.addEventListener("click", function () {
            if (redoStack.length > 0) {
                const nextState = redoStack.pop();
                history.push(nextState);
                previewImage.src = nextState.imageSrc;
                widthInput.value = nextState.width;
                heightInput.value = nextState.height;
                updateUndoRedoButtons();
            }
        });
    
        // Save state when image is processed
        processBtn.addEventListener("click", function () {
            setTimeout(() => {
                saveState();
            }, 100);
        });
    
        // Save state when preset size is clicked
        presetButtons.forEach(button => {
            button.addEventListener("click", function () {
                saveState();
            });
        });
    
        // Save state when width/height is manually changed
        widthInput.addEventListener("input", saveState);
        heightInput.addEventListener("input", saveState);
    });
    
    
    // Undo/Redo Button Selection end


    qualitySlider.addEventListener('input', () => {
        qualityValue.textContent = `${qualitySlider.value}%`;
        redrawPreview();
    });

    // Handle preset button selection
    presetButtons.forEach(button => {
        button.addEventListener('click', function() {
            presetButtons.forEach(btn => btn.classList.remove('selected'));
            this.classList.add('selected');
            // Get dimensions from the button's data attributes
            const presetWidth = parseInt(this.getAttribute('data-width'));
            const presetHeight = parseInt(this.getAttribute('data-height'));
            // Update input fields
            widthInput.value = presetWidth;
            heightInput.value = presetHeight;
            // Update preview immediately
            redrawPreview();
            updateNewSize();
        });
    });

    processBtn.addEventListener('click', processImage);
    downloadBtn.addEventListener('click', downloadImage);
    resetBtn.addEventListener('click', resetEditor);

    // Add rotation button event listeners with immediate preview
    rotateLeft.addEventListener('click', () => {
        rotationAngle = (rotationAngle - 90) % 360;
        redrawPreview();
        updateNewSize();
    });

    rotateRight.addEventListener('click', () => {
        rotationAngle = (rotationAngle + 90) % 360;
        redrawPreview();
        updateNewSize();
    });

    flipHorizontalBtn.addEventListener('click', () => {
        flipHorizontal = !flipHorizontal;
        redrawPreview();
        updateNewSize();
    });

    flipVerticalBtn.addEventListener('click', () => {
        flipVertical = !flipVertical;
        redrawPreview();
        updateNewSize();
    });


    // Dark mode toggle
    darkModeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
    });

    // Tab switching for resize options
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            tabBtns.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            btn.classList.add('active');
            // Hide all tab contents
            tabContents.forEach(content => {
                content.style.display = 'none';
            });
            // Show the selected tab content
            const tabId = btn.getAttribute('data-tab');
            document.getElementById(`${tabId}-tab`).style.display = 'block';
        });
    });

    // Sync unit selectors
    const widthUnit = document.getElementById('widthUnit');
    const heightUnit = document.getElementById('heightUnit');
    widthUnit.addEventListener('change', function() {
        heightUnit.value = this.value;
    });
    heightUnit.addEventListener('change', function() {
        widthUnit.value = this.value;
    });

    // Guide buttons
    showGuideBtn.addEventListener('click', (e) => {
        e.preventDefault();
        userGuide.style.display = 'block';
    });

    closeGuideBtn.addEventListener('click', () => {
        userGuide.style.display = 'none';
    });

    // Add keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl+O to open file
        if (e.ctrlKey && e.key === 'o') {
            e.preventDefault();
            fileInput.click();
        }
        // Ctrl+S to save/download
        if (e.ctrlKey && e.key === 's' && !downloadBtn.disabled) {
            e.preventDefault();
            downloadImage();
        }
        // Ctrl+P to process image
        if (e.ctrlKey && e.key === 'p' && originalImage) {
            e.preventDefault();
            processImage();
        }
    });

    // Initialize on load
    document.body.classList.toggle('dark-mode', localStorage.getItem('darkMode') === 'true');

    // Functions
    function handleFileUpload(file) {
        if (!file.type.startsWith('image/')) {
            showError('Please upload an image file');
            return;
        }
        // Cleanup existing cropper instance
        if (cropper) {
            cropper.destroy();
            cropper = null;
        }
        isCropEnabled = false;
        if (enableCropUI) {
            enableCropUI.classList.remove('active');
        }
        showLoading(true);
        const reader = new FileReader();
        reader.onload = function(e) {
            originalImage = new Image();
            originalImage.onload = function() {
                originalWidth = originalImage.width;
                originalHeight = originalImage.height;
                aspectRatio = originalWidth / originalHeight;
                // Set initial dimensions
                widthInput.value = originalWidth;
                heightInput.value = originalHeight;
                // Display image and show editor
                previewImage.src = e.target.result;
                editorContainer.style.display = 'flex';
                uploadArea.style.display = 'none';
                // Update info
                originalSizeEl.textContent = `${originalWidth}×${originalHeight}px`;
                updateNewSize();
                // Display file size
                const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
                fileSizeEl.textContent = `${fileSizeMB} MB`;
                showLoading(false);
            };
            originalImage.onerror = function() {
                showError('Failed to load image. Please try another file.');
                showLoading(false);
            };
            originalImage.src = e.target.result;
        };
        reader.onerror = function() {
            showError('Failed to read file. Please try again.');
            showLoading(false);
        };
        reader.readAsDataURL(file);
    }

    function processImage() {
        if (!originalImage) return;
        showLoading(true);
        processBtn.disabled = true;
        setTimeout(() => {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                let sourceX = 0;
                let sourceY = 0;
                let sourceWidth = originalImage.width;
                let sourceHeight = originalImage.height;
                // Handle cropping if active
                if (cropper) {
                    const cropData = cropper.getData();
                    sourceX = cropData.x;
                    sourceY = cropData.y;
                    sourceWidth = cropData.width;
                    sourceHeight = cropData.height;
                }
                const newWidth = parseInt(widthInput.value);
                const newHeight = parseInt(heightInput.value);
                if (isNaN(newWidth) || isNaN(newHeight) || newWidth <= 0 || newHeight <= 0) {
                    throw new Error('Please enter valid dimensions.');
                }
                canvas.width = newWidth;
                canvas.height = newHeight;
                // Apply transformations
                ctx.save();
                // Adjust canvas dimensions for rotation
                if (Math.abs(rotationAngle) === 90 || Math.abs(rotationAngle) === 270) {
                    [canvas.width, canvas.height] = [canvas.height, canvas.width];
                    [newWidth, newHeight] = [newHeight, newWidth];
                }
                // Center and rotate
                ctx.translate(canvas.width / 2, canvas.height / 2);
                ctx.rotate((rotationAngle * Math.PI) / 180);
                // Handle flips
                if (flipHorizontal || flipVertical) {
                    ctx.scale(flipHorizontal ? -1 : 1, flipVertical ? -1 : 1);
                    if (flipHorizontal) {
                        ctx.translate(-canvas.width, 0);
                    }
                    if (flipVertical) {
                        ctx.translate(0, -canvas.height);
                    }
                }
                // Draw the image with all transformations
                ctx.drawImage(
                    originalImage,
                    sourceX, sourceY,
                    sourceWidth, sourceHeight,
                    -newWidth / 2, -newHeight / 2,
                    newWidth, newHeight
                );
                ctx.restore();
                const format = formatSelect.value;
                const quality = parseInt(qualitySlider.value) / 100;
                let mimeType;
                switch(format) {
                    case 'jpeg': mimeType = 'image/jpeg'; break;
                    case 'png': mimeType = 'image/png'; break;
                    case 'webp': mimeType = 'image/webp'; break;
                    case 'gif': mimeType = 'image/gif'; break;
                    default: mimeType = 'image/jpeg';
                }
                canvas.toBlob(blob => {
                    processedBlob = blob;
                    const url = URL.createObjectURL(blob);
                    // Clear future history if we're not at the end
                    if (historyIndex < imageHistory.length - 1) {
                        imageHistory = imageHistory.slice(0, historyIndex + 1);
                    }
                    imageHistory.push({
                        blob: blob,
                        width: newWidth,
                        height: newHeight,
                        format: format,
                        quality: quality,
                        rotation: rotationAngle,
                        flipX: flipHorizontal,
                        flipY: flipVertical
                    });
                    previewImage.src = url;
                    const fileSizeMB = (blob.size / (1024 * 1024)).toFixed(2);
                    fileSizeEl.textContent = `${fileSizeMB} MB`;
                    downloadBtn.disabled = false;
                    historyIndex = imageHistory.length - 1;
                    showLoading(false);
                }, mimeType, quality);
            } catch (error) {
                showError(error.message || 'An error occurred during processing.');
                showLoading(false);
            }
        }, 100);
    }

function downloadImage() {
    if (!processedBlob) return;
    showLoading(true);
    
    // Create a canvas to apply the current transformations
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Get current state from the latest history entry
    const currentState = imageHistory[historyIndex];
    const newWidth = currentState.width;
    const newHeight = currentState.height;
    
    // Set canvas dimensions based on rotation from current state
    if (Math.abs(currentState.rotation) === 90 || Math.abs(currentState.rotation) === 270) {
        canvas.width = newHeight;
        canvas.height = newWidth;
    } else {
        canvas.width = newWidth;
        canvas.height = newHeight;
    }
    
    // Apply transformations
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((currentState.rotation * Math.PI) / 180);
    
    // Handle flips
    if (currentState.flipX || currentState.flipY) {
        ctx.scale(currentState.flipX ? -1 : 1, currentState.flipY ? -1 : 1);
    }
    
    // Create a temporary image from the current preview
    const img = new Image();
    img.src = previewImage.src;
    img.onload = function() {
        // Draw the image with all transformations
        ctx.drawImage(
            img,
            -newWidth / 2, -newHeight / 2,
            newWidth, newHeight
        );
        ctx.restore();
        
        // Convert to blob with current format and quality
        const format = formatSelect.value;
        const quality = parseInt(qualitySlider.value) / 100;
        let mimeType;
        switch(format) {
            case 'jpeg': mimeType = 'image/jpeg'; break;
            case 'png': mimeType = 'image/png'; break;
            case 'webp': mimeType = 'image/webp'; break;
            case 'gif': mimeType = 'image/gif'; break;
            default: mimeType = 'image/jpeg';
        }
        
        canvas.toBlob(blob => {
            const filename = `resized_image_${new Date().getTime()}.${format}`;
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            showLoading(false);
            // Show success message
            showMessage('Image downloaded successfully!', 'success');
        }, mimeType, quality);
    };
}

    function undo() {
        if (historyIndex > 0) {
            historyIndex--;
            const state = imageHistory[historyIndex];
            processedBlob = state.blob;
            // Update UI with previous state
            previewImage.src = URL.createObjectURL(state.blob);
            widthInput.value = state.width;
            heightInput.value = state.height;
            formatSelect.value = state.format;
            qualitySlider.value = state.quality * 100;
            qualityValue.textContent = `${state.quality * 100}%`;
            rotationAngle = state.rotation;
            flipHorizontal = state.flipX;
            flipVertical = state.flipY;
            // Update display size and file size
            updateNewSize();
            const fileSizeMB = (state.blob.size / (1024 * 1024)).toFixed(2);
            fileSizeEl.textContent = `${fileSizeMB} MB`;
            updateUndoRedoState();
            // Enable/disable buttons appropriately
            downloadBtn.disabled = false;
            processBtn.disabled = false;
        }
    }

    function redo() {
        if (historyIndex < imageHistory.length - 1) {
            historyIndex++;
            const state = imageHistory[historyIndex];
            processedBlob = state.blob;
            // Update UI with next state
            previewImage.src = URL.createObjectURL(state.blob);
            widthInput.value = state.width;
            heightInput.value = state.height;
            formatSelect.value = state.format;
            qualitySlider.value = state.quality * 100;
            qualityValue.textContent = `${state.quality * 100}%`;
            rotationAngle = state.rotation;
            flipHorizontal = state.flipX;
            flipVertical = state.flipY;
            // Update display size and file size
            updateNewSize();
            const fileSizeMB = (state.blob.size / (1024 * 1024)).toFixed(2);
            fileSizeEl.textContent = `${fileSizeMB} MB`;
            updateUndoRedoState();
            // Enable/disable buttons appropriately
            downloadBtn.disabled = false;
            processBtn.disabled = false;
        }
    }


    function redrawPreview() {
        if (!originalImage) return;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        let width = parseInt(widthInput.value) || originalImage.width;
        let height = parseInt(heightInput.value) || originalImage.height;
        // Adjust canvas dimensions based on rotation
        if (Math.abs(rotationAngle) === 90 || Math.abs(rotationAngle) === 270) {
            canvas.width = height;
            canvas.height = width;
            // Swap width and height for drawing
            [width, height] = [height, width];
        } else {
            canvas.width = width;
            canvas.height = height;
        }
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Save the current state
        ctx.save();
        // Move to center of canvas
        ctx.translate(canvas.width / 2, canvas.height / 2);
        // Apply rotation
        ctx.rotate((rotationAngle * Math.PI) / 180);
        // Apply flips
        ctx.scale(flipHorizontal ? -1 : 1, flipVertical ? -1 : 1);
        // Draw image centered
        let sourceImage = originalImage;
        if (cropper && cropper.getCroppedCanvas()) {
            sourceImage = cropper.getCroppedCanvas();
        }
        ctx.drawImage(
            sourceImage,
            -width / 2,
            -height / 2,
            width,
            height
        );
        // Restore context
        ctx.restore();
        // Update preview with correct format and quality
        canvas.toBlob(blob => {
            previewImage.src = URL.createObjectURL(blob);
            updateNewSize();
        }, formatSelect.value, qualitySlider.value / 100);
    }

    function updateNewSize() {
        if (widthInput.value && heightInput.value) {
            newSizeEl.textContent = `${widthInput.value}×${heightInput.value}px`;
        }
    }

function updateUndoRedoState() {
    const undoBtn = document.getElementById("undoBtn");
    const redoBtn = document.getElementById("redoBtn");
    undoBtn.disabled = historyIndex <= 0;
    redoBtn.disabled = historyIndex >= imageHistory.length - 1;
    undoBtn.classList.toggle("disabled", historyIndex <= 0);
    redoBtn.classList.toggle("disabled", historyIndex >= imageHistory.length - 1);
}

function resetEditor() {
    if (confirm('Are you sure you want to reset? This will clear your current image.')) {
        editorContainer.style.display = 'none';
        uploadArea.style.display = 'block';
        previewImage.src = '';
        fileInput.value = '';
        originalImage = null;
        processedBlob = null;
        downloadBtn.disabled = true;
        imageHistory = [];
        historyIndex = 0;
        updateUndoRedoState();
    }
}

    function showLoading(show) {
        loadingIndicator.style.display = show ? 'flex' : 'none';
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        // Hide error after 5 seconds
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 5000);
    }

    function showMessage(message, type) {
        const messageEl = document.createElement('div');
        messageEl.className = `message ${type}`;
        messageEl.textContent = message;
        document.body.appendChild(messageEl);
        // Animate in
        setTimeout(() => {
            messageEl.style.opacity = '1';
            messageEl.style.transform = 'translateY(0)';
        }, 10);
        // Remove after 3 seconds
        setTimeout(() => {
            messageEl.style.opacity = '0';
            messageEl.style.transform = 'translateY(-20px)';
            setTimeout(() => {
                document.body.removeChild(messageEl);
            }, 300);
        }, 3000);
    }
});

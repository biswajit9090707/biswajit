// Handle size selection in the admin panel
document.addEventListener('DOMContentLoaded', function() {
    const sizeOptions = document.querySelectorAll('.size-option');
    const sizesInput = document.getElementById('sizes');
    
    if (!sizeOptions.length || !sizesInput) return;
    
    // Update hidden input when checkboxes change
    function updateSizes() {
        const selectedSizes = [];
        sizeOptions.forEach(checkbox => {
            if (checkbox.checked) {
                selectedSizes.push(checkbox.value);
            }
        });
        sizesInput.value = selectedSizes.join(',');
    }
    
    // Add event listeners to all size checkboxes
    sizeOptions.forEach(checkbox => {
        checkbox.addEventListener('change', updateSizes);
    });
    
    // Initial update
    updateSizes();
});

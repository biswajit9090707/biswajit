// Handle Get Image Link buttons
document.addEventListener('DOMContentLoaded', function() {
    // Add click event listeners to all Get Image Link buttons
    document.querySelectorAll('.get-link-btn').forEach((button, index) => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            // Open image2url.com in a new tab
            window.open('https://www.image2url.com', '_blank');
            
            // Optional: Focus the corresponding input field
            const input = this.previousElementSibling;
            if (input && input.classList.contains('image-url')) {
                input.focus();
            }
        });
    });
});

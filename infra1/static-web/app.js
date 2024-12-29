document.getElementById("uploadForm").onsubmit = async function (e) {
    e.preventDefault();
    const fileInput = document.getElementById("videoFile");
    const file = fileInput.files[0];

    if (!file) {
        alert("Please select a video file before uploading.");
        return;
    }

    // Prepare FormData for file upload
    const formData = new FormData();
    formData.append("file", file);

    try {
        // Make POST request to upload video
        const response = await fetch("https://hx6i4l3jl7.execute-api.us-east-1.amazonaws.com/dev/upload", {
            method: "POST",
            body: formData,
            mode: 'no-cors'
        });

        if (response.ok) {
            const result = await response.json();
            alert(`Video uploaded successfully!`);
            fileInput.value = ""; // Clear the file input field
            fetchVideos(); // Refresh the video list to display uploaded video
        } else {
            const errorText = await response.text(); // Parse response text if JSON fails
            console.error("Error response from upload:", errorText);
            alert(`Error uploading video: ${errorText || "Unknown error"}`);
        }
    } catch (err) {
        console.error("Error uploading video:", err);
        alert("An error occurred while uploading the video. Please check the console for details.");
    }
};

async function fetchVideos() {
    try {
        // Make GET request to fetch video metadata
        const response = await fetch("https://hx6i4l3jl7.execute-api.us-east-1.amazonaws.com/dev/fetch");

        if (response.ok) {
            const videos = await response.json();

            const videoList = document.getElementById("videoList");
            if (videos.length === 0) {
                videoList.innerHTML = "<p>No videos available.</p>";
                return;
            }

            // Render video list dynamically
            videoList.innerHTML = videos
                .map(
                    (video) =>
                        `<div style="margin-bottom: 20px;">
                            <video controls width="480" style="display: block; margin-bottom: 10px;">
                                <source src="${video.url}" type="video/mp4">
                                Your browser does not support the video tag.
                            </video>
                            <p>${video.title || "Untitled Video"}</p>
                        </div>`
                )
                .join("");
        } else {
            const errorText = await response.text(); // Parse response text if JSON fails
            console.error("Error response from fetch:", errorText);
            alert(`Error fetching videos: ${errorText || "Unknown error"}`);
        }
    } catch (err) {
        console.error("Error fetching videos:", err);
        alert("An error occurred while fetching videos. Please check the console for details.");
    }
}

// Fetch and display videos when the page loads
fetchVideos();

document.getElementById("uploadForm").onsubmit = async function (e) {
    e.preventDefault();
    const fileInput = document.getElementById("videoFile");
    const file = fileInput.files[0];

    if (!file) {
        alert("Please select a video file before uploading.");
        return;
    }

    try {
        const response = await fetch("https://hx6i4l3jl7.execute-api.us-east-1.amazonaws.com/dev/upload", {
            method: "POST",
            body: file,
            headers: {
                "Content-Type": file.type,
                "X-File-Name": encodeURIComponent(file.name),
            },
        });

        if (response.ok) {
            const result = await response.json();
            alert("Video uploaded successfully!");
            fileInput.value = ""; // Clear the file input field
            fetchVideos(); // Refresh video list
        } else {
            const errorText = await response.text();
            console.error("Error response from upload:", errorText);
            alert(`Error uploading video: ${errorText || "Unknown error"}`);
        }
    } catch (err) {
        console.error("Error uploading video:", err);
        alert("An error occurred while uploading the video.");
    }
};

async function fetchVideos() {
    try {
        const response = await fetch("https://hx6i4l3jl7.execute-api.us-east-1.amazonaws.com/dev/fetch");

        if (response.ok) {
            const videos = await response.json();
            const videoList = document.getElementById("videoList");

            if (videos.length === 0) {
                videoList.innerHTML = "<p>No videos available.</p>";
                return;
            }

            videoList.innerHTML = videos
                .map(
                    (video) => `
                    <div>
                        <video controls width="480">
                            <source src="${video.url}" type="${video.contentType}">
                            Your browser does not support the video tag.
                        </video>
                        <p>${video.title || "Untitled Video"}</p>
                    </div>
                `
                )
                .join("");
        } else {
            const errorText = await response.text();
            console.error("Error response from fetch:", errorText);
            alert(`Error fetching videos: ${errorText || "Unknown error"}`);
        }
    } catch (err) {
        console.error("Error fetching videos:", err);
        alert("An error occurred while fetching videos.");
    }
}

// Fetch and display videos when the page loads
fetchVideos();
